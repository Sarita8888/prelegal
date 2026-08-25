# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation is a Mutual NDA creator prototype (manual form, no AI chat yet) running on a FastAPI + statically-exported-Next.js foundation. See "Implementation Status" below for what is actually built versus planned.

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

### Planned (not yet built)
- Functional auth: real password hashing (bcrypt), sessions/JWT in an HttpOnly cookie
- AI chat interface for NDA creation (LiteLLM via OpenRouter, Cerebras inference, `gpt-oss-120b`, Structured Outputs — see the `cerebras` skill)
- Support for the remaining 10 document types from catalog.json
- Document persistence (save/load/delete) and a "My Documents" UI
- Auth-aware frontend (login/signup UI, user menu, protected document endpoints)

### Current API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Stub, returns 501
- `POST /api/auth/signin` - Stub, returns 501
- `POST /api/auth/signout` - Stub, returns 501
- `GET /api/auth/me` - Stub, returns 501