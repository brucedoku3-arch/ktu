from datetime import datetime
from flask import (
    Blueprint,
    abort,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload

from app import db
from app.models.moderation import Block
from app.models.user import User
from app.models.vlog import Vlog, VlogVote
from app.services.video_service import (
    VideoValidationError,
    delete_vlog_files,
    process_uploaded_vlog,
)

vlogs_bp = Blueprint("vlogs", __name__)


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


# -----------------------------------------------------------------------------
# A. TikTok-Style Vertical Vlog Feed (GET /vlogs/)
# -----------------------------------------------------------------------------
@vlogs_bp.route("/", methods=["GET"])
def vlog_feed():
    """
    Renders the TikTok-style vertical micro-vlog feed.
    Filters out mutually blocked users, flags, and orders by recency or net score.
    """
    sort = request.args.get("sort", "recent")  # 'recent' or 'popular'

    query = (
        Vlog.query.options(joinedload(Vlog.author), joinedload(Vlog.votes))
        .filter(Vlog.is_flagged == False)
    )

    # Mutual block filtering
    if current_user.is_authenticated:
        blocked_by_me = [b.blocked_id for b in current_user.blocked_users.all()]
        blocking_me = [
            b.blocker_id
            for b in Block.query.filter_by(blocked_id=current_user.id).all()
        ]
        excluded_ids = set(blocked_by_me + blocking_me)
        if excluded_ids:
            query = query.filter(Vlog.user_id.notin_(excluded_ids))

    if sort == "popular":
        query = query.order_by(
            (Vlog.upvotes - Vlog.downvotes).desc(),
            Vlog.views_count.desc(),
            Vlog.created_at.desc(),
        )
    else:
        query = query.order_by(Vlog.created_at.desc())

    vlogs = query.limit(30).all()

    # Map current user's votes on these vlogs
    user_votes_map = {}
    if current_user.is_authenticated and vlogs:
        vlog_ids = [v.id for v in vlogs]
        votes = VlogVote.query.filter(
            VlogVote.user_id == current_user.id,
            VlogVote.vlog_id.in_(vlog_ids),
        ).all()
        user_votes_map = {v.vlog_id: v.vote_type for v in votes}

    if wants_json():
        return jsonify({
            "status": "success",
            "sort": sort,
            "vlogs": [
                v.to_dict(current_user_id=current_user.id if current_user.is_authenticated else None)
                for v in vlogs
            ],
        }), 200

    return render_template(
        "vlogs/feed.html",
        vlogs=vlogs,
        sort=sort,
        user_votes_map=user_votes_map,
    )


# -----------------------------------------------------------------------------
# B. Publish Vlog (GET /vlogs/create & POST /vlogs/create)
# -----------------------------------------------------------------------------
@vlogs_bp.route("/create", methods=["GET", "POST"])
@login_required
def create_vlog():
    """
    Upload and publish a short-form student micro-vlog.
    Strictly enforces 30-second duration cap, valid video formats (mp4, mov, webm),
    and creates high-res thumbnail cover frame.
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended from posting."}), 403
        flash("Your account is currently suspended from uploading vlogs.", "error")
        return redirect(url_for("vlogs.vlog_feed"))

    if request.method == "GET":
        return render_template("vlogs/create.html")

    # POST request processing
    caption = (request.form.get("caption") or "").strip()[:200]
    file = request.files.get("video")

    if not file or not file.filename:
        if wants_json():
            return jsonify({"status": "error", "message": "Please select a video file."}), 400
        flash("Please select a video file to upload.", "error")
        return render_template("vlogs/create.html", caption=caption), 400

    try:
        video_rel_path, thumb_rel_path, duration = process_uploaded_vlog(
            file, current_user.id
        )
    except VideoValidationError as e:
        if wants_json():
            return jsonify({"status": "error", "message": str(e)}), 422
        flash(str(e), "error")
        return render_template("vlogs/create.html", caption=caption), 422
    except Exception as e:
        if wants_json():
            return jsonify({"status": "error", "message": f"Processing error: {e}"}), 500
        flash(f"Failed to process video: {e}", "error")
        return render_template("vlogs/create.html", caption=caption), 500

    # Instantiate Vlog model record
    vlog = Vlog(
        user_id=current_user.id,
        video_url=video_rel_path,
        thumbnail_url=thumb_rel_path,
        caption=caption,
        duration_seconds=duration,
        views_count=1,
        upvotes=1,  # Author gets initial vibe
        downvotes=0,
        likes_count=1,
        created_at=datetime.utcnow(),
    )
    db.session.add(vlog)
    db.session.flush()

    # Author automatic upvote
    initial_vote = VlogVote(
        vlog_id=vlog.id,
        user_id=current_user.id,
        vote_type=1,
        created_at=datetime.utcnow(),
    )
    db.session.add(initial_vote)

    # Increment student karma
    current_user.karma_score = (current_user.karma_score or 0) + 1
    db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Vlog published successfully!",
            "vlog": vlog.to_dict(current_user_id=current_user.id),
        }), 201

    flash("Your 30-second vlog has been published to the campus feed!", "success")
    return redirect(url_for("vlogs.vlog_feed"))


# -----------------------------------------------------------------------------
# C. AJAX Vlog Voting & View Counter
# -----------------------------------------------------------------------------
@vlogs_bp.route("/<int:vlog_id>/vote", methods=["POST"])
@login_required
def vote_vlog(vlog_id: int):
    """
    Atomic AJAX voting on a vlog (+1 / -1 / retract).
    Updates author's campus karma score accordingly.
    """
    vlog = Vlog.query.get_or_404(vlog_id)

    vote_data = request.get_json(silent=True) or {}
    requested_vote = vote_data.get("vote_type", request.form.get("vote_type", type=int))

    if requested_vote not in (1, -1):
        return jsonify({"status": "error", "message": "Invalid vote. Must be 1 or -1."}), 400

    existing_vote = VlogVote.query.filter_by(
        vlog_id=vlog.id, user_id=current_user.id
    ).first()

    author = vlog.author

    if existing_vote:
        if existing_vote.vote_type == requested_vote:
            # Retract vote
            if requested_vote == 1:
                vlog.upvotes = max(0, (vlog.upvotes or 0) - 1)
                if author:
                    author.karma_score = (author.karma_score or 0) - 1
            else:
                vlog.downvotes = max(0, (vlog.downvotes or 0) - 1)
                if author:
                    author.karma_score = (author.karma_score or 0) + 1

            db.session.delete(existing_vote)
            final_user_vote = 0
        else:
            # Flip vote
            if requested_vote == 1:
                vlog.upvotes = (vlog.upvotes or 0) + 1
                vlog.downvotes = max(0, (vlog.downvotes or 0) - 1)
                if author:
                    author.karma_score = (author.karma_score or 0) + 2
            else:
                vlog.downvotes = (vlog.downvotes or 0) + 1
                vlog.upvotes = max(0, (vlog.upvotes or 0) - 1)
                if author:
                    author.karma_score = (author.karma_score or 0) - 2

            existing_vote.vote_type = requested_vote
            final_user_vote = requested_vote
    else:
        # Cast fresh vote
        new_vote = VlogVote(
            vlog_id=vlog.id,
            user_id=current_user.id,
            vote_type=requested_vote,
            created_at=datetime.utcnow(),
        )
        db.session.add(new_vote)

        if requested_vote == 1:
            vlog.upvotes = (vlog.upvotes or 0) + 1
            if author:
                author.karma_score = (author.karma_score or 0) + 1
        else:
            vlog.downvotes = (vlog.downvotes or 0) + 1
            if author:
                author.karma_score = (author.karma_score or 0) - 1

        final_user_vote = requested_vote

    vlog.likes_count = max(0, vlog.upvotes)
    db.session.commit()

    return jsonify({
        "status": "success",
        "vlog_id": vlog.id,
        "upvotes": vlog.upvotes,
        "downvotes": vlog.downvotes,
        "net_votes": vlog.net_votes,
        "user_vote": final_user_vote,
    }), 200


@vlogs_bp.route("/<int:vlog_id>/view", methods=["POST"])
def record_vlog_view(vlog_id: int):
    """
    Atomically increments views_count for analytics when a student watches the video.
    """
    vlog = Vlog.query.get_or_404(vlog_id)
    vlog.views_count = (vlog.views_count or 0) + 1
    db.session.commit()

    return jsonify({
        "status": "success",
        "vlog_id": vlog.id,
        "views_count": vlog.views_count,
    }), 200


# -----------------------------------------------------------------------------
# D. Delete Vlog (POST /vlogs/<int:vlog_id>/delete)
# -----------------------------------------------------------------------------
@vlogs_bp.route("/<int:vlog_id>/delete", methods=["POST"])
@login_required
def delete_vlog(vlog_id: int):
    """
    Deletes vlog file assets from disk and removes the database record.
    Restricted to vlog author or admin.
    """
    vlog = Vlog.query.get_or_404(vlog_id)

    is_author = vlog.user_id == current_user.id
    is_admin = getattr(current_user, "is_admin", False)

    if not (is_author or is_admin):
        if wants_json():
            return jsonify({"status": "error", "message": "Permission denied."}), 403
        flash("You do not have permission to delete this vlog.", "error")
        return redirect(url_for("vlogs.vlog_feed"))

    # Cleanup video and thumbnail files on disk
    delete_vlog_files(vlog.video_url, vlog.thumbnail_url)

    db.session.delete(vlog)
    db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Vlog deleted successfully.",
            "vlog_id": vlog_id,
        }), 200

    flash("Vlog deleted successfully.", "info")
    return redirect(url_for("vlogs.vlog_feed"))
