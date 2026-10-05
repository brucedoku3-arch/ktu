from datetime import datetime
from app import db


class FacilityStatus(db.Model):
    """
    FacilityStatus tracks live, crowdsourced crowd levels for campus facilities
    (e.g., Main Gym, Library 2nd Floor, Central Cafeteria, Student Union).
    Statuses: 'empty' (green), 'moderate' (yellow), 'packed' (red).
    """

    __tablename__ = "facility_statuses"

    id = db.Column(db.Integer, primary_key=True)
    facility_name = db.Column(db.String(100), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="moderate")  # 'empty', 'moderate', 'packed'
    updated_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
        index=True,
    )

    # Relationships
    reporter = db.relationship("User")

    @property
    def status_label(self) -> str:
        """Formatted human label for crowd density."""
        labels = {
            "empty": "Plenty of Room",
            "moderate": "Moderately Busy",
            "packed": "At High Capacity",
        }
        return labels.get(self.status, self.status.title())

    @property
    def status_badge_class(self) -> str:
        """CSS badge modifier class for non-AI visual status."""
        classes = {
            "empty": "badge-status-empty",
            "moderate": "badge-status-moderate",
            "packed": "badge-status-packed",
        }
        return classes.get(self.status, "badge-status-moderate")

    @property
    def relative_time(self) -> str:
        """Calculates friendly relative time string (e.g., 'Just now', '4m ago')."""
        if not self.updated_at:
            return "Unknown"
        diff = datetime.utcnow() - self.updated_at
        seconds = int(diff.total_seconds())

        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = seconds // 60
            return f"{minutes}m ago"
        elif seconds < 86400:
            hours = seconds // 3600
            return f"{hours}h ago"
        else:
            days = seconds // 86400
            return f"{days}d ago"

    def to_dict(self) -> dict:
        """Serializes facility record for JSON APIs."""
        return {
            "id": self.id,
            "facility_name": self.facility_name,
            "status": self.status,
            "status_label": self.status_label,
            "status_badge_class": self.status_badge_class,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "relative_time": self.relative_time,
            "reporter_username": self.reporter.username if self.reporter else "Campus Student",
        }

    def __repr__(self):
        return f"<FacilityStatus id={self.id} name='{self.facility_name}' status='{self.status}'>"
