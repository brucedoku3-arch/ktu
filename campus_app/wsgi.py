import os
import sys
from pathlib import Path

# Add current directory to Python path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app import create_app
from config import config_by_name

# Standard WSGI entry point initializing create_app('production')
application = create_app("production")
app = application  # Alias for common WSGI runners (Gunicorn / uWSGI)

if __name__ == "__main__":
    # Local fallback server execution
    application.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
