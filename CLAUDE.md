# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation is a Mutual NDA creator with a freeform AI chat interface (no manual form) running on a FastAPI + statically-exported-Next.js foundation. See "Implementation Status" below for what is actually built versus planned.

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

### Planned (not yet built)
- Functional auth: real password hashing (bcrypt), sessions/JWT in an HttpOnly cookie
- Support for the remaining 10 document types from catalog.json
- Document persistence (save/load/delete) and a "My Documents" UI
- Auth-aware frontend (login/signup UI, user menu, protected document endpoints)

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Stub, returns 501
- `POST /api/auth/signin` - Stub, returns 501
- `POST /api/auth/signout` - Stub, returns 501
- `GET /api/auth/me` - Stub, returns 501
- `POST /api/chat` - Freeform AI chat for the Mutual NDA; returns `{reply, fields, is_complete}`

### Local dev notes
- PA-4 is merged to `main` (2026-08-26).
- PA-5 is merged to `main` (2026-08-26).
- The Dockerfile's runtime command must pass `--frozen --no-dev` to `uv run` — without it, `uv run` re-resolves and downloads dev dependencies (pytest, httpx, etc.) from the network on every container start, delaying the server coming up.
- On Windows, `http://localhost:8000` can occasionally hit a Docker Desktop IPv6 loopback forwarding issue (connection accepts but `ERR_EMPTY_RESPONSE`/no data ever arrives). If that happens, use `http://127.0.0.1:8000` instead, or restart Docker Desktop to reset its port forwarding.