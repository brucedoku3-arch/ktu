import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the application
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")


class Config:
    """Base configuration class with common settings across environments."""

    APP_NAME = "CampusSocial"
    APP_VERSION = "1.0.0"

    # Cryptographic secret key
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-secret-key-please-override")

    # SQLAlchemy Database Configuration (Default: SQLite in instance/ directory)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'app.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security & Cookie Hardening
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False  # Enabled in ProductionConfig
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"

    # Uploads Configuration: Strict 16MB ceiling for media payloads across all forms
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    # Upload Directories
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER", str(BASE_DIR / "app" / "static" / "uploads")
    )
    UPLOAD_SUBDIRS = {
        "avatars": "avatars",
        "memes": "memes",
        "fit_checks": "fit_checks",
        "vlogs": "vlogs",
    }

    # Supported media file extensions
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "webm"}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

    # Mobile Web Viewport & PWA Metadata
    VIEWPORT_META = (
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, "
        "user-scalable=no, viewport-fit=cover"
    )
    THEME_COLOR = "#4f46e5"

    # Rate Limiting Settings
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = "memory://"


class DevelopmentConfig(Config):
    """Development environment configuration with hot reloading & debugging."""

    DEBUG = True
    TESTING = False
    ENV = "development"


class TestingConfig(Config):
    """Testing environment configuration with in-memory database."""

    DEBUG = False
    TESTING = True
    ENV = "testing"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Production environment configuration with strict security enforcement."""

    DEBUG = False
    TESTING = False
    ENV = "production"
    SECRET_KEY = os.getenv("SECRET_KEY")

    # Strict HTTPS Cookies in Production
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True

    @classmethod
    def init_app(cls, app):
        """Perform production security validation checks."""
        # Fallback rejection if default key is detected in production
        if not cls.SECRET_KEY or cls.SECRET_KEY in (
            "dev-fallback-secret-key-please-override",
            "replace-with-a-secure-random-secret-key-for-production",
        ):
            raise ValueError(
                "CRITICAL SECURITY ERROR: SECRET_KEY must be securely configured via environment variables in production."
            )


# Configuration registry mapping
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
