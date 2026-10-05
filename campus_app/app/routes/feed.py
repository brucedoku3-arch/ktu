import os
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
from sqlalchemy import desc
from sqlalchemy.orm import joinedload

from app import db
from app.models.moderation import Block
from app.models.poll import PollOption, PollVote
from app.models.post import Post, PostVote
from app.models.user import User
from app.models.vlog import Vlog
from app.services.upload_service import (
    ALLOWED_IMAGE_EXTENSIONS,
    UploadValidationError,
    allowed_image_file,
    check_image_safety,
    delete_uploaded_file,
    save_uploaded_image,
)

feed_bp = Blueprint("feed", __name__)


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


# -----------------------------------------------------------------------------
# Main Algorithmic Feed (GET /feed/)
# -----------------------------------------------------------------------------
@feed_bp.route("/", methods=["GET"])
def index():
    """
    Renders campus social feed with category filters (memes, fit_checks, confessions, polls),
    sorting (trending, newest, top), block exclusions, and eager-loaded author,
    poll options, and user-vote states.
    """
    category = request.args.get("category", "all").lower().strip()
    sort = request.args.get("sort", "trending").lower().strip()
    page = request.args.get("page", 1, type=int)
    per_page = 12

    query = Post.query.filter_by(is_flagged=False)

    # 1. Filter out posts from blocked or blocking students
    if current_user.is_authenticated:
        blocked_pairs = Block.query.filter(
            (Block.blocker_id == current_user.id) | (Block.blocked_id == current_user.id)
        ).all()
        blocked_user_ids = {
            b.blocked_id if b.blocker_id == current_user.id else b.blocker_id
            for b in blocked_pairs
        }
        if blocked_user_ids:
            query = query.filter(~Post.user_id.in_(blocked_user_ids))

    # 2. Apply Category Filters
    if category in ("meme", "memes"):
        query = query.filter(Post.category.in_(["meme", "memes"]))
    elif category in ("fit_check", "fit_checks", "fitcheck"):
        query = query.filter(Post.category.in_(["fit_check", "fit_checks"]))
    elif category in ("confession", "confessions"):
        query = query.filter(Post.post_type == "confession")
    elif category in ("poll", "polls"):
        query = query.filter(Post.post_type == "poll")

    # 3. Apply Sorting
    if sort == "newest":
        query = query.order_by(Post.created_at.desc())
    elif sort == "top":
        query = query.order_by(
            (Post.upvotes_count - Post.downvotes_count).desc(),
            Post.created_at.desc(),
        )
    else:
        # Default 'trending': weighted score with recency
        sort = "trending"
        query = query.order_by(
            (Post.upvotes_count * 2 - Post.downvotes_count).desc(),
            Post.created_at.desc(),
        )

    # 4. Eager load author and poll_options to eliminate N+1 queries
    query = query.options(joinedload(Post.author), joinedload(Post.poll_options))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = pagination.items

    # 5. Batch load user vote states for the current session
    user_votes_map = {}
    user_poll_votes_map = {}

    if current_user.is_authenticated and posts:
        post_ids = [p.id for p in posts]

        # Post upvotes/downvotes
        user_votes = PostVote.query.filter(
            PostVote.user_id == current_user.id,
            PostVote.post_id.in_(post_ids),
        ).all()
        for v in user_votes:
            user_votes_map[v.post_id] = 1 if v.vote_type == "upvote" else -1

        # Poll option votes
        poll_post_ids = [p.id for p in posts if p.post_type == "poll"]
        if poll_post_ids:
            poll_votes = PollVote.query.filter(
                PollVote.user_id == current_user.id,
                PollVote.post_id.in_(poll_post_ids),
            ).all()
            for pv in poll_votes:
                user_poll_votes_map[pv.post_id] = pv.poll_option_id

    if wants_json():
        current_uid = current_user.id if current_user.is_authenticated else None
        return jsonify({
            "status": "success",
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total,
            "category": category,
            "sort": sort,
            "posts": [p.to_dict(current_user_id=current_uid) for p in posts],
        }), 200

    recent_vlogs = (
        Vlog.query.filter_by(is_flagged=False)
        .order_by(Vlog.created_at.desc())
        .limit(10)
        .all()
    )

    return render_template(
        "feed/index.html",
        posts=posts,
        pagination=pagination,
        active_category=category,
        active_sort=sort,
        user_votes_map=user_votes_map,
        user_poll_votes_map=user_poll_votes_map,
        recent_vlogs=recent_vlogs,
    )


