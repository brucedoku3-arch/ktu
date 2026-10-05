import re
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
from sqlalchemy import desc

from app import db
from app.models.culture import AuxBattle, AuxSubmission, AuxVote
from app.models.post import Post
from app.models.user import User

culture_bp = Blueprint("culture", __name__)


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


def validate_music_stream_url(url: str) -> bool:
    """
    Validates that the provided URL belongs to an approved music provider:
    Spotify, Apple Music, YouTube, or SoundCloud.
    """
    if not url or not isinstance(url, str):
        return False
    clean = url.strip().lower()
    valid_domains = [
        "spotify.com",
        "open.spotify.com",
        "music.apple.com",
        "youtube.com",
        "youtu.be",
        "soundcloud.com",
    ]
    return any(domain in clean for domain in valid_domains)


def get_or_create_active_battle() -> AuxBattle:
    """
    Retrieves the current active AuxBattle, or automatically provisions
    a default daily campus theme if none is active.
    """
    battle = AuxBattle.query.filter_by(is_active=True).first()
    if not battle:
        battle = AuxBattle(
            theme="3 AM Rainy Night Drive - Koforidua Campus Vibes",
            description="Drop that one atmospheric song that hits different when the campus is completely silent.",
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.session.add(battle)
        db.session.commit()
    return battle


# -----------------------------------------------------------------------------
# A. Aux Battle Dashboard (GET /culture/aux)
# -----------------------------------------------------------------------------
@culture_bp.route("/aux", methods=["GET"])
def aux_battle():
    """
    Renders daily Aux Cord Battle dashboard with live ranked track submissions,
    embedded media players, current student vote states, and submission status.
    """
    battle = get_or_create_active_battle()

    # Query submissions sorted by net score (upvotes - downvotes desc) then recency
    submissions = (
        AuxSubmission.query.filter_by(battle_id=battle.id)
        .order_by((AuxSubmission.upvotes - AuxSubmission.downvotes).desc(), AuxSubmission.created_at.desc())
        .all()
    )

    user_submission = None
    user_votes_map = {}

    if current_user.is_authenticated:
        # Check if student has already submitted a track for this theme
        user_submission = AuxSubmission.query.filter_by(
            battle_id=battle.id, user_id=current_user.id
        ).first()

        # Map current user's votes on all submissions in this battle
        user_votes = AuxVote.query.filter_by(user_id=current_user.id).all()
        user_votes_map = {v.submission_id: v.vote_type for v in user_votes}

    if wants_json():
        return jsonify({
            "status": "success",
            "battle": battle.to_dict(),
            "has_submitted": user_submission is not None,
            "submissions": [
                s.to_dict(current_user_id=current_user.id if current_user.is_authenticated else None)
                for s in submissions
            ],
        }), 200

    return render_template(
        "culture/aux_battle.html",
        battle=battle,
        submissions=submissions,
        user_submission=user_submission,
        user_votes_map=user_votes_map,
    )


# -----------------------------------------------------------------------------
# B. Submit Track for Aux Cord (POST /culture/aux/submit)
# -----------------------------------------------------------------------------
@culture_bp.route("/aux/submit", methods=["POST"])
@login_required
def submit_aux_track():
    """
    Accepts track submission for current active battle.
    Validates active battle, verifies approved music stream URL,
    and enforces 1 track per student per battle constraint.
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended from culture submissions."}), 403
        flash("Your account is currently restricted from participating.", "error")
        return redirect(url_for("culture.aux_battle"))

    battle = get_or_create_active_battle()

    # Constraint Check: single track per student per battle
    existing = AuxSubmission.query.filter_by(
        battle_id=battle.id, user_id=current_user.id
    ).first()
    if existing:
        if wants_json():
            return jsonify({
                "status": "error",
                "message": "You have already submitted a track for today's Aux Cord Battle theme.",
            }), 409
        flash("You have already handed in your track for today's Aux Cord Battle!", "warning")
        return redirect(url_for("culture.aux_battle"))

    # Extract form or JSON data
    if request.is_json:
        data = request.get_json() or {}
        track_title = (data.get("track_title") or "").strip()
        artist = (data.get("artist") or "").strip()
        stream_url = (data.get("stream_url") or "").strip()
    else:
        track_title = (request.form.get("track_title") or "").strip()
        artist = (request.form.get("artist") or "").strip()
        stream_url = (request.form.get("stream_url") or "").strip()

    if not track_title or not artist or not stream_url:
        if wants_json():
            return jsonify({"status": "error", "message": "Track title, artist, and stream URL are required."}), 400
        flash("Please complete all track fields.", "error")
        return redirect(url_for("culture.aux_battle"))

    if not validate_music_stream_url(stream_url):
        valid_providers = "Spotify, Apple Music, YouTube, or SoundCloud"
        if wants_json():
            return jsonify({
                "status": "error",
                "message": f"Invalid music URL. Please provide a valid track link from {valid_providers}.",
            }), 422
        flash(f"Invalid music URL. Supported streaming links: {valid_providers}.", "error")
        return redirect(url_for("culture.aux_battle"))

    new_sub = AuxSubmission(
        battle_id=battle.id,
        user_id=current_user.id,
        track_title=track_title[:150],
        artist=artist[:150],
        stream_url=stream_url[:500],
        upvotes=1,  # Submitter gets initial +1 vibe
        downvotes=0,
        created_at=datetime.utcnow(),
    )
    db.session.add(new_sub)
    db.session.flush()

    # Record automatic author upvote
    initial_vote = AuxVote(
        submission_id=new_sub.id,
        user_id=current_user.id,
        vote_type=1,
        created_at=datetime.utcnow(),
    )
    db.session.add(initial_vote)

    # Award karma to student submitter
    current_user.karma_score = (current_user.karma_score or 0) + 1

    db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Track submitted to the Aux Battle!",
            "submission": new_sub.to_dict(current_user_id=current_user.id),
        }), 201

    flash(f"'{track_title}' by {artist} submitted to today's Aux Cord Battle!", "success")
    return redirect(url_for("culture.aux_battle"))


# -----------------------------------------------------------------------------
# C. Vote on Aux Track (POST /culture/aux/vote/<int:submission_id>)
# -----------------------------------------------------------------------------
@culture_bp.route("/aux/vote/<int:submission_id>", methods=["POST"])
@login_required
def vote_aux_track(submission_id: int):
    """
    Performs atomic voting (+1 / -1 / 0 retraction) on an Aux Battle track submission.
    Updates submission vote totals and recalculates target submitter's karma score.
    Returns JSON: {"status": "success", "net_votes": <int>, "user_vote": <int>}
    """
    sub = AuxSubmission.query.get_or_404(submission_id)

    vote_data = request.get_json(silent=True) or {}
    requested_vote = vote_data.get("vote_type", request.form.get("vote_type", type=int))

    if requested_vote not in (1, -1):
        return jsonify({"status": "error", "message": "Invalid vote type. Must be 1 or -1."}), 400

    existing_vote = AuxVote.query.filter_by(
        submission_id=sub.id, user_id=current_user.id
    ).first()

    target_user = sub.submitter

    if existing_vote:
        if existing_vote.vote_type == requested_vote:
            # Retract existing vote
            if requested_vote == 1:
                sub.upvotes = max(0, (sub.upvotes or 0) - 1)
                if target_user:
                    target_user.karma_score = (target_user.karma_score or 0) - 1
            else:
                sub.downvotes = max(0, (sub.downvotes or 0) - 1)
                if target_user:
                    target_user.karma_score = (target_user.karma_score or 0) + 1

            db.session.delete(existing_vote)
            final_user_vote = 0

        else:
            # Flip existing vote
            if requested_vote == 1:
                sub.upvotes = (sub.upvotes or 0) + 1
                sub.downvotes = max(0, (sub.downvotes or 0) - 1)
                if target_user:
                    target_user.karma_score = (target_user.karma_score or 0) + 2
            else:
                sub.downvotes = (sub.downvotes or 0) + 1
                sub.upvotes = max(0, (sub.upvotes or 0) - 1)
                if target_user:
                    target_user.karma_score = (target_user.karma_score or 0) - 2

            existing_vote.vote_type = requested_vote
            final_user_vote = requested_vote

    else:
        # Cast fresh vote
        new_vote = AuxVote(
            submission_id=sub.id,
            user_id=current_user.id,
            vote_type=requested_vote,
            created_at=datetime.utcnow(),
        )
        db.session.add(new_vote)

        if requested_vote == 1:
            sub.upvotes = (sub.upvotes or 0) + 1
            if target_user:
                target_user.karma_score = (target_user.karma_score or 0) + 1
        else:
            sub.downvotes = (sub.downvotes or 0) + 1
            if target_user:
                target_user.karma_score = (target_user.karma_score or 0) - 1

        final_user_vote = requested_vote

    db.session.commit()

    return jsonify({
        "status": "success",
        "submission_id": sub.id,
        "upvotes": sub.upvotes,
        "downvotes": sub.downvotes,
        "net_votes": sub.net_score,
        "user_vote": final_user_vote,
    }), 200


# -----------------------------------------------------------------------------
# D. Meme Vault Tagging & Campus Culture Hub (GET /culture/brainrot)
# -----------------------------------------------------------------------------
@culture_bp.route("/brainrot", methods=["GET"])
def brainrot_hub():
    """
    Campus Meme Vault and Viral Culture Hub.
    Filters meme posts by popular campus tags (#examseason, #ktu, #hallwars, #lecturers, #freshers).
    """
    active_tag = request.args.get("tag", "all").lower().strip()
    if active_tag and not active_tag.startswith("#") and active_tag != "all":
        active_tag = f"#{active_tag}"

    query = Post.query.filter(Post.category.in_(["meme", "memes"]), Post.is_flagged == False)

    if active_tag != "all":
        query = query.filter(Post.caption.ilike(f"%{active_tag}%"))

    posts = query.order_by(Post.created_at.desc()).limit(30).all()

    popular_tags = [
        {"name": "All Brainrot", "slug": "all", "count": Post.query.filter_by(category="meme").count()},
        {"name": "#ktu", "slug": "#ktu", "count": Post.query.filter(Post.category == "meme", Post.caption.ilike("%#ktu%")).count()},
        {"name": "#examseason", "slug": "#examseason", "count": Post.query.filter(Post.category == "meme", Post.caption.ilike("%#examseason%")).count()},
        {"name": "#hallwars", "slug": "#hallwars", "count": Post.query.filter(Post.category == "meme", Post.caption.ilike("%#hallwars%")).count()},
        {"name": "#lecturers", "slug": "#lecturers", "count": Post.query.filter(Post.category == "meme", Post.caption.ilike("%#lecturers%")).count()},
        {"name": "#freshers", "slug": "#freshers", "count": Post.query.filter(Post.category == "meme", Post.caption.ilike("%#freshers%")).count()},
    ]

    if wants_json():
        return jsonify({
            "status": "success",
            "active_tag": active_tag,
            "popular_tags": popular_tags,
            "posts": [p.to_dict() for p in posts],
        }), 200

    return render_template(
        "culture/brainrot.html",
        posts=posts,
        active_tag=active_tag,
        popular_tags=popular_tags,
    )
