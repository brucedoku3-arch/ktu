from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, jsonify, request
from flask_login import login_required, current_user

feed_bp = Blueprint("feed", __name__, url_prefix="/feed")


# -----------------------------------------------------------------------------
# Custom Decorator: Onboarding Requirement Guard
# -----------------------------------------------------------------------------
def onboarding_required(f):
    """
    Decorator that checks whether the current authenticated user has 
    completed onboarding. Redirects un-onboarded users to the setup wizard.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.is_authenticated and not current_user.is_onboarded:
            flash("Please complete your profile onboarding before accessing the campus feed.", "warning")
            
            # Support both AJAX/Fetch JSON requests and regular browser navigations
            if request.is_json or request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify({
                    "status": "error",
                    "message": "Onboarding required.",
                    "redirect_url": url_for("auth.onboarding")
                }), 403
                
            return redirect(url_for("auth.onboarding"))
        return f(*args, **kwargs)
    return decorated_function


# -----------------------------------------------------------------------------
# Campus Main Feed Route
# -----------------------------------------------------------------------------
@feed_bp.route("/", methods=["GET"])
@login_required
@onboarding_required
def index():
    """
    Displays the main campus feed. Access is granted only if the user is 
    logged in and has completed onboarding (is_onboarded == True).
    """
    # Sample feed items/announcements - replace with database queries as feed features expand
    feed_items = [
        {
            "id": 1,
            "author": "Campus IT Team",
            "avatar": "default_avatar.png",
            "timestamp": "2 hours ago",
            "content": "Welcome to the updated Campus App platform! Make sure your profile details are up to date.",
            "category": "Announcement",
            "is_official": True
        }
    ]

    return render_template("feed/index.html", user=current_user, feed_items=feed_items)