# -----------------------------------------------------------------------------
# Create Post (GET & POST /feed/create)
# -----------------------------------------------------------------------------
@feed_bp.route("/create", methods=["GET", "POST"])
@login_required
def create_post():
    """Handles campus meme and fit check creation with media file processing."""
    if request.method == "POST":
        title = (request.form.get("title") or request.form.get("caption") or "").strip()
        category = (request.form.get("category") or "memes").lower().strip()
        image_file = request.files.get("image") or request.files.get("media")

        # Normalize category
        if category in ("meme", "memes"):
            target_subfolder = "memes"
            db_category = "meme"
            post_type = "standard"
        elif category in ("fit_check", "fit_checks", "fitcheck"):
            target_subfolder = "fit_checks"
            db_category = "fit_check"
            post_type = "standard"
        else:
            target_subfolder = "memes"
            db_category = "meme"
            post_type = "standard"

        errors = []
        if not title:
            errors.append("Please provide a title or caption for your post.")
        if len(title) > 280:
            errors.append("Title/caption cannot exceed 280 characters in length.")
        if not image_file or not image_file.filename:
            errors.append("An image file (PNG, JPG, or WEBP) is required.")

        if errors:
            if wants_json():
                return jsonify({"status": "error", "errors": errors, "message": errors[0]}), 422
            for err in errors:
                flash(err, "error")
            return render_template("feed/create.html", title=title, category=category), 422

        # Process upload through centralized pipeline
        try:
            saved_media_path = save_uploaded_image(
                file_storage=image_file,
                target_subfolder=target_subfolder,
                user_id=current_user.id,
                max_dim=(1080, 1350),
            )
        except UploadValidationError as e:
            if wants_json():
                return jsonify({"status": "error", "message": str(e)}), 422
            flash(str(e), "error")
            return render_template("feed/create.html", title=title, category=category), 422

        # Create Post Record
        post = Post(
            user_id=current_user.id,
            category=db_category,
            post_type=post_type,
            is_anonymous=False,
            caption=title,
            media_url=saved_media_path,
            upvotes_count=0,
            downvotes_count=0,
            is_flagged=False,
        )

        try:
            db.session.add(post)
            db.session.commit()
        except Exception:
            db.session.rollback()
            delete_uploaded_file(saved_media_path)
            err_msg = "Database transaction failed while creating post. Please try again."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 500
            flash(err_msg, "error")
            return render_template("feed/create.html", title=title, category=category), 500

        flash("Your post is live on the campus feed!", "success")

        if wants_json():
            return jsonify({
                "status": "success",
                "message": "Post created successfully.",
                "post_id": post.id,
                "redirect": url_for("feed.index"),
            }), 201

        return redirect(url_for("feed.index"))

    return render_template("feed/create.html")


# -----------------------------------------------------------------------------
# Anonymous Confession Posting (POST /feed/confession)
# -----------------------------------------------------------------------------
@feed_bp.route("/confession", methods=["POST"])
@login_required
def create_confession():
    """
    Submits an anonymous campus confession.
    Strips student user identifiers from public feeds and JSON outputs (is_anonymous=True).
    """
    data = request.get_json(silent=True) if request.is_json else request.form
    content = (data.get("content") or data.get("caption") or "").strip()

    if not content:
        err_msg = "Confession content cannot be blank."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 422
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="confessions"))

    if len(content) > 500:
        err_msg = "Confession cannot exceed 500 characters in length."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 422
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="confessions"))

    confession_post = Post(
        user_id=current_user.id,
        category="confession",
        post_type="confession",
        is_anonymous=True,
        caption=content,
        media_url="",
        upvotes_count=0,
        downvotes_count=0,
        is_flagged=False,
    )

    try:
        db.session.add(confession_post)
        db.session.commit()
    except Exception:
        db.session.rollback()
        err_msg = "Failed to submit anonymous confession. Please try again."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 500
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="confessions"))

    flash("Anonymous confession submitted to the campus stream.", "success")

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Anonymous confession published successfully.",
            "post": confession_post.to_dict(current_user_id=current_user.id),
        }), 201

    return redirect(url_for("feed.index", category="confessions"))


