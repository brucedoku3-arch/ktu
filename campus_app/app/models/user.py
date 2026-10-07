from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app import db, login_manager

ADMIN_EMAIL = "brucedoku3@gmail.com"


class User(UserMixin, db.Model):
    """
    User model representing verified campus students and administrators.
    Includes moderation state flags, profile bio, avatar, and authentication helpers.
    """

    __tablename__ = "users"

    # Primary key & authentication credentials
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, index=True, nullable=True)
    full_name = db.Column(db.String(120), nullable=True)
    username = db.Column(db.String(30), unique=True, index=True, nullable=False)
    email = db.Column(db.String(120), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=False, default="default_avatar.png")
    bio = db.Column(db.String(160), nullable=True)

    # Student Onboarding & Academic Demographics
    gender = db.Column(db.String(30), nullable=True)  # Male, Female, Prefer not to say
    level = db.Column(db.String(10), nullable=True)   # 100, 200, 300, 400
    faculty = db.Column(db.String(150), nullable=True)
    course = db.Column(db.String(150), nullable=True)
    is_onboarded = db.Column(db.Boolean, default=False, nullable=False)

    # Moderation & Account Status Flags
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=True, nullable=False)
    is_suspended = db.Column(db.Boolean, default=False, nullable=False)
    suspension_until = db.Column(db.DateTime, nullable=True)
    is_banned = db.Column(db.Boolean, default=False, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    karma_score = db.Column(db.Integer, default=0, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User Preferences & Privacy Settings
    profile_visibility = db.Column(db.String(20), default="campus", nullable=False)  # 'public' or 'campus'
    notify_email = db.Column(db.Boolean, default=True, nullable=False)
    notify_in_app = db.Column(db.Boolean, default=True, nullable=False)
    theme_preference = db.Column(db.String(10), default="light", nullable=False)  # 'light' or 'dark'

    # Relationships configured to mirror corresponding models' back_populates
    posts = db.relationship(
        "Post", back_populates="author", cascade="all, delete-orphan", lazy="dynamic"
    )
    vlogs = db.relationship(
        "Vlog", back_populates="author", cascade="all, delete-orphan", lazy="dynamic"
    )
    sent_messages = db.relationship(
        "Message",
        foreign_keys="Message.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    received_messages = db.relationship(
        "Message",
        foreign_keys="Message.recipient_id",
        back_populates="recipient",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    blocked_users = db.relationship(
        "Block",
        foreign_keys="Block.blocker_id",
        back_populates="blocker",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    blocked_by_users = db.relationship(
        "Block",
        foreign_keys="Block.blocked_id",
        back_populates="blocked",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    reports_filed = db.relationship(
        "Report",
        foreign_keys="Report.reporter_id",
        back_populates="reporter",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    reports_received = db.relationship(
        "Report",
        foreign_keys="Report.reported_user_id",
        back_populates="reported_user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    votes = db.relationship(
        "PostVote", back_populates="user", cascade="all, delete-orphan", lazy="dynamic"
    )

    # -------------------------------------------------------------------------
    # Authentication & Password Helpers
    # -------------------------------------------------------------------------
    def set_password(self, password: str) -> None:
        """Hashes and sets the user's password using pbkdf2:sha256."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifies candidate password against stored hash."""
        if not self.password_hash or not password:
            return False
        return check_password_hash(self.password_hash, password)

    # -------------------------------------------------------------------------
    # Suspension & Moderation Status Helpers
    # -------------------------------------------------------------------------
    @property
    def is_currently_suspended(self) -> bool:
        """Determines if the user account is actively under suspension."""
        if not self.is_suspended:
            return False
        if self.suspension_until and datetime.utcnow() >= self.suspension_until:
            return False
        return True

    def check_and_update_suspension(self) -> bool:
        """
        Auto-clears temporary suspension if suspension_until period has lapsed.
        Returns True if still suspended, False if clean.
        """
        if self.is_suspended and self.suspension_until and datetime.utcnow() >= self.suspension_until:
            self.is_suspended = False
            self.suspension_until = None
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            return False
        return self.is_suspended

    # -------------------------------------------------------------------------
    # Domain & Email Validation Logic
    # -------------------------------------------------------------------------
    @staticmethod
    def is_valid_student_email(email: str) -> bool:
        """
        Validates institutional student domain (@ktu.edu.gh),
        specifically granting override bypass for hardcoded super-admin email brucedoku3@gmail.com.
        """
        if not email or not isinstance(email, str):
            return False
        clean_email = email.strip().lower()
        if clean_email == ADMIN_EMAIL:
            return True
        if not clean_email.endswith("@ktu.edu.gh") or len(clean_email) <= 11:
            return False
        local_part = clean_email[:-len("@ktu.edu.gh")]
        return len(local_part) >= 1 and "@" not in local_part

    @staticmethod
    def is_valid_ktu_email(email: str) -> bool:
        """Alias for is_valid_student_email ensuring full backwards compatibility."""
        return User.is_valid_student_email(email)

    # -------------------------------------------------------------------------
    # Moderation & Peer-to-Peer Block Helpers
    # -------------------------------------------------------------------------
    def is_blocking(self, user_id: int) -> bool:
        """Checks if this user is blocking the target user_id."""
        from app.models.moderation import Block

        return (
            Block.query.filter_by(blocker_id=self.id, blocked_id=user_id).first()
            is not None
        )

    def is_blocked_by(self, user_id: int) -> bool:
        """Checks if this user is blocked by the target user_id."""
        from app.models.moderation import Block

        return (
            Block.query.filter_by(blocker_id=user_id, blocked_id=self.id).first()
            is not None
        )

    def block(self, user_id: int) -> bool:
        """Blocks target user_id if not already blocked and not self."""
        if user_id == self.id or self.is_blocking(user_id):
            return False
        from app.models.moderation import Block

        block_record = Block(blocker_id=self.id, blocked_id=user_id)
        db.session.add(block_record)
        return True

    def unblock(self, user_id: int) -> bool:
        """Unblocks target user_id."""
        from app.models.moderation import Block

        block_record = Block.query.filter_by(
            blocker_id=self.id, blocked_id=user_id
        ).first()
        if block_record:
            db.session.delete(block_record)
            return True
        return False

    def recalculate_karma(self) -> int:
        """Calculates and updates total karma score across unflagged posts."""
        try:
            total_post_karma = sum(p.score for p in self.posts.filter_by(is_flagged=False).all())
            self.karma_score = total_post_karma
            return self.karma_score
        except Exception:
            return self.karma_score or 0

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
            "is_verified": self.is_verified,
            "karma_score": self.karma_score,
            "profile_visibility": getattr(self, "profile_visibility", "campus") or "campus",
            "notify_email": getattr(self, "notify_email", True) if getattr(self, "notify_email", None) is not None else True,
            "notify_in_app": getattr(self, "notify_in_app", True) if getattr(self, "notify_in_app", None) is not None else True,
            "theme_preference": getattr(self, "theme_preference", "light") or "light",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}' student_id='{self.student_id}'>"


# -----------------------------------------------------------------------------
# Flask-Login User Loader Callback
# -----------------------------------------------------------------------------
@login_manager.user_loader
def load_user(user_id: str):
    """Callback for Flask-Login to reload user object from user ID stored in session."""
    try:
        return db.session.get(User, int(user_id))
    except (ValueError, TypeError, Exception):
        return None
