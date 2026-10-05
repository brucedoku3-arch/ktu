from datetime import datetime
from app import db


class Message(db.Model):
    """
    Message model for direct 1-to-1 messaging between campus students.
    Includes read status tracking and cascade integrity.
    """

    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recipient_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    sender = db.relationship(
        "User", foreign_keys=[sender_id], back_populates="sent_messages"
    )
    recipient = db.relationship(
        "User", foreign_keys=[recipient_id], back_populates="received_messages"
    )

    def mark_as_read(self) -> None:
        """Helper to mark message as read."""
        if not self.is_read:
            self.is_read = True

    @property
    def body(self) -> str:
        """Alias for content attribute for SocketIO and REST consistency."""
        return self.content

    @body.setter
    def body(self, value: str) -> None:
        self.content = value

    def to_dict(self) -> dict:
        """Serializes message for real-time SocketIO emits and JSON API responses."""
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "body": self.content,
            "content": self.content,
            "is_read": self.is_read,
            "created_at": self.created_at.strftime("%I:%M %p") if self.created_at else "",
            "created_at_iso": self.created_at.isoformat() if self.created_at else "",
        }

    def __repr__(self):
        return (
            f"<Message id={self.id} from={self.sender_id} "
            f"to={self.recipient_id} read={self.is_read}>"
        )
