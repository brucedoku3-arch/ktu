from datetime import datetime
from app import db


class FriendMatchRequest(db.Model):
    """
    FriendMatchRequest model for the Low-Pressure Campus Friend Roulette.
    Pairs students seeking companionship for studying, workouts, or dining
    without dating app pressure.
    """

    __tablename__ = "friend_match_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity_type = db.Column(
        db.String(50),
        nullable=False,
        index=True,
    )  # 'study_buddy', 'lab_partner', 'dining_hall'
    time_slot = db.Column(
        db.String(50),
        nullable=False,
        index=True,
    )  # 'morning', 'afternoon', 'evening'
    status = db.Column(
        db.String(20),
        default="pending",
        nullable=False,
        index=True,
    )  # 'pending', 'matched', 'cancelled'
    matched_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship(
        "User", foreign_keys=[user_id], backref=db.backref("roulette_requests", lazy="dynamic")
    )
    matched_user = db.relationship(
        "User", foreign_keys=[matched_user_id], backref=db.backref("roulette_matches", lazy="dynamic")
    )

    ACTIVITY_METAS = {
        "study_buddy": {
            "label": "Library & Study Buddy",
            "icon": "📖",
            "tagline": "Grind sessions at KTU Library & CCB Block",
            "color": "#4f46e5",
        },
        "lab_partner": {
            "label": "Workshop & Lab Partner",
            "icon": "🔬",
            "tagline": "Practicals at Multipurpose Engineering Lab & CS Labs",
            "color": "#10b981",
        },
        "dining_hall": {
            "label": "Campus Dining Companion",
            "icon": "🍽️",
            "tagline": "Lunch or snack at Hospitality Canteen or Adweso Junction",
            "color": "#f59e0b",
        },
    }

    TIME_SLOT_METAS = {
        "morning": {"label": "Morning (8:00 AM - 12:00 PM)", "icon": "🌅"},
        "afternoon": {"label": "Afternoon (1:00 PM - 5:00 PM)", "icon": "☀️"},
        "evening": {"label": "Evening & Late (6:00 PM - 10:00 PM)", "icon": "🌙"},
    }

    @property
    def activity_meta(self) -> dict:
        return self.ACTIVITY_METAS.get(self.activity_type, {
            "label": self.activity_type.replace("_", " ").title(),
            "icon": "🤝",
            "tagline": "Campus activity",
            "color": "#6366f1",
        })

    @property
    def time_slot_meta(self) -> dict:
        return self.TIME_SLOT_METAS.get(self.time_slot, {
            "label": self.time_slot.capitalize(),
            "icon": "⏰",
        })

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity_type": self.activity_type,
            "activity_meta": self.activity_meta,
            "time_slot": self.time_slot,
            "time_slot_meta": self.time_slot_meta,
            "status": self.status,
            "matched_user": {
                "id": self.matched_user.id if self.matched_user else None,
                "username": self.matched_user.username if self.matched_user else None,
                "student_id": self.matched_user.student_id if self.matched_user else None,
                "avatar_url": self.matched_user.avatar_url if self.matched_user else "default_avatar.png",
            } if self.matched_user else None,
            "created_at": self.created_at.strftime("%I:%M %p"),
        }

    def __repr__(self):
        return f"<FriendMatchRequest id={self.id} user={self.user_id} activity='{self.activity_type}' status='{self.status}'>"
