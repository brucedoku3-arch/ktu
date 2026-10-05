from datetime import datetime
from app import db


class SkillSwap(db.Model):
    """
    SkillSwap model representing the low-friction student favor and skill barter board.
    Allows students to trade non-monetary services (haircuts, tutoring, laundry tokens, etc.).
    """

    __tablename__ = "skill_swaps"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    offering = db.Column(db.String(200), nullable=False)
    seeking = db.Column(db.String(200), nullable=False)
    category = db.Column(
        db.String(50),
        nullable=False,
        default="other",
        index=True,
    )  # 'haircut', 'laundry', 'tutoring', 'proofreading', 'other'
    status = db.Column(
        db.String(20),
        nullable=False,
        default="open",
        index=True,
    )  # 'open', 'fulfilled', 'closed'
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship("User", backref=db.backref("skill_swaps", lazy="dynamic"))

    CATEGORY_METAS = {
        "haircut": {"label": "Haircuts & Styling", "icon": "✂️", "color": "#f59e0b"},
        "laundry": {"label": "Laundry Tokens & Help", "icon": "🧺", "color": "#3b82f6"},
        "tutoring": {"label": "Academic Tutoring", "icon": "📚", "color": "#10b981"},
        "proofreading": {"label": "Essay & Lab Proofreading", "icon": "📝", "color": "#8b5cf6"},
        "other": {"label": "Other Campus Barter", "icon": "🔄", "color": "#64748b"},
    }

    @property
    def category_meta(self) -> dict:
        return self.CATEGORY_METAS.get(self.category, self.CATEGORY_METAS["other"])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "offering": self.offering,
            "seeking": self.seeking,
            "category": self.category,
            "category_meta": self.category_meta,
            "status": self.status,
            "created_at": self.created_at.strftime("%b %d, %I:%M %p"),
            "author": {
                "id": self.user.id if self.user else None,
                "username": self.user.username if self.user else "Anonymous Student",
                "student_id": self.user.student_id if self.user else "Unknown",
                "avatar_url": self.user.avatar_url if self.user else "default_avatar.png",
            },
        }

    def __repr__(self):
        return f"<SkillSwap id={self.id} category='{self.category}' status='{self.status}'>"
