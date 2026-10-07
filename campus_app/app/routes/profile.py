import os
import time
from urllib.parse import urljoin, urlparse
from werkzeug.utils import secure_filename

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
from flask_login import current_user, login_required, logout_user

from app import db
from app.models.moderation import Block, Report
from app.models.post import Post
from app.models.user import User
from app.models.vlog import Vlog

profile_bp = Blueprint("profile", __name__)

ALLOWED_AVATAR_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_avatar_file(filename: str) -> bool:
    """Validates that uploaded avatar file has an approved image extension."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_AVATAR_EXTENSIONS
    )


def wants_json() -> bool:
    """Detects whether client requested a JSON response (AJAX/Fetch/Mobile client)."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


# -----------------------------------------------------------------------------
# View Profile Endpoint (GET /profile/<username>)
# -----------------------------------------------------------------------------
@profile_bp.route("/", methods=["GET"])
def index():
    """Redirects to authenticated student's own profile or login."""
    if current_user.is_authenticated and getattr(current_user, "username", None):
        return redirect(url_for("profile.view_profile", username=current_user.username))
    return redirect(url_for("auth.login"))


@profile_bp.route("/<username>", methods=["GET"])
def view_profile(username: str):
    """
    Renders public student profile with tabbed media items, privacy checks,
    and moderation relationship state (is_self, is_blocked, is_restricted).
    """
    target_user = User.query.filter_by(username=username).first()

    # If student does not exist or account is banned, return 404
    if not target_user or target_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Student profile not found."}), 404
        abort(404)

    is_self = current_user.is_authenticated and current_user.id == target_user.id
    is_blocked = False
    is_blocked_by = False
    is_restricted = False

    if current_user.is_authenticated and not is_self:
        is_blocked = current_user.is_blocking(target_user.id)
        is_blocked_by = target_user.is_blocking(current_user.id)
        # Privacy restriction: if either party blocked the other, hide content
        if is_blocked or is_blocked_by:
            is_restricted = True

    # Active tab filter (memes, fit_checks, vlogs)
    active_tab = request.args.get("tab", "memes").lower()
    if active_tab not in ("memes", "fit_checks", "vlogs"):
        active_tab = "memes"

    # Aggregated student stats
    memes_count = target_user.posts.filter_by(category="meme", is_flagged=False).count()
    fit_checks_count = target_user.posts.filter_by(category="fit_check", is_flagged=False).count()
    vlogs_count = target_user.vlogs.filter_by(is_flagged=False).count()
    total_posts_count = memes_count + fit_checks_count

    # Calculate net campus karma (sum of upvotes minus downvotes)
    user_posts = target_user.posts.filter_by(is_flagged=False).all()
    net_karma = sum(p.score for p in user_posts)

    # Fetch tabbed items if profile is not restricted
    items = []
    if not is_restricted:
        if active_tab == "memes":
            items = (
                target_user.posts.filter_by(category="meme", is_flagged=False)
                .order_by(Post.created_at.desc())
                .all()
            )
        elif active_tab == "fit_checks":
            items = (
                target_user.posts.filter_by(category="fit_check", is_flagged=False)
                .order_by(Post.created_at.desc())
                .all()
            )
        elif active_tab == "vlogs":
            items = (
                target_user.vlogs.filter_by(is_flagged=False)
                .order_by(Vlog.created_at.desc())
                .all()
            )

    profile_data = {
        "id": target_user.id,
        "student_id": target_user.student_id,
        "username": target_user.username,
        "bio": target_user.bio or "No bio provided.",
        "avatar_url": target_user.avatar_url,
        "is_admin": target_user.is_admin,
        "created_at": target_user.created_at.strftime("%B %Y") if target_user.created_at else "",
        "stats": {
            "posts_count": total_posts_count,
            "memes_count": memes_count,
            "fit_checks_count": fit_checks_count,
            "vlogs_count": vlogs_count,
            "net_karma": net_karma,
        },
        "relationship": {
            "is_self": is_self,
            "is_blocked": is_blocked,
            "is_blocked_by": is_blocked_by,
            "is_restricted": is_restricted,
        },
    }

    if wants_json():
        return jsonify({
            "status": "success",
            "profile": profile_data,
            "active_tab": active_tab,
            "items_count": len(items),
        }), 200

    return render_template(
        "profile/view.html",
        user=target_user,
        profile=profile_data,
        active_tab=active_tab,
        items=items,
        is_self=is_self,
        is_blocked=is_blocked,
        is_blocked_by=is_blocked_by,
        is_restricted=is_restricted,
        memes_count=memes_count,
        fit_checks_count=fit_checks_count,
        vlogs_count=vlogs_count,
        net_karma=net_karma,
    )


