from app import login_manager, db
from app.models.user import User
from app.models.post import Post, PostVote
from app.models.vlog import Vlog
from app.models.message import Message
from app.models.moderation import Block, Report, ModLog
from app.models.poll import PollOption, PollVote
from app.models.facility import FacilityStatus
from app.models.culture import AuxBattle, AuxSubmission, AuxVote
from app.models.academic import CourseReview
from app.models.swap import SkillSwap
from app.models.social import FriendMatchRequest


@login_manager.user_loader
def load_user(user_id: str):
    """
    Flask-Login user loader callback.
    Loads user instance from the database using primary key id.
    """
    try:
        return db.session.get(User, int(user_id))
    except (ValueError, TypeError, Exception):
        return None


__all__ = [
    "User",
    "Post",
    "PostVote",
    "Vlog",
    "Message",
    "Block",
    "Report",
    "ModLog",
    "PollOption",
    "PollVote",
    "FacilityStatus",
    "AuxBattle",
    "AuxSubmission",
    "AuxVote",
    "CourseReview",
    "SkillSwap",
    "FriendMatchRequest",
    "load_user",
]
