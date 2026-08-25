import os
import tempfile
from pathlib import Path

# Must run before `app.config` is imported by any test module, so the
# singleton Settings() picks up an isolated, disposable DB location instead
# of writing into the repo's backend/ directory during test runs.
_TEST_DB_DIR = Path(tempfile.mkdtemp(prefix="prelegal-test-db-"))
os.environ.setdefault("DB_PATH", str(_TEST_DB_DIR / "test.db"))
