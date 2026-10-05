from datetime import datetime
import re
from app import db


class AuxBattle(db.Model):
    """
    AuxBattle model representing daily interactive campus music vibe competitions.
    Students compete for top vibes according to a campus theme.
    """

    __tablename__ = "aux_battles"

    id = db.Column(db.Integer, primary_key=True)
    theme = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    submissions = db.relationship(
        "AuxSubmission",
        back_populates="battle",
        cascade="all, delete-orphan",
        order_by="desc(AuxSubmission.upvotes - AuxSubmission.downvotes)",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "theme": self.theme,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "submissions_count": len(self.submissions),
        }

    def __repr__(self):
        return f"<AuxBattle id={self.id} theme='{self.theme}' active={self.is_active}>"


class AuxSubmission(db.Model):
    """
    AuxSubmission model for student music tracks submitted to the active Aux Battle.
    Enforces a single track submission per student per battle.
    """

    __tablename__ = "aux_submissions"

    id = db.Column(db.Integer, primary_key=True)
    battle_id = db.Column(
        db.Integer,
        db.ForeignKey("aux_battles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    track_title = db.Column(db.String(150), nullable=False)
    artist = db.Column(db.String(150), nullable=False)
    stream_url = db.Column(db.String(500), nullable=False)
    upvotes = db.Column(db.Integer, default=0, nullable=False)
    downvotes = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    battle = db.relationship("AuxBattle", back_populates="submissions")
    submitter = db.relationship("User", backref=db.backref("aux_submissions", lazy="dynamic"))
    votes = db.relationship("AuxVote", back_populates="submission", cascade="all, delete-orphan")

    # One track submission per student per battle theme
    __table_args__ = (
        db.UniqueConstraint("battle_id", "user_id", name="uq_battle_user_submission"),
    )

    @property
    def net_score(self) -> int:
        """Returns the net karma score (upvotes minus downvotes)."""
        return (self.upvotes or 0) - (self.downvotes or 0)

    @property
    def embed_info(self) -> dict:
        """
        Parses stream_url and returns sanitized embed details for Spotify, Apple Music,
        YouTube, or SoundCloud.
        """
        url = self.stream_url.strip()
        
        # 1. Spotify
        if "spotify.com" in url:
            # Matches track, episode, or playlist URL
            match = re.search(r"open\.spotify\.com/(track|album|playlist)/([a-zA-Z0-9]+)", url)
            if match:
                media_type, media_id = match.groups()
                return {
                    "provider": "spotify",
                    "embed_url": f"https://open.spotify.com/embed/{media_type}/{media_id}?utm_source=generator&theme=0",
                    "is_embeddable": True,
                    "color": "#1db954",
                }

        # 2. YouTube
        if "youtube.com" in url or "youtu.be" in url:
            # Matches standard v= or youtu.be/
            match = re.search(r"(?:v=|\.be/|embed/)([a-zA-Z0-9_-]{11})", url)
            if match:
                video_id = match.group(1)
                return {
                    "provider": "youtube",
                    "embed_url": f"https://www.youtube-nocookie.com/embed/{video_id}",
                    "is_embeddable": True,
                    "color": "#ff0000",
                }

        # 3. Apple Music
        if "music.apple.com" in url:
            embed_url = url.replace("music.apple.com", "embed.music.apple.com")
            return {
                "provider": "apple",
                "embed_url": embed_url,
                "is_embeddable": True,
                "color": "#fc3c44",
            }

        # 4. SoundCloud / Generic Music link
        return {
            "provider": "generic",
            "embed_url": url,
            "is_embeddable": False,
            "color": "#6366f1",
        }

    def to_dict(self, current_user_id: int = None) -> dict:
        user_vote = 0
        if current_user_id:
            vote_rec = next((v for v in self.votes if v.user_id == current_user_id), None)
            if vote_rec:
                user_vote = vote_rec.vote_type

        return {
            "id": self.id,
            "battle_id": self.battle_id,
            "user_id": self.user_id,
            "track_title": self.track_title,
            "artist": self.artist,
            "stream_url": self.stream_url,
            "upvotes": self.upvotes,
            "downvotes": self.downvotes,
            "net_score": self.net_score,
            "embed": self.embed_info,
            "created_at": self.created_at.isoformat(),
            "submitter": {
                "id": self.submitter.id if self.submitter else None,
                "username": self.submitter.username if self.submitter else "Anonymous",
                "avatar_url": self.submitter.avatar_url if self.submitter else "default_avatar.png",
            },
            "user_vote": user_vote,
        }

    def __repr__(self):
        return f"<AuxSubmission id={self.id} track='{self.track_title}' by='{self.artist}' score={self.net_score}>"


class AuxVote(db.Model):
    """
    AuxVote model tracking individual student votes (+1 / -1) on Aux Battle submissions.
    Guarantees atomic vote flips and prevents double voting.
    """

    __tablename__ = "aux_votes"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(
        db.Integer,
        db.ForeignKey("aux_submissions.id", ondelete="CASCADE"),
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
    submission = db.relationship("AuxSubmission", back_populates="votes")
    user = db.relationship("User", backref=db.backref("aux_votes", lazy="dynamic"))

    __table_args__ = (
        db.UniqueConstraint("submission_id", "user_id", name="uq_aux_submission_user_vote"),
    )

    def __repr__(self):
        return f"<AuxVote sub={self.submission_id} user={self.user_id} vote={self.vote_type}>"
