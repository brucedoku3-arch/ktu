from datetime import datetime
from app import db


class CourseReview(db.Model):
    """
    CourseReview model for student peer reviews of academic lectures and courses.
    Captures workload, grading ease, and attendance strictness on a 1-5 scale,
    with built-in anonymous attribution protections.
    """

    __tablename__ = "course_reviews"

    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(20), nullable=False, index=True)
    course_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False, index=True)
    workload_rating = db.Column(db.Integer, nullable=False)  # 1 (light) to 5 (heavy)
    grading_ease = db.Column(db.Integer, nullable=False)     # 1 (harsh) to 5 (lenient)
    attendance_strictness = db.Column(db.Integer, nullable=False) # 1 (flexible) to 5 (mandatory)
    overall_rating = db.Column(db.Float, nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    is_anonymous = db.Column(db.Boolean, default=True, nullable=False)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    author = db.relationship("User", backref=db.backref("course_reviews", lazy="dynamic"))

    def to_dict(self, current_user_id: int = None, public: bool = True) -> dict:
        """
        Serializes review data. Strictly redacts author credentials if is_anonymous is True.
        Accountable Anonymous Serialization:
        - Stores user_id in database for moderation tracing.
        - Strips user_id and author relationship data ONLY in public serialization (public=True).
        """
        is_self = current_user_id and current_user_id == self.user_id
        author_data = (
            {"username": "Anonymous Student", "student_id": "Hidden", "is_self": is_self}
            if (self.is_anonymous and public and not is_self)
            else {
                "id": self.user_id,
                "username": self.author.username if self.author else "Verified Student",
                "student_id": self.author.student_id if self.author else "KTU-Student",
                "is_self": is_self,
            }
        )

        data = {
            "id": self.id,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "department": self.department,
            "workload_rating": self.workload_rating,
            "grading_ease": self.grading_ease,
            "attendance_strictness": self.attendance_strictness,
            "overall_rating": round(self.overall_rating, 1),
            "review_text": self.review_text,
            "is_anonymous": self.is_anonymous,
            "created_at": self.created_at.strftime("%b %d, %Y"),
            "author": author_data,
        }

        # Include user_id only in non-public moderation contexts or for review owner
        if not public or not self.is_anonymous or is_self:
            data["user_id"] = self.user_id

        return data

    def __repr__(self):
        return f"<CourseReview id={self.id} course='{self.course_code}' rating={self.overall_rating}>"