# -----------------------------------------------------------------------------
# Update Profile Endpoint (GET & POST /profile/edit)
# -----------------------------------------------------------------------------
@profile_bp.route("/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    """
    Allows authenticated students to edit bio (max 160 chars) and upload a new avatar.
    Saves avatar to app/static/uploads/avatars/ with secure, timestamped filenames.
    """
    if request.method == "POST":
        bio = (request.form.get("bio") or "").strip()
        avatar_file = request.files.get("avatar")

        errors = []

        # Validate Bio Length
        if len(bio) > 160:
            errors.append("Bio cannot exceed 160 characters in length.")

        # Process Avatar Upload if provided
        new_avatar_url = None
        if avatar_file and avatar_file.filename:
            if not allowed_avatar_file(avatar_file.filename):
                errors.append("Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.")
            else:
                ext = avatar_file.filename.rsplit(".", 1)[1].lower()
                safe_base = secure_filename(f"user_{current_user.id}_{int(time.time())}")
                unique_filename = f"{safe_base}.{ext}"

                upload_base = current_app.config.get(
                    "UPLOAD_FOLDER",
                    str(current_app.root_path + "/static/uploads")
                )
                avatar_dir = os.path.join(upload_base, "avatars")
                os.makedirs(avatar_dir, exist_ok=True)

                destination_path = os.path.join(avatar_dir, unique_filename)

                try:
                    avatar_file.save(destination_path)
                    new_avatar_url = f"avatars/{unique_filename}"
                except Exception as e:
                    errors.append(f"Failed to save avatar image: {str(e)}")

        if errors:
            if wants_json():
                return jsonify({"status": "error", "errors": errors, "message": errors[0]}), 422
            for err in errors:
                flash(err, "error")
            return render_template("profile/edit.html", user=current_user), 422

        # Commit updates to database
        current_user.bio = bio
        if new_avatar_url:
            current_user.avatar_url = new_avatar_url

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            err_msg = "Database error while updating profile. Please try again."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 500
            flash(err_msg, "error")
            return render_template("profile/edit.html", user=current_user), 500

        flash("Profile updated successfully.", "success")

        if wants_json():
            return jsonify({
                "status": "success",
                "message": "Profile updated successfully.",
                "redirect": url_for("profile.view_profile", username=current_user.username),
                "user": {
                    "username": current_user.username,
                    "bio": current_user.bio,
                    "avatar_url": current_user.avatar_url,
                },
            }), 200

        return redirect(url_for("profile.view_profile", username=current_user.username))

    return render_template("profile/edit.html", user=current_user)


# -----------------------------------------------------------------------------
# Privacy Actions: Block & Unblock
# -----------------------------------------------------------------------------
@profile_bp.route("/<username>/block", methods=["POST"])
@login_required
def block_user(username: str):
    """Blocks a campus student to restrict mutual interactions and feeds."""
    target_user = User.query.filter_by(username=username).first_or_404()

    if target_user.id == current_user.id:
        msg = "You cannot block your own profile."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "error")
        return redirect(url_for("profile.view_profile", username=username))

    success = current_user.block(target_user.id)
    if success:
        db.session.commit()
        flash(f"You have blocked @{target_user.username}.", "info")
    else:
        flash(f"@{target_user.username} is already blocked.", "info")

    if wants_json():
        return jsonify({
            "status": "success",
            "action": "blocked",
            "target_username": target_user.username,
            "message": f"@{target_user.username} has been blocked.",
        }), 200

    return redirect(url_for("profile.view_profile", username=username))


@profile_bp.route("/<username>/unblock", methods=["POST"])
@login_required
def unblock_user(username: str):
    """Unblocks a previously blocked campus student."""
    target_user = User.query.filter_by(username=username).first_or_404()

    success = current_user.unblock(target_user.id)
    if success:
        db.session.commit()
        flash(f"You have unblocked @{target_user.username}.", "success")
    else:
        flash(f"@{target_user.username} was not blocked.", "info")

    if wants_json():
        return jsonify({
            "status": "success",
            "action": "unblocked",
            "target_username": target_user.username,
            "message": f"@{target_user.username} has been unblocked.",
        }), 200

    return redirect(url_for("profile.view_profile", username=username))


# -----------------------------------------------------------------------------
# Moderation Action: Report User
# -----------------------------------------------------------------------------
@profile_bp.route("/<username>/report", methods=["POST"])
@login_required
def report_user(username: str):
    """
    Submits a community moderation report against a student account.
    Records report in database with status 'pending' for administrator review.
    """
    target_user = User.query.filter_by(username=username).first_or_404()

    if target_user.id == current_user.id:
        msg = "You cannot report your own profile."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "error")
        return redirect(url_for("profile.view_profile", username=username))

    data = request.get_json(silent=True) if request.is_json else request.form
    reason = (data.get("reason") or "").strip()
    content_type = data.get("content_type", "user")
    content_id = data.get("content_id")

    if not reason:
        err_msg = "Please specify a reason for submitting this report."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 400
        flash(err_msg, "error")
        return redirect(url_for("profile.view_profile", username=username))

    report = Report(
        reporter_id=current_user.id,
        reported_user_id=target_user.id,
        content_type=content_type,
        content_id=content_id if content_id else target_user.id,
        reason=reason,
        status="pending",
    )

    try:
        db.session.add(report)
        db.session.commit()
    except Exception:
        db.session.rollback()
        err_msg = "Failed to submit report. Please try again later."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 500
        flash(err_msg, "error")
        return redirect(url_for("profile.view_profile", username=username))

    success_msg = "Report submitted to campus moderation. Thank you for keeping our community safe."
    flash(success_msg, "success")

    if wants_json():
        return jsonify({
            "status": "success",
            "message": success_msg,
            "report_id": report.id,
        }), 201

    return redirect(url_for("profile.view_profile", username=username))


# -----------------------------------------------------------------------------
# Streamlined Mobile-First Student Settings Endpoint (GET & POST /profile/settings)
# -----------------------------------------------------------------------------
@profile_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    """
    Renders and processes essential settings options:
    - Account Settings (Change Password, Update Email)
    - Profile Visibility & Privacy (Public vs Campus Only)
    - Notification Preferences (Toggle Email/In-App alerts)
    - Theme Toggle (Light / Dark Mode)
    - Delete / Deactivate Account button
    """
    if request.method == "POST":
        data = request.get_json(silent=True) if request.is_json else request.form
        action = data.get("action", "save_all")

        # 1. Delete / Deactivate Account
        if action in ("deactivate", "delete"):
            current_user.is_active = False
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            logout_user()
            flash("Your account has been deactivated.", "info")
            if wants_json():
                return jsonify({"status": "success", "message": "Account deactivated."}), 200
            return redirect(url_for("auth.login"))

        errors = []
        success_messages = []

        # 2. Account Settings: Update Email
        new_email = (data.get("email") or "").strip().lower()
        if new_email and new_email != current_user.email.strip().lower():
            if not User.is_valid_student_email(new_email):
                errors.append("Invalid email. Must be an official @ktu.edu.gh student email.")
            else:
                existing = User.query.filter(User.email.ilike(new_email), User.id != current_user.id).first()
                if existing:
                    errors.append("This email address is already registered to another student account.")
                else:
                    current_user.email = new_email
                    success_messages.append("Institutional email updated.")

        # 3. Account Settings: Change Password
        curr_pwd = data.get("current_password")
        new_pwd = data.get("new_password")
        confirm_pwd = data.get("confirm_password")
        if new_pwd:
            if not curr_pwd:
                errors.append("Current password is required to set a new password.")
            elif not current_user.check_password(curr_pwd):
                errors.append("Current password does not match stored records.")
            elif len(new_pwd) < 6:
                errors.append("New password must be at least 6 characters long.")
            elif new_pwd != confirm_pwd:
                errors.append("New password and confirmation do not match.")
            else:
                current_user.set_password(new_pwd)
                success_messages.append("Password successfully updated.")

        # 4. Profile Visibility & Privacy
        if "profile_visibility" in data:
            vis = data.get("profile_visibility", "campus").lower().strip()
            if vis in ("public", "campus"):
                current_user.profile_visibility = vis
                success_messages.append(f"Profile visibility set to {vis.capitalize()}.")

        # 5. Notification Preferences
        if request.is_json:
            if "notify_email" in data:
                current_user.notify_email = bool(data.get("notify_email"))
            if "notify_in_app" in data:
                current_user.notify_in_app = bool(data.get("notify_in_app"))
        else:
            if "notifications_submitted" in data or action in ("save_all", "save_notifications"):
                current_user.notify_email = bool(request.form.get("notify_email"))
                current_user.notify_in_app = bool(request.form.get("notify_in_app"))
                success_messages.append("Notification preferences updated.")

        # 6. Theme Toggle
        if "theme_preference" in data:
            theme = data.get("theme_preference", "light").lower().strip()
            if theme in ("light", "dark"):
                current_user.theme_preference = theme
                success_messages.append(f"Theme set to {theme.capitalize()} Mode.")

        if errors:
            for err in errors:
                flash(err, "error")
            if wants_json():
                return jsonify({"status": "error", "errors": errors, "message": errors[0]}), 422
            return render_template("profile/settings.html", user=current_user), 422

        try:
            db.session.commit()
            if not success_messages:
                success_messages.append("Settings saved successfully.")
            for msg in success_messages:
                flash(msg, "success")
        except Exception:
            db.session.rollback()
            err_msg = "Database error saving settings. Please try again."
            flash(err_msg, "error")
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 500
            return render_template("profile/settings.html", user=current_user), 500

        if wants_json():
            return jsonify({
                "status": "success",
                "message": "Settings saved successfully.",
                "user": current_user.to_dict(),
            }), 200

        return redirect(url_for("profile.settings"))

    return render_template("profile/settings.html", user=current_user)

