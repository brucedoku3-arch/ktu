# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PythonAnywhere WSGI Configuration Script for KTU Campus Social
# Path on PythonAnywhere: /var/www/<your_username>_pythonanywhere_com_wsgi.py
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

import os
import sys
from pathlib import Path

# 1. Dynamically resolve PythonAnywhere user home directory
HOME_DIR = Path.home()
USERNAME = os.getenv("PYTHONANYWHERE_USER") or HOME_DIR.name or "your_username"

# Locate project directory with robust fallback resolution
candidate_dirs = [
    HOME_DIR / "campus_app",
    HOME_DIR / "KTU-Campus-Social" / "campus_app",
    HOME_DIR / "KTU-Campus-Social",
    Path(__file__).resolve().parent,
    Path(__file__).resolve().parent.parent / "campus_app",
]

PROJECT_DIR = None
for c_dir in candidate_dirs:
    if (c_dir / "app").exists():
        PROJECT_DIR = c_dir
        break

if PROJECT_DIR is None:
    PROJECT_DIR = candidate_dirs[0]

if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

# 2. Activate virtualenv if present
venv_candidates = [
    HOME_DIR / ".virtualenvs" / "campus-env" / "bin" / "activate_this.py",
    HOME_DIR / ".virtualenvs" / "campus" / "bin" / "activate_this.py",
    HOME_DIR / "venv" / "bin" / "activate_this.py",
]
for venv_script in venv_candidates:
    if venv_script.exists():
        with open(venv_script) as f:
            exec(f.read(), dict(__file__=str(venv_script)))
        break

# 3. Environment variables configuration
os.environ["FLASK_ENV"] = "production"
os.environ.setdefault("SECRET_KEY", "ktu-campus-social-production-secure-key-2026")

# Database URL pointing to safe user home path
db_path = HOME_DIR / "campus_data.db"
os.environ.setdefault("DATABASE_URL", f"sqlite:///{db_path}")

uploads_path = HOME_DIR / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("UPLOAD_FOLDER", str(uploads_path))

# 4. Import application factory and configuration
from app import create_app
from config import ProductionConfig

# 5. Initialize WSGI callable for PythonAnywhere
application = create_app(config_class=ProductionConfig)
