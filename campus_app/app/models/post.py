from datetime import datetime
from app import db


class Post(db.Model):
    """
    Post model supporting campus Memes and OOTD Fit Checks.
    Includes media asset references, vote counts, and moderation quarantine flags.
    """

    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = db.Column(db.String(20), nullable=False, index=True)  # 'meme', 'fit_check', 'confession', 'poll'
    post_type = db.Column(db.String(20), default="standard", nullable=False, index=True)  # 'standard', 'confession', 'poll'
    is_anonymous = db.Column(db.Boolean, default=False, nullable=False, index=True)
    caption = db.Column(db.String(500), nullable=True)
    media_url = db.Column(db.String(255), nullable=True, default="")
    upvotes_count = db.Column(db.Integer, default=0, nullable=False)
    downvotes_count = db.Column(db.Integer, default=0, nullable=False)
    is_flagged = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    author = db.relationship("User", back_populates="posts")
    votes = db.relationship(
        "PostVote", back_populates="post", cascade="all, delete-orphan", lazy="dynamic"
    )
    poll_options = db.relationship(
        "PollOption", back_populates="post", cascade="all, delete-orphan", lazy="joined"
    )

    @property
    def score(self) -> int:
        """Net karma score calculated dynamically from upvotes and downvotes."""
        return self.upvotes_count - self.downvotes_count

    @property
    def title(self) -> str:
        """Alias for caption to support both title and caption interchangeably."""
        return self.caption or ""

    @title.setter
    def title(self, value: str):
        self.caption = value

    @property
    def image_url(self) -> str:
        """Alias for media_url."""
        return self.media_url or ""

    @image_url.setter
    def image_url(self, value: str):
        self.media_url = value

    def get_user_vote(self, user_id: int) -> int:
        """
        Returns 1 for upvote, -1 for downvote, 0 if not voted.
        """
        if not user_id:
            return 0
        vote = self.votes.filter_by(user_id=user_id).first()
        if not vote:
            return 0
        return 1 if vote.vote_type == "upvote" else -1

    def to_dict(self, current_user_id: int = None, public: bool = True) -> dict:
        """
        Serializes Post object to dictionary for JSON APIs.
        Accountable Anonymous Serialization:
        - Stores user_id in database for moderation tracing.
        - Strips user_id and author relationship data ONLY in public (public=True) serialization
          when is_anonymous is True.
        """
        total_poll_votes = (
            sum(opt.vote_count for opt in self.poll_options) if self.poll_options else 0
        )

        user_voted_option_id = None
        if current_user_id and self.poll_options:
            from app.models.poll import PollVote
            vote = (
                PollVote.query.filter_by(user_id=current_user_id, post_id=self.id).first()
            )
            if vote:
                user_voted_option_id = vote.poll_option_id

        payload = {
            "id": self.id,
            "category": self.category,
            "post_type": self.post_type,
            "is_anonymous": self.is_anonymous,
            "caption": self.caption or "",
            "title": self.caption or "",
            "media_url": self.media_url or "",
            "upvotes": self.upvotes_count,
            "downvotes": self.downvotes_count,
            "score": self.score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_vote": self.get_user_vote(current_user_id) if current_user_id else 0,
        }

        # Privacy Redaction for Anonymous Posts / Confessions
        if self.is_anonymous and public and (not current_user_id or current_user_id != self.user_id):
            payload["author"] = {
                "username": "Anonymous Student",
                "student_id": "Hidden",
                "avatar_url": None,
                "is_anonymous": True,
            }
        else:
            payload["author"] = (
                {
                    "id": self.author.id,
                    "username": self.author.username,
                    "student_id": self.author.student_id,
                    "avatar_url": self.author.avatar_url,
                    "karma_score": getattr(self.author, "karma_score", 0),
                    "is_anonymous": self.is_anonymous,
                }
                if self.author
                else None
            )

        # Accountable tracing: include user_id if non-public or if post owner
        if not public or not self.is_anonymous or (current_user_id and current_user_id == self.user_id):
            payload["user_id"] = self.user_id

        if self.post_type == "poll" and self.poll_options:
            payload["poll"] = {
                "total_votes": total_poll_votes,
                "user_voted_option_id": user_voted_option_id,
                "options": [
                    opt.to_dict(total_poll_votes) for opt in self.poll_options
                ],
            }

        return payload

    def __repr__(self):
        return (
            f"<Post id={self.id} category='{self.category}' "
            f"user_id={self.user_id} upvotes={self.upvotes_count}>"
        )


class PostVote(db.Model):
    """
    PostVote tracks single-vote integrity per student for posts (upvote or downvote).
    Enforces a strict unique constraint on (user_id, post_id).
    """

    __tablename__ = "post_votes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    post_id = db.Column(
        db.Integer,
        db.ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vote_type = db.Column(db.String(10), nullable=False)  # 'upvote' or 'downvote'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship("User", back_populates="votes")
    post = db.relationship("Post", back_populates="votes")

    __table_args__ = (
        db.UniqueConstraint("user_id", "post_id", name="uq_user_post_vote"),
    )

    def __repr__(self):
        return (
            f"<PostVote id={self.id} user_id={self.user_id} "
            f"post_id={self.post_id} type='{self.vote_type}'>"
        )
