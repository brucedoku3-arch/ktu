# Routes package initialization & Blueprint exports
from app.routes.main import main_bp
from app.routes.auth import auth_bp
from app.routes.feed import feed_bp
from app.routes.messaging import messaging_bp
from app.routes.messages import messages_bp
from app.routes.profile import profile_bp
from app.routes.utility import utility_bp
from app.routes.culture import culture_bp
from app.routes.vlogs import vlogs_bp
from app.routes.admin import admin_bp

__all__ = [
    "main_bp",
    "auth_bp",
    "feed_bp",
    "messaging_bp",
    "messages_bp",
    "profile_bp",
    "utility_bp",
    "culture_bp",
    "vlogs_bp",
    "admin_bp",
]


