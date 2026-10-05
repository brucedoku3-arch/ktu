import os
from flask import Flask, render_template, jsonify, redirect, request, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

from config import DevelopmentConfig
from sqlalchemy import event
from sqlalchemy.engine import Engine

# Instantiate global Flask extensions
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Configure SQLite connection pooling, WAL mode, and foreign keys
    to handle concurrent writes without table locking ('database is locked').
    """
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        pass


def create_app(config_class="production"):
    """
    Application Factory for Campus Social Platform.
    Initializes configuration, extensions, runtime folders, context processors, and blueprints.
    Accepts string ('production', 'development', 'testing') or configuration class.
    """
    from config import config_by_name, DevelopmentConfig, ProductionConfig
    if isinstance(config_class, str):
        config_obj = config_by_name.get(config_class.lower(), ProductionConfig)
    elif config_class is not None:
        config_obj = config_class
    else:
        env_name = os.getenv("FLASK_ENV", "production").lower()
        config_obj = config_by_name.get(env_name, ProductionConfig)

    app = Flask(__name__)
    app.config.from_object(config_obj)

    # Allow configuration classes to run optional initialization hooks
    if hasattr(config_obj, "init_app"):
        config_obj.init_app(app)

    # 1. Bind global extensions to app instance
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    # Initialize Security Rate Limiter Guardrails
    from app.middleware.rate_limiter import rate_limiter
    rate_limiter.init_app(app)

    # 2. Configure Flask-Login settings
    login_manager.login_view = "auth.login"
    login_manager.login_message = "Please log in to access this campus feature."
    login_message_category = "info"

    # Register models and login user_loader
    from app import models  # noqa: F401

    # Ensure all SQLite database tables exist on application startup
    with app.app_context():
        db.create_all()

    # 3. Automated runtime directories creation
    os.makedirs(app.instance_path, exist_ok=True)

    upload_base = app.config.get("UPLOAD_FOLDER")
    if upload_base:
        os.makedirs(upload_base, exist_ok=True)
        upload_subdirs = app.config.get(
            "UPLOAD_SUBDIRS",
            {"avatars": "avatars", "memes": "memes", "fit_checks": "fit_checks", "vlogs": "vlogs"}
        )
        for folder_name in upload_subdirs.values():
            os.makedirs(os.path.join(upload_base, folder_name), exist_ok=True)

    # 4. Mobile view detection and platform metadata context processor
    @app.context_processor
    def inject_mobile_context():
        """
        Supplies mobile detection status, viewport metadata, and app details
        globally to all Jinja2 templates without manual route passing.
        """
        user_agent = request.headers.get("User-Agent", "").lower()
        mobile_tokens = (
            "android",
            "iphone",
            "ipad",
            "ipod",
            "mobile",
            "blackberry",
            "iemobile",
            "kindle",
            "silk",
            "opera mini",
            "webos",
        )
        is_mobile = any(token in user_agent for token in mobile_tokens)

        return {
            "is_mobile": is_mobile,
            "mobile_viewport_meta": app.config.get(
                "VIEWPORT_META",
                "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
            ),
            "app_name": app.config.get("APP_NAME", "CampusSocial"),
            "app_version": app.config.get("APP_VERSION", "1.0.0"),
            "theme_color": app.config.get("THEME_COLOR", "#4f46e5"),
            "max_upload_size_mb": app.config.get("MAX_CONTENT_LENGTH", 16777216) // (1024 * 1024),
        }

    # 5. Core routes: Health check and root redirect
    @app.route("/health", methods=["GET"])
    def health_check():
        """Public health check endpoint returning system status and metadata."""
        return jsonify({
            "status": "ok",
            "app": app.config.get("APP_NAME", "CampusSocial"),
            "version": app.config.get("APP_VERSION", "1.0.0"),
        }), 200

    @app.route("/", methods=["GET"])
    def root():
        """
        Default root landing route:
        Whenever anyone opens the main site URL (/), the landing page is the very first page they see.
        If the user is already logged in:
          - If onboarded: redirects to the main campus feed (/feed).
          - If pending onboarding: redirects to (/auth/onboarding).
        If unauthenticated:
          - Shows the landing page (register.html).
        """
        from flask_login import current_user
        if current_user.is_authenticated:
            if not getattr(current_user, "is_onboarded", True):
                return redirect(url_for("auth.onboarding"))
            return redirect(url_for("feed.index"))
        return render_template("auth/register.html")

    # 6. Register modular Blueprints with explicit URL prefixes
    from app.routes import main_bp, auth_bp, feed_bp, messages_bp, profile_bp, utility_bp, culture_bp, vlogs_bp, admin_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(feed_bp, url_prefix="/feed")
    app.register_blueprint(messages_bp, url_prefix="/messages")
    app.register_blueprint(profile_bp, url_prefix="/profile")
    app.register_blueprint(utility_bp, url_prefix="/utility")
    app.register_blueprint(culture_bp, url_prefix="/culture")
    app.register_blueprint(vlogs_bp, url_prefix="/vlogs")
    app.register_blueprint(admin_bp, url_prefix="/admin")

    # Direct top-level /report endpoint mapping to admin reporting handler
    from app.routes.admin import submit_report
    app.add_url_rule("/report", "public_report", submit_report, methods=["POST"])

    # 7. Initialize SocketIO
    try:
        from app.sockets import socketio
        socketio.init_app(app, cors_allowed_origins="*")
    except Exception:
        pass
  return app
    return app
