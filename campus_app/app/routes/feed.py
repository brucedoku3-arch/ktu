from functools import wraps
from flask import Blueprint, render_template, redirect, url_for, flash, jsonify, request
from flask_login import login_required, current_user
from app import db
from app.models.post import Post

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
        if current_user.is_authenticated and not getattr(current_user, "is_onboarded", False):
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
    feed_items = []
    try:
        posts = Post.query.filter_by(is_flagged=False).order_by(Post.created_at.desc()).limit(40).all()
        for p in posts:
            author_name = getattr(p.author, "full_name", None) or getattr(p.author, "username", "Campus Student")
            feed_items.append({
                "id": p.id,
                "author": "Anonymous Student" if p.is_anonymous else author_name,
                "author_username": "" if p.is_anonymous else getattr(p.author, "username", "student"),
                "avatar": getattr(p.author, "avatar_url", "images/avatars/avatar1.png"),
                "timestamp": p.created_at.strftime("%b %d, %H:%M") if p.created_at else "Recently",
                "content": p.caption or "",
                "media_url": p.media_url or "",
                "category": p.category.capitalize() if p.category else "General",
                "upvotes": p.upvotes_count,
                "downvotes": p.downvotes_count,
                "score": p.score,
                "is_official": getattr(p.author, "is_admin", False) and not p.is_anonymous,
            })
    except Exception:
        # Fallback if posts table is being initialized
        pass

    # If no posts yet, provide welcome official bulletin
    if not feed_items:
        feed_items = [
            {
                "id": 0,
                "author": "Campus Moderation & Admin",
                "author_username": "admin",
                "avatar": "images/avatars/avatar1.png",
                "timestamp": "Today",
                "content": "Welcome to KTU CampusSocial! The official social platform is live. Post your first update or fit check above!",
                "category": "Announcement",
                "upvotes": 12,
                "downvotes": 0,
                "score": 12,
                "is_official": True
            }
        ]

    return render_template("feed/index.html", user=current_user, feed_items=feed_items)


# -----------------------------------------------------------------------------
# Create Post Action
# -----------------------------------------------------------------------------
@feed_bp.route("/create", methods=["POST"])
@login_required
@onboarding_required
def create_post():
    """Handles campus feed post creation."""
    content = (request.form.get("content") or "").strip()
    category = (request.form.get("category") or "general").strip().lower()
    is_anon = bool(request.form.get("is_anonymous"))

    if not content:
        flash("Post content cannot be empty.", "warning")
        return redirect(url_for("feed.index"))

    try:
        new_post = Post(
            user_id=current_user.id,
            caption=content[:500],
            category=category[:20],
            post_type="standard",
            is_anonymous=is_anon,
            upvotes_count=0,
            downvotes_count=0,
            is_flagged=False
        )
        db.session.add(new_post)
        db.session.commit()
        flash("Your post has been shared with campus!", "success")
    except Exception as e:
        db.session.rollback()
        flash("Could not save post. Please try again.", "error")

    return redirect(url_for("feed.index"))
