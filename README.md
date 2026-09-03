# prelegal
A platform for drafting common legal agreements

## Running locally

Requires Docker with Compose V2 (`docker compose`, bundled with recent Docker Desktop).

```bash
# Mac
scripts/start-mac.sh
scripts/stop-mac.sh

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows (PowerShell)
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

The app is available at http://localhost:8000. The SQLite database is recreated from scratch every time the container starts.