# -----------------------------------------------------------------------------
# Campus Poll Voting (POST /feed/poll/<int:option_id>/vote)
# -----------------------------------------------------------------------------
@feed_bp.route("/poll/<int:option_id>/vote", methods=["POST"])
@login_required
def vote_poll(option_id: int):
    """
    Atomically registers a student vote for a poll option.
    Validates single vote integrity per student per poll and returns updated percentages.
    """
    option = PollOption.query.get_or_404(option_id)
    post = option.post

    # Verify student hasn't already voted on any option of this poll
    existing_vote = PollVote.query.filter_by(
        post_id=post.id, user_id=current_user.id
    ).first()

    if existing_vote:
        return jsonify({
            "status": "error",
            "message": "You have already voted on this campus poll.",
            "user_voted_option_id": existing_vote.poll_option_id,
        }), 400

    # Atomic increment and receipt logging
    option.vote_count += 1
    new_vote = PollVote(
        post_id=post.id,
        poll_option_id=option.id,
        user_id=current_user.id,
    )

    try:
        db.session.add(new_vote)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": "Transaction failed while recording poll vote.",
        }), 500

    # Calculate updated poll totals & percentages
    all_options = PollOption.query.filter_by(post_id=post.id).order_by(PollOption.id.asc()).all()
    total_votes = sum(opt.vote_count for opt in all_options)

    options_data = [opt.to_dict(total_votes) for opt in all_options]

    return jsonify({
        "status": "success",
        "post_id": post.id,
        "user_voted_option_id": option.id,
        "total_votes": total_votes,
        "options": options_data,
        "message": "Vote recorded.",
    }), 200


# -----------------------------------------------------------------------------
# Campus Poll Creation (POST /feed/poll/create)
# -----------------------------------------------------------------------------
@feed_bp.route("/poll/create", methods=["POST"])
@login_required
def create_poll():
    """Creates a student poll post with multiple selectable options."""
    data = request.get_json(silent=True) if request.is_json else request.form
    question = (data.get("question") or data.get("title") or "").strip()

    # Collect options
    raw_options = []
    if request.is_json and isinstance(data.get("options"), list):
        raw_options = data.get("options")
    else:
        # Form field fallback
        raw_options = [
            (request.form.get("option_1") or "").strip(),
            (request.form.get("option_2") or "").strip(),
            (request.form.get("option_3") or "").strip(),
            (request.form.get("option_4") or "").strip(),
        ]

    cleaned_options = [opt.strip() for opt in raw_options if opt and opt.strip()]

    if not question:
        err_msg = "Poll question cannot be empty."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 422
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="polls"))

    if len(cleaned_options) < 2:
        err_msg = "Please provide at least 2 distinct poll choices."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 422
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="polls"))

    poll_post = Post(
        user_id=current_user.id,
        category="poll",
        post_type="poll",
        is_anonymous=False,
        caption=question,
        media_url="",
        upvotes_count=0,
        downvotes_count=0,
        is_flagged=False,
    )
    db.session.add(poll_post)
    db.session.flush()

    for opt_text in cleaned_options[:5]:
        poll_opt = PollOption(
            post_id=poll_post.id,
            option_text=opt_text[:120],
            vote_count=0,
        )
        db.session.add(poll_opt)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        err_msg = "Failed to create campus poll."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 500
        flash(err_msg, "error")
        return redirect(url_for("feed.index", category="polls"))

    flash("Campus poll created successfully.", "success")

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Campus poll published.",
            "post": poll_post.to_dict(current_user_id=current_user.id),
        }), 201

    return redirect(url_for("feed.index", category="polls"))


