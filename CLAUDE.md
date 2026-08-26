# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 document types in catalog.json via a document picker + freeform AI chat interface (no manual forms) running on a FastAPI + statically-exported-Next.js foundation. See "Implementation Status" below for what is actually built versus planned.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PA-3)
- Mutual NDA creator prototype: manual form, live preview, client-side PDF download (no backend calls)

### Completed (PA-4)
- Docker multi-stage build (Node frontend + Python backend)
- FastAPI backend (`backend/`, a uv project) with SQLite, recreated fresh on every container start
- Next.js static export (`output: 'export'`) served by FastAPI at localhost:8000
- Auth routes exist as stubs only — `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me` validate request shape but return `501 Not Implemented`; no password hashing, sessions, or JWTs yet
- `users` table created on startup, not yet written to by any route
- Start/stop scripts for Mac, Linux, Windows (`scripts/`, wrapping `docker compose`)
- `GET /api/health` health check
- No frontend UI changes — the NDA creator looks and behaves exactly as in PA-3; nothing in the frontend calls the backend yet

### Completed (PA-5)
- AI chat interface for the Mutual NDA (still just the one document type — the other 10 in catalog.json remain unbuilt): the manual form (`NdaForm.tsx`) is removed and replaced by a freeform chat (`frontend/components/ChatPanel.tsx`) that asks the user about the deal and its fields
- New `POST /api/chat` endpoint (`backend/app/routers/chat.py`, `backend/app/nda_chat.py`): one LiteLLM/OpenRouter/Cerebras Structured Outputs call per turn (per the `cerebras` skill), returning a conversational reply plus the complete current best-known value of every NDA field (nulls for anything not yet known) and an `is_complete` flag
- Stateless by design: no chat/message persistence table. The frontend keeps the message history and confirmed fields in React state and resends the full history each turn; nothing survives a page refresh
- The frontend only sends fields the chat has actually confirmed to the backend (kept separate from the form's own UI default values like "fixed 1-year term"), so the assistant still asks about term structure instead of assuming the user already chose the defaults
- `docker-compose.yml` now passes `OPENROUTER_API_KEY` into the container via `env_file: .env`; `backend/app/config.py` also exports it into `os.environ` itself (pydantic-settings' `env_file` only populates the `Settings` object, it doesn't touch `os.environ`, and litellm reads the key straight from the environment) so local non-Docker `uv run` dev works too
- CORS added to the backend (`localhost:3000`/`127.0.0.1:3000` only) so `next dev` can call the FastAPI backend directly during local frontend development

### Completed (PA-6)
- Expanded from the single Mutual NDA to all 11 document types in catalog.json. A new `field-schemas.json` at the repo root (sibling to `catalog.json`) is the single hand-authored source of truth for every document's fillable fields (key, label, type, required-ness, prompt hint) — consumed natively by both the backend (Pydantic) and frontend (native JSON import), avoiding an 11x repeat of the old `NdaFormData`/`NdaFields` hand-sync problem.
- **Backend**: `POST /api/chat` is now `document_type`-aware (one endpoint, not 11) — `backend/app/documents/registry.py` loads the field-schema/catalog JSON, `dynamic_schemas.py` builds a concrete Pydantic model per document type per request via `pydantic.create_model()`, and `chat_engine.py` (replaces `nda_chat.py`) generates the system prompt from the registry instead of a hand-copied template. New `GET /api/catalog` serves the document list to the frontend.
- **Frontend**: a document picker (`DocumentPicker.tsx`) is the new entry screen; selecting a type opens `DocumentWorkspace.tsx`, which dispatches to either the original bespoke Mutual NDA components (`NdaPreview`/`NdaPdfDocument`/`DownloadPdfButton` — left untouched, since that template uses bracket/checkbox form syntax, not the `<span class="..._link">` markup the other 10 use) or a **generic, template-driven renderer** (`components/documents/DocumentPreview.tsx` + `DocumentPdfDocument.tsx`) for the other 10.
- The generic renderer works off the actual `templates/*.md` files: a pre-build codegen script (`frontend/scripts/build-templates.mjs` + `parseTemplate.mjs`, wired via the `predev`/`prebuild`/`pretest` npm scripts) parses each template's markdown/span markup into a block/inline IR at build time (`frontend/lib/documents/generated/*.generated.ts`, gitignored) — resolving `<span class="..._link">Label</span>` references against `field-schemas.json` by label text (case-insensitive, possessive- and simple-plural-aware; the `_link` class name itself carries no meaning in this product and is ignored). Only the Mutual NDA templates lack a real cover page in the repo — the other 10's fields were hand-derived from their inline span references + Definitions sections.
- Repeatable structures (PSA's SOW, DPA's approved subprocessors) are modeled as single flat fields for v1, not lists. Addendum-style documents that reference a parent agreement (AI Addendum, BAA, DPA) collect that reference as a free-text field — there's no real cross-document linking since there's still no document persistence.
- Mid-chat document-type switching: the same structured-output call that returns `fields` each turn also returns `suggestedDocumentType` (or null) when the user's latest message suggests a different catalog document; the frontend shows this as a dismissible banner rather than forcing a switch.
- Fixed two bugs while doing this: (1) the chat input now regains focus after every reply or error (`ChatPanel.tsx`); (2) the backend's `is_complete` flag — previously computed but silently discarded by the frontend, which recomputed its own separate NDA-only `REQUIRED_FIELDS` check instead — is now the sole source of truth for Download-button gating, lifted into `DocumentWorkspace` state. The structured-output schema also gained an `askedFollowUp: bool` self-report; if a document isn't complete and the reply doesn't look like it asked a question, `chat_engine.run_chat_turn` deterministically appends a fallback question naming the first missing required field (no extra LLM call).

### Planned (not yet built)
- Functional auth: real password hashing (bcrypt), sessions/JWT in an HttpOnly cookie
- Document persistence (save/load/delete) and a "My Documents" UI
- Auth-aware frontend (login/signup UI, user menu, protected document endpoints)
- Repeatable sub-records as real lists (PSA's multiple SOWs, DPA's multiple subprocessors) instead of single flat fields
- Real cross-document linking for addendum-style documents (AI Addendum, BAA, DPA) instead of a free-text parent-agreement description

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Stub, returns 501
- `POST /api/auth/signin` - Stub, returns 501
- `POST /api/auth/signout` - Stub, returns 501
- `GET /api/auth/me` - Stub, returns 501
- `GET /api/catalog` - Lists the 12 catalog entries / 11 document types
- `POST /api/chat` - Freeform AI chat for any of the 11 document types; body is `{document_type, messages, fields}`, returns `{reply, fields, is_complete, suggested_document_type}`

### Local dev notes
- PA-4 is merged to `main` (2026-08-26).
- PA-5 is merged to `main` (2026-08-26).
- PA-6 is implemented (2026-08-26) — see PR for merge status.
- The Dockerfile's runtime command must pass `--frozen --no-dev` to `uv run` — without it, `uv run` re-resolves and downloads dev dependencies (pytest, httpx, etc.) from the network on every container start, delaying the server coming up.
- The Dockerfile also now `COPY`s `catalog.json` and `field-schemas.json` into the image (`/app/catalog.json`, `/app/field-schemas.json`) with matching `CATALOG_PATH`/`FIELD_SCHEMAS_PATH` env vars — these weren't copied in before PA-6 since nothing server-side read them.
- On Windows, `http://localhost:8000` can occasionally hit a Docker Desktop IPv6 loopback forwarding issue (connection accepts but `ERR_EMPTY_RESPONSE`/no data ever arrives). If that happens, use `http://127.0.0.1:8000` instead, or restart Docker Desktop to reset its port forwarding.
- The frontend's `templates.generated.ts`/`fieldSchemas.generated.ts` (under `frontend/lib/documents/generated/`) are build artifacts, gitignored — they're regenerated automatically by `predev`/`prebuild`/`pretest` npm hooks from `field-schemas.json` and `templates/*.md`. Run `npm run build:templates` manually if you ever need them without running dev/build/test.