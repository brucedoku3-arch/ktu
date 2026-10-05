# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# PythonAnywhere WSGI Configuration Script for KTU Campus Social
# Path on PythonAnywhere: /var/www/<your_username>_pythonanywhere_com_wsgi.py
# ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

import os
import sys
from pathlib import Path

# 1. Define paths - Replace 'your_username' with your actual PythonAnywhere username
USERNAME = os.getenv("PYTHONANYWHERE_USER", "your_username")
PROJECT_DIR = f"/home/{USERNAME}/campus_app"

# If cloned with root folder:
if not os.path.exists(PROJECT_DIR):
    PROJECT_DIR = f"/home/{USERNAME}/KTU-Campus-Social/campus_app"

if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

# 2. Activate virtualenv if present
VENV_DIR = f"/home/{USERNAME}/.virtualenvs/campus-env"
ACTIVATE_THIS = os.path.join(VENV_DIR, "bin", "activate_this.py")
if os.path.exists(ACTIVATE_THIS):
    with open(ACTIVATE_THIS) as f:
        exec(f.read(), dict(__file__=ACTIVATE_THIS))

# 3. Environment variables configuration
os.environ["FLASK_ENV"] = "production"
os.environ.setdefault("SECRET_KEY", "generate-a-secure-random-key-for-pythonanywhere-32chars")
os.environ.setdefault("DATABASE_URL", f"sqlite:////home/{USERNAME}/campus_data.db")
os.environ.setdefault("UPLOAD_FOLDER", f"/home/{USERNAME}/uploads")

# 4. Import application factory and configuration
from app import create_app
from config import ProductionConfig

# 5. Initialize WSGI callable for PythonAnywhere
application = create_app(config_class=ProductionConfig)