# -----------------------------------------------------------------------------
# AJAX Voting Engine (POST /feed/post/<int:post_id>/vote)
# -----------------------------------------------------------------------------
@feed_bp.route("/post/<int:post_id>/vote", methods=["POST"])
@login_required
def vote_post(post_id: int):
    """
    Atomic AJAX voting engine supporting upvote (+1), downvote (-1), or clear (0).
    Recalculates post score and target author's total karma atomically.
    """
    post = Post.query.filter_by(id=post_id, is_flagged=False).first_or_404()

    data = request.get_json(silent=True) if request.is_json else request.form
    raw_vote = data.get("vote_type")

    if raw_vote in (1, "1", "upvote", "+1"):
        requested_vote = 1
    elif raw_vote in (-1, "-1", "downvote"):
        requested_vote = -1
    elif raw_vote in (0, "0", "clear", "remove"):
        requested_vote = 0
    else:
        return jsonify({"status": "error", "message": "Invalid vote_type specified."}), 400

    existing_vote = PostVote.query.filter_by(
        user_id=current_user.id, post_id=post.id
    ).first()

    current_user_vote = 0

    if requested_vote == 1:
        if existing_vote and existing_vote.vote_type == "upvote":
            db.session.delete(existing_vote)
            current_user_vote = 0
        elif existing_vote:
            existing_vote.vote_type = "upvote"
            current_user_vote = 1
        else:
            new_vote = PostVote(user_id=current_user.id, post_id=post.id, vote_type="upvote")
            db.session.add(new_vote)
            current_user_vote = 1
    elif requested_vote == -1:
        if existing_vote and existing_vote.vote_type == "downvote":
            db.session.delete(existing_vote)
            current_user_vote = 0
        elif existing_vote:
            existing_vote.vote_type = "downvote"
            current_user_vote = -1
        else:
            new_vote = PostVote(user_id=current_user.id, post_id=post.id, vote_type="downvote")
            db.session.add(new_vote)
            current_user_vote = -1
    else:
        if existing_vote:
            db.session.delete(existing_vote)
        current_user_vote = 0

    db.session.flush()

    post.upvotes_count = PostVote.query.filter_by(post_id=post.id, vote_type="upvote").count()
    post.downvotes_count = PostVote.query.filter_by(post_id=post.id, vote_type="downvote").count()

    author = post.author
    author_karma = 0
    if author:
        author_karma = author.recalculate_karma()

    db.session.commit()

    return jsonify({
        "status": "success",
        "post_id": post.id,
        "net_votes": post.score,
        "upvotes": post.upvotes_count,
        "downvotes": post.downvotes_count,
        "user_vote": current_user_vote,
        "author_karma": author_karma,
    }), 200


# -----------------------------------------------------------------------------
# Delete Post (POST /feed/post/<int:post_id>/delete)
# -----------------------------------------------------------------------------
@feed_bp.route("/post/<int:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id: int):
    """Deletes post record and cleans media asset from disk safely."""
    post = Post.query.get_or_404(post_id)

    if post.user_id != current_user.id and not current_user.is_admin:
        if wants_json():
            return jsonify({"status": "error", "message": "Permission denied."}), 403
        abort(403)

    media_path = post.media_url
    author = post.author

    try:
        if media_path:
            delete_uploaded_file(media_path)
        db.session.delete(post)
        db.session.commit()

        if author:
            author.recalculate_karma()
            db.session.commit()
    except Exception:
        db.session.rollback()
        err_msg = "Error deleting post. Please try again."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 500
        flash(err_msg, "error")
        return redirect(url_for("feed.index"))

    flash("Post removed successfully.", "info")

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Post deleted successfully.",
            "post_id": post_id,
        }), 200

    return redirect(url_for("feed.index"))


# -----------------------------------------------------------------------------
# Media Pre-Validation Utility (AJAX Helper)
# -----------------------------------------------------------------------------
@feed_bp.route("/validate-media", methods=["POST"])
@login_required
def validate_media():
    """Client-side AJAX endpoint for pre-upload validation."""
    if "media" not in request.files and "image" not in request.files:
        return jsonify({"status": "error", "is_valid": False, "message": "No media file provided."}), 400

    file_storage = request.files.get("media") or request.files.get("image")
    target_subfolder = request.form.get("category", "memes").lower()

    if not allowed_image_file(file_storage.filename):
        valid_exts = ", ".join(sorted(list(ALLOWED_IMAGE_EXTENSIONS)))
        return jsonify({
            "status": "error",
            "is_valid": False,
            "filename": file_storage.filename,
            "message": f"Invalid extension. Allowed: {valid_exts.upper()}",
        }), 422

    safety = check_image_safety(file_storage)
    if not safety["is_safe"]:
        return jsonify({
            "status": "error",
            "is_valid": False,
            "filename": file_storage.filename,
            "message": safety["flagged_reason"],
        }), 422

    max_mb = current_app.config.get("MAX_CONTENT_LENGTH", 16777216) // (1024 * 1024)

    return jsonify({
        "status": "success",
        "is_valid": True,
        "filename": file_storage.filename,
        "content_type": file_storage.content_type,
        "target_subfolder": target_subfolder,
        "max_allowed_mb": max_mb,
        "message": "File passed content safety, magic bytes, and extension validation.",
    }), 200


