import os
import sys
from pathlib import Path

# Add campus_app to sys.path
BASE_DIR = Path(__file__).resolve().parent / "campus_app"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app import create_app
from config import config_by_name

# Standard WSGI entry point initializing create_app('production')
application = create_app("production")
app = application

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
