from datetime import datetime
from app import db


class PollOption(db.Model):
    """
    PollOption represents a selectable choice for a campus poll post.
    Tracks live vote counts and associates with individual user vote receipts.
    """

    __tablename__ = "poll_options"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    option_text = db.Column(db.String(120), nullable=False)
    vote_count = db.Column(db.Integer, default=0, nullable=False)

    # Relationships
    post = db.relationship("Post", back_populates="poll_options")
    votes = db.relationship(
        "PollVote", back_populates="option", cascade="all, delete-orphan", lazy="dynamic"
    )

    def percentage(self, total_votes: int) -> float:
        """Computes rounded vote percentage based on total poll tally."""
        if not total_votes or total_votes <= 0:
            return 0.0
        return round((self.vote_count / total_votes) * 100, 1)

    def to_dict(self, total_votes: int = None) -> dict:
        """Serializes poll option with vote count and dynamic percentage."""
        if total_votes is None and self.post:
            total_votes = sum(opt.vote_count for opt in self.post.poll_options)
        return {
            "id": self.id,
            "post_id": self.post_id,
            "option_text": self.option_text,
            "vote_count": self.vote_count,
            "percentage": self.percentage(total_votes),
        }

    def __repr__(self):
        return f"<PollOption id={self.id} post_id={self.post_id} text='{self.option_text}' votes={self.vote_count}>"


class PollVote(db.Model):
    """
    PollVote represents a verified student vote on a specific poll option.
    Enforces a strict single-vote constraint per user per poll.
    """

    __tablename__ = "poll_votes"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    poll_option_id = db.Column(
        db.Integer,
        db.ForeignKey("poll_options.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    option = db.relationship("PollOption", back_populates="votes")
    user = db.relationship("User")
    post = db.relationship("Post")

    __table_args__ = (
        db.UniqueConstraint("post_id", "user_id", name="uq_user_poll_vote"),
        db.UniqueConstraint("poll_option_id", "user_id", name="uq_user_poll_option_vote"),
    )

    def __repr__(self):
        return f"<PollVote id={self.id} user_id={self.user_id} post_id={self.post_id} option_id={self.poll_option_id}>"
