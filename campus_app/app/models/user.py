from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app import db, login_manager

ADMIN_EMAIL = "brucedoku3@gmail.com"


class User(UserMixin, db.Model):
    __tablename__ = "users"

    # Primary key & authentication credentials
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(30), unique=True, nullable=False, index=True)
    username = db.Column(db.String(30), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Student identity & onboarding profile fields
    full_name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.String(20), nullable=True)  # Male, Female, Prefer not to say
    level = db.Column(db.String(10), nullable=True)   # 100, 200, 300, 400
    faculty = db.Column(db.String(100), nullable=True)
    course = db.Column(db.String(120), nullable=True)
    avatar_url = db.Column(db.String(255), default="default_avatar.png")
    bio = db.Column(db.String(160), nullable=True)

    # Status, permissions & onboarding flags
    is_onboarded = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    is_suspended = db.Column(db.Boolean, default=False, nullable=False)
    is_banned = db.Column(db.Boolean, default=False, nullable=False)

    # Timestamp tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # -------------------------------------------------------------------------
    # Authentication & Password Helpers
    # -------------------------------------------------------------------------
    def set_password(self, password: str) -> None:
        """Hashes and sets the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifies candidate password against stored hash."""
        return check_password_hash(self.password_hash, password)

    # -------------------------------------------------------------------------
    # Domain & Email Validation Logic
    # -------------------------------------------------------------------------
    @staticmethod
    def is_valid_student_email(email: str) -> bool:
        """
        Validates whether an email belongs to official KTU domain (@ktu.edu.gh)
        or matches the designated super-admin override address.
        """
        if not email:
            return False
        clean_email = email.strip().lower()
        return clean_email == ADMIN_EMAIL or clean_email.endswith("@ktu.edu.gh")

    # -------------------------------------------------------------------------
    # Serializer for API endpoints
    # -------------------------------------------------------------------------
    def to_dict(self) -> dict:
        """Serializes user metadata for JSON responses and frontend consumption."""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "gender": self.gender,
            "level": self.level,
            "faculty": self.faculty,
            "course": self.course,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "is_onboarded": self.is_onboarded,
            "is_admin": self.is_admin,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.student_id})>"


# -----------------------------------------------------------------------------
# Flask-Login User Loader Callback
# -----------------------------------------------------------------------------
@login_manager.user_loader
def load_user(user_id: str):
    """Callback for Flask-Login to reload user object from user ID stored in session."""
    return User.query.get(int(user_id))
