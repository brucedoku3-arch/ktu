#!/usr/bin/env python3
"""
Automated Project Bootstrap Script for Campus Social Platform
Architecture: Flask Application Factory Pattern
Author: Senior Backend Architect
"""

import os
import sys
from pathlib import Path


def bootstrap_campus_app(target_dir: str = ".") -> None:
    """
    Creates the required directory hierarchy and placeholder files
    for the enterprise campus social platform.
    """
    base_path = Path(target_dir).resolve()
    print("=" * 70)
    print("🚀 CAMPUS SOCIAL PLATFORM - ENTERPRISE BOOTSTRAP WIZARD")
    print(f"Target Working Directory: {base_path}")
    print("=" * 70)

    # 1. Define required directories
    required_directories = [
        base_path / "app",
        base_path / "app" / "models",
        base_path / "app" / "routes",
        base_path / "app" / "services",
        base_path / "app" / "static",
        base_path / "app" / "static" / "css",
        base_path / "app" / "static" / "js",
        base_path / "app" / "static" / "uploads",
        base_path / "app" / "static" / "uploads" / "avatars",
        base_path / "app" / "static" / "uploads" / "memes",
        base_path / "app" / "static" / "uploads" / "fit_checks",
        base_path / "app" / "static" / "uploads" / "vlogs",
        base_path / "app" / "templates",
        base_path / "app" / "templates" / "auth",
        base_path / "app" / "templates" / "feed",
        base_path / "app" / "templates" / "messaging",
        base_path / "app" / "templates" / "profile",
    ]

    # 2. Define required files with optional initial content
    required_files = {
        base_path / ".env.example": (
            "FLASK_APP=run.py\n"
            "FLASK_ENV=development\n"
            "SECRET_KEY=your-super-secret-key-change-this-in-production\n"
            "DATABASE_URL=sqlite:///app.db\n"
            "UPLOAD_FOLDER=app/static/uploads\n"
        ),
        base_path / ".gitignore": (
            "__pycache__/\n"
            "*.py[cod]\n"
            "*$py.class\n\n"
            ".env\n"
            ".env.local\n\n"
            "venv/\n"
            ".venv/\n"
            "env/\n\n"
            "instance/\n"
            "*.db\n"
            "*.sqlite\n"
            "*.sqlite3\n\n"
            "app/static/uploads/*\n"
            "!app/static/uploads/.gitkeep\n"
            "!app/static/uploads/avatars/.gitkeep\n"
            "!app/static/uploads/memes/.gitkeep\n"
            "!app/static/uploads/fit_checks/.gitkeep\n"
            "!app/static/uploads/vlogs/.gitkeep\n\n"
            ".DS_Store\n"
            "Thumbs.db\n"
        ),
        base_path / "requirements.txt": (
            "Flask==3.0.3\n"
            "Flask-SQLAlchemy==3.1.1\n"
            "Flask-Migrate==4.0.7\n"
            "Flask-Login==0.6.3\n"
            "python-dotenv==1.0.1\n"
            "Werkzeug==3.0.3\n"
        ),
        base_path / "config.py": (
            "import os\n"
            "from pathlib import Path\n"
            "from dotenv import load_dotenv\n\n"
            "BASE_DIR = Path(__file__).resolve().parent\n"
            'load_dotenv(BASE_DIR / ".env")\n\n\n'
            "class Config:\n"
            '    """Base configuration with common settings across environments."""\n'
            '    SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-secret-key-please-override")\n'
            '    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / \'instance\' / \'app.db\'}")\n'
            "    SQLALCHEMY_TRACK_MODIFICATIONS = False\n"
            "    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max payload\n"
            '    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "app" / "static" / "uploads"))\n\n\n'
            "class DevelopmentConfig(Config):\n"
            '    """Development environment configuration."""\n'
            "    DEBUG = True\n"
            "    TESTING = False\n"
            '    ENV = "development"\n\n\n'
            "class ProductionConfig(Config):\n"
            '    """Production environment configuration."""\n'
            "    DEBUG = False\n"
            "    TESTING = False\n"
            '    ENV = "production"\n'
            '    SECRET_KEY = os.getenv("SECRET_KEY")\n\n\n'
            "config_by_name = {\n"
            '    "development": DevelopmentConfig,\n'
            '    "production": ProductionConfig,\n'
            '    "default": DevelopmentConfig,\n'
            "}\n"
        ),
        base_path / "run.py": (
            "import os\n"
            "from app import create_app\n"
            "from config import config_by_name\n\n"
            'env_name = os.getenv("FLASK_ENV", "development").lower()\n'
            'config_class = config_by_name.get(env_name, config_by_name["default"])\n'
            "app = create_app(config_class=config_class)\n\n"
            'if __name__ == "__main__":\n'
            '    app.run(debug=True, host="127.0.0.1", port=5000)\n'
        ),
        base_path / "app" / "__init__.py": (
            "import os\n"
            "from flask import Flask\n"
            "from flask_sqlalchemy import SQLAlchemy\n"
            "from flask_migrate import Migrate\n"
            "from flask_login import LoginManager\n\n"
            "from config import DevelopmentConfig\n\n"
            "# Initialize extensions\n"
            "db = SQLAlchemy()\n"
            "migrate = Migrate()\n"
            "login_manager = LoginManager()\n\n\n"
            "def create_app(config_class=DevelopmentConfig):\n"
            '    """Application Factory for the Campus Social Platform."""\n'
            "    app = Flask(__name__)\n"
            "    app.config.from_object(config_class)\n\n"
            "    # Initialize extensions\n"
            "    db.init_app(app)\n"
            "    migrate.init_app(app, db)\n"
            "    login_manager.init_app(app)\n"
            '    login_manager.login_view = "auth.login"\n'
            '    login_manager.login_message_category = "info"\n\n'
            "    # Ensure runtime directories exist\n"
            "    os.makedirs(app.instance_path, exist_ok=True)\n"
            '    if "UPLOAD_FOLDER" in app.config:\n'
            '        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)\n\n'
            "    # Register modular blueprints\n"
            "    from app.routes import auth_bp, feed_bp, messaging_bp, profile_bp\n\n"
            '    app.register_blueprint(auth_bp, url_prefix="/auth")\n'
            '    app.register_blueprint(feed_bp, url_prefix="/feed")\n'
            '    app.register_blueprint(messaging_bp, url_prefix="/messages")\n'
            '    app.register_blueprint(profile_bp, url_prefix="/profile")\n\n'
            '    @app.route("/")\n'
            "    def index():\n"
            "        from flask import redirect, url_for\n"
            '        return redirect(url_for("feed.index"))\n\n'
            "    return app\n"
        ),
        base_path / "app" / "models" / "__init__.py": (
            "# Models package initialization\n"
            "# Enterprise models (User, Post, Comment, Message, MediaAsset) defined here\n"
        ),
        base_path / "app" / "routes" / "__init__.py": (
            "# Routes package initialization & Blueprint exports\n"
            "from flask import Blueprint, render_template\n\n"
            'auth_bp = Blueprint("auth", __name__)\n'
            'feed_bp = Blueprint("feed", __name__)\n'
            'messaging_bp = Blueprint("messaging", __name__)\n'
            'profile_bp = Blueprint("profile", __name__)\n\n'
            '@auth_bp.route("/login")\n'
            "def login():\n"
            '    return render_template("auth/login.html")\n\n'
            '@feed_bp.route("/")\n'
            "def index():\n"
            '    return render_template("feed/index.html")\n\n'
            '@messaging_bp.route("/")\n'
            "def inbox():\n"
            '    return render_template("messaging/inbox.html")\n\n'
            '@profile_bp.route("/<username>")\n'
            "def view_profile(username):\n"
            '    return render_template("profile/view.html", username=username)\n'
        ),
        base_path / "app" / "services" / "__init__.py": (
            "# Services package initialization\n"
            "# Encapsulates business logic, media upload helpers, and push notifications\n"
        ),
        base_path / "app" / "static" / "css" / "main.css": (
            "/* Campus App Core Stylesheet */\n"
            ":root {\n"
            "  --primary: #4f46e5;\n"
            "  --primary-hover: #4338ca;\n"
            "  --bg-surface: #f8fafc;\n"
            "  --text-main: #0f172a;\n"
            "}\n"
            "body {\n"
            "  margin: 0;\n"
            "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n"
            "  background-color: var(--bg-surface);\n"
            "  color: var(--text-main);\n"
            "}\n"
        ),
        base_path / "app" / "static" / "js" / "main.js": (
            "// Campus App Client Engine\n"
            "console.log('Campus App Client Initialized.');\n"
        ),
        base_path / "app" / "templates" / "base.html": (
            "<!doctype html>\n"
            '<html lang="en">\n'
            "<head>\n"
            '  <meta charset="utf-8">\n'
            '  <meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '  <title>{% block title %}Campus Social{% endblock %}</title>\n'
            '  <link rel="stylesheet" href="{{ url_for(\'static\', filename=\'css/main.css\') }}">\n'
            "</head>\n"
            "<body>\n"
            '  <header class="app-header">\n'
            '    <div class="container">\n'
            '      <a href="{{ url_for(\'feed.index\') }}" class="brand-logo">🎓 CampusApp</a>\n'
            "    </div>\n"
            "  </header>\n"
            '  <main class="app-content container">\n'
            "    {% block content %}{% endblock %}\n"
            "  </main>\n"
            '  <script src="{{ url_for(\'static\', filename=\'js/main.js\') }}"></script>\n'
            "</body>\n"
            "</html>\n"
        ),
        # Gitkeep files for empty upload directories so git tracks them
        base_path / "app" / "static" / "uploads" / "avatars" / ".gitkeep": "",
        base_path / "app" / "static" / "uploads" / "memes" / ".gitkeep": "",
        base_path / "app" / "static" / "uploads" / "fit_checks" / ".gitkeep": "",
        base_path / "app" / "static" / "uploads" / "vlogs" / ".gitkeep": "",
    }

    # 3. Create Directories
    print("\n📁 [1/3] VERIFYING & CREATING DIRECTORIES:")
    created_dirs_count = 0
    existing_dirs_count = 0

    for d in required_directories:
        try:
            if not d.exists():
                d.mkdir(parents=True, exist_ok=True)
                created_dirs_count += 1
                rel_path = d.relative_to(base_path)
                print(f"  [+] CREATED  : {rel_path}/")
            else:
                existing_dirs_count += 1
                rel_path = d.relative_to(base_path)
                print(f"  [=] VERIFIED : {rel_path}/")
        except Exception as e:
            print(f"  [!] ERROR creating directory {d}: {e}", file=sys.stderr)

    # 4. Create Files
    print("\n📄 [2/3] VERIFYING & CREATING REQUIRED FILES:")
    created_files_count = 0
    existing_files_count = 0

    for file_path, content in required_files.items():
        try:
            # Ensure parent exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            rel_path = file_path.relative_to(base_path)

            if not file_path.exists():
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                created_files_count += 1
                print(f"  [+] CREATED  : {rel_path}")
            else:
                existing_files_count += 1
                print(f"  [=] VERIFIED : {rel_path} (exists)")
        except Exception as e:
            print(f"  [!] ERROR creating file {file_path}: {e}", file=sys.stderr)

    # 5. Integrity Verification
    print("\n🛡️  [3/3] ARCHITECTURAL AUDIT & INTEGRITY CHECK:")
    all_ok = True
    for d in required_directories:
        if not d.is_dir():
            print(f"  ❌ Missing directory: {d.relative_to(base_path)}")
            all_ok = False
    for f in required_files.keys():
        if not f.is_file():
            print(f"  ❌ Missing file: {f.relative_to(base_path)}")
            all_ok = False

    if all_ok:
        print("  ✅ All directories and files verified successfully.")
    else:
        print("  ⚠️ Some elements could not be verified. Check file permissions.")

    # Summary
    print("\n" + "=" * 70)
    print("✨ BOOTSTRAP COMPLETE SUMMARY:")
    print(f"  - Directories processed : {len(required_directories)} (Created: {created_dirs_count}, Verified: {existing_dirs_count})")
    print(f"  - Files processed       : {len(required_files)} (Created: {created_files_count}, Verified: {existing_files_count})")
    print("=" * 70)
    print("\nNext Steps:")
    print("  1. Create virtual environment : python3 -m venv venv")
    print("  2. Activate virtual env      : source venv/bin/activate  (Windows: .\\venv\\Scripts\\activate)")
    print("  3. Install dependencies      : pip install -r requirements.txt")
    print("  4. Setup environment file    : cp .env.example .env")
    print("  5. Launch development server : python run.py\n")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    bootstrap_campus_app(target)
