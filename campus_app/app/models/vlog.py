from datetime import datetime
from app import db


class Vlog(db.Model):
    """
    Vlog model representing 30-second campus student micro-video stories.
    Constrained to duration_seconds <= 30.5 via database CheckConstraint.
    """

    __tablename__ = "vlogs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    video_url = db.Column(db.String(255), nullable=False)
    thumbnail_url = db.Column(db.String(255), nullable=True)
    caption = db.Column(db.String(280), nullable=True)
    duration_seconds = db.Column(db.Float, nullable=False)
    views_count = db.Column(db.Integer, default=0, nullable=False)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    upvotes = db.Column(db.Integer, default=0, nullable=False)
    downvotes = db.Column(db.Integer, default=0, nullable=False)
    is_flagged = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    author = db.relationship("User", back_populates="vlogs")
    votes = db.relationship("VlogVote", back_populates="vlog", cascade="all, delete-orphan")

    __table_args__ = (
        db.CheckConstraint(
            "duration_seconds <= 30.5", name="chk_vlog_duration_max_30s"
        ),
    )

    @property
    def duration(self) -> float:
        """Alias for duration_seconds."""
        return self.duration_seconds

    @duration.setter
    def duration(self, value: float) -> None:
        self.duration_seconds = float(value)

    @property
    def net_votes(self) -> int:
        """Calculates net score (upvotes minus downvotes)."""
        return (self.upvotes or 0) - (self.downvotes or 0)

    def to_dict(self, current_user_id: int = None) -> dict:
        user_vote = 0
        if current_user_id:
            user_vote_rec = next((v for v in self.votes if v.user_id == current_user_id), None)
            if user_vote_rec:
                user_vote = user_vote_rec.vote_type

        return {
            "id": self.id,
            "user_id": self.user_id,
            "caption": self.caption or "",
            "video_url": self.video_url,
            "thumbnail_url": self.thumbnail_url or "",
            "duration": round(self.duration_seconds, 1),
            "duration_seconds": self.duration_seconds,
            "views_count": self.views_count,
            "likes_count": self.likes_count,
            "upvotes": self.upvotes,
            "downvotes": self.downvotes,
            "net_votes": self.net_votes,
            "user_vote": user_vote,
            "created_at": self.created_at.strftime("%b %d, %H:%M"),
            "author": {
                "id": self.author.id if self.author else None,
                "username": self.author.username if self.author else "student",
                "student_id": self.author.student_id if self.author else "KTU-Student",
                "avatar_url": self.author.avatar_url if self.author else "default_avatar.png",
            },
        }

    def __repr__(self):
        return (
            f"<Vlog id={self.id} user_id={self.user_id} "
            f"duration={self.duration_seconds}s views={self.views_count} net_votes={self.net_votes}>"
        )


class VlogVote(db.Model):
    """
    VlogVote model tracking student upvotes and downvotes (+1 / -1) on short-form vlogs.
    """

    __tablename__ = "vlog_votes"

    id = db.Column(db.Integer, primary_key=True)
    vlog_id = db.Column(
        db.Integer,
        db.ForeignKey("vlogs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vote_type = db.Column(db.Integer, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    vlog = db.relationship("Vlog", back_populates="votes")
    user = db.relationship("User", backref=db.backref("vlog_votes", lazy="dynamic"))

    __table_args__ = (
        db.UniqueConstraint("vlog_id", "user_id", name="uq_vlog_user_vote"),
    )

    def __repr__(self):
        return f"<VlogVote vlog_id={self.vlog_id} user_id={self.user_id} vote={self.vote_type}>"