# -----------------------------------------------------------------------------
# Micro-Vlogs (30-Second Stories) Endpoints
# -----------------------------------------------------------------------------
@feed_bp.route("/vlog/upload", methods=["POST"])
@login_required
def upload_vlog():
    """
    Handles student 30-second micro-video vlog uploads.
    Enforces maximum duration constraint (duration <= 30.0s).
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended."}), 403
        flash("Your account is restricted from uploading vlogs.", "error")
        return redirect(url_for("feed.index"))

    caption = request.form.get("caption", "").strip()
    duration_str = request.form.get("duration", "15.0")
    try:
        duration_seconds = float(duration_str)
    except (ValueError, TypeError):
        duration_seconds = 15.0

    # Enforce strict 30-second duration constraint
    if duration_seconds > 30.0 or duration_seconds <= 0:
        if wants_json():
            return jsonify({
                "status": "error",
                "message": "Vlogs cannot exceed 30.0 seconds in duration.",
            }), 400
        flash("Campus Vlogs must be 30 seconds or shorter.", "error")
        return redirect(url_for("feed.index"))

    video_file = request.files.get("video")
    if not video_file or not video_file.filename:
        if wants_json():
            return jsonify({"status": "error", "message": "No video file uploaded."}), 400
        flash("Please select a video file for your vlog.", "error")
        return redirect(url_for("feed.index"))

    # Generate unique filename for vlog video
    ext = video_file.filename.rsplit(".", 1)[-1].lower() if "." in video_file.filename else "mp4"
    if ext not in {"mp4", "webm", "mov"}:
        ext = "mp4"

    upload_root = current_app.config.get(
        "UPLOAD_FOLDER",
        os.path.join(current_app.root_path, "static", "uploads")
    )
    vlog_dir = os.path.join(upload_root, "vlogs")
    os.makedirs(vlog_dir, exist_ok=True)

    import uuid
    vlog_filename = f"vlog_{current_user.id}_{uuid.uuid4().hex[:10]}.{ext}"
    video_file.save(os.path.join(vlog_dir, vlog_filename))

    vlog = Vlog(
        user_id=current_user.id,
        video_url=f"vlogs/{vlog_filename}",
        thumbnail_url=None,
        caption=caption,
        duration_seconds=round(duration_seconds, 1),
        views_count=0,
        likes_count=0,
    )
    db.session.add(vlog)
    db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "30-second vlog published successfully!",
            "vlog": {
                "id": vlog.id,
                "video_url": vlog.video_url,
                "duration_seconds": vlog.duration_seconds,
                "caption": vlog.caption,
            },
        }), 201

    flash("Your 30-second campus story is live!", "success")
    return redirect(url_for("feed.index"))


@feed_bp.route("/vlog/<int:vlog_id>/view", methods=["POST"])
def view_vlog(vlog_id: int):
    """Atomically increments view count on a micro-vlog story."""
    vlog = Vlog.query.get_or_404(vlog_id)
    vlog.views_count = (vlog.views_count or 0) + 1
    db.session.commit()
    return jsonify({"status": "success", "views_count": vlog.views_count}), 200


@feed_bp.route("/vlog/<int:vlog_id>/like", methods=["POST"])
@login_required
def like_vlog(vlog_id: int):
    """Atomically increments like count on a micro-vlog story."""
    vlog = Vlog.query.get_or_404(vlog_id)
    vlog.likes_count = (vlog.likes_count or 0) + 1
    db.session.commit()
    return jsonify({"status": "success", "likes_count": vlog.likes_count}), 200

