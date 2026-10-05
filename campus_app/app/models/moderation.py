from datetime import datetime
from app import db


class Block(db.Model):
    """
    Block model enforcing student privacy and harassment prevention.
    Ensures unique block relationship per (blocker_id, blocked_id) pair.
    """

    __tablename__ = "blocks"

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    blocked_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    blocker = db.relationship(
        "User", foreign_keys=[blocker_id], back_populates="blocked_users"
    )
    blocked = db.relationship(
        "User", foreign_keys=[blocked_id], back_populates="blocked_by_users"
    )

    __table_args__ = (
        db.UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked"),
    )

    def __repr__(self):
        return f"<Block id={self.id} blocker={self.blocker_id} blocked={self.blocked_id}>"


class Report(db.Model):
    """
    Centralized safety report model for campus moderation.
    Allows reporting posts, comments, vlogs, aux submissions, course reviews, or student profiles.
    Enforces UniqueConstraint('reporter_id', 'target_type', 'target_id') to prevent report-spamming.
    """

    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_type = db.Column(
        db.String(30), nullable=False, index=True
    )  # 'post', 'comment', 'vlog', 'aux_submission', 'review', 'user'
    target_id = db.Column(db.Integer, nullable=False, index=True)

    # Optional direct foreign key to reported user for account moderation tracking
    reported_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reason = db.Column(
        db.String(50), nullable=False, index=True
    )  # 'harassment', 'hate_speech', 'illegal_content', 'spam', 'explicit_media', 'impersonation'
    details = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.String(20), default="pending", nullable=False, index=True
    )  # 'pending', 'reviewed', 'actioned', 'dismissed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    reporter = db.relationship(
        "User", foreign_keys=[reporter_id], back_populates="reports_filed"
    )
    reported_user = db.relationship(
        "User", foreign_keys=[reported_user_id], back_populates="reports_received"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "reporter_id", "target_type", "target_id", name="uq_reporter_target"
        ),
    )

    # Backwards compatibility accessors
    @property
    def content_type(self) -> str:
        return self.target_type

    @content_type.setter
    def content_type(self, val: str):
        self.target_type = val

    @property
    def content_id(self) -> int:
        return self.target_id

    @content_id.setter
    def content_id(self, val: int):
        self.target_id = val

    def resolve(self, action: str = "reviewed") -> None:
        """Helper to mark moderation status."""
        self.status = action

    def to_dict(self) -> dict:
        """Serializes report data for moderation dashboard and API payloads."""
        return {
            "id": self.id,
            "reporter_id": self.reporter_id,
            "reporter_username": self.reporter.username if self.reporter else "Unknown",
            "reporter_student_id": self.reporter.student_id if self.reporter else "Unknown",
            "target_type": self.target_type,
            "target_id": self.target_id,
            "reported_user_id": self.reported_user_id,
            "reason": self.reason,
            "details": self.details or "",
            "status": self.status,
            "created_at": self.created_at.strftime("%b %d, %Y · %H:%M"),
            "created_at_iso": self.created_at.isoformat(),
        }

    def __repr__(self):
        return (
            f"<Report id={self.id} type='{self.target_type}' "
            f"target_id={self.target_id} reason='{self.reason}' status='{self.status}'>"
        )


class ModLog(db.Model):
    """
    Moderation Action Audit Log model.
    Maintains an immutable record of all administrative enforcement actions
    for accountability, institutional transparency, and legal compliance.
    """

    __tablename__ = "mod_logs"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = db.Column(
        db.String(50), nullable=False, index=True
    )  # 'warn', 'delete_content', 'suspend_user', 'ban_user', 'dismiss_report'
    target_type = db.Column(db.String(30), nullable=False, index=True)
    target_id = db.Column(db.Integer, nullable=False, index=True)
    reason_given = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    admin = db.relationship("User", foreign_keys=[admin_id])

    def to_dict(self) -> dict:
        """Serializes audit log entry."""
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "admin_username": self.admin.username if self.admin else "System / Removed Admin",
            "action": self.action,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "reason_given": self.reason_given or "No additional notes provided.",
            "timestamp": self.timestamp.strftime("%b %d, %Y · %H:%M:%S"),
            "timestamp_iso": self.timestamp.isoformat(),
        }

    def __repr__(self):
        return (
            f"<ModLog id={self.id} admin={self.admin_id} "
            f"action='{self.action}' target={self.target_type}:{self.target_id}>"
        )
