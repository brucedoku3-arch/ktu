import os
from datetime import datetime, timedelta
from functools import wraps
from flask import (
    Blueprint,
    current_app,
    render_template,
    request,
    jsonify,
    flash,
    redirect,
    url_for,
    abort,
)
from flask_login import login_required, current_user

from app import db
from app.models.user import User
from app.models.post import Post
from app.models.vlog import Vlog
from app.models.culture import AuxSubmission, AuxBattle
from app.models.moderation import Report, ModLog
from app.models.message import Message
from app.models.facility import FacilityStatus

ADMIN_EMAIL = "brucedoku3@gmail.com"

admin_bp = Blueprint("admin", __name__)


def wants_json() -> bool:
    """Helper to detect AJAX or JSON requests."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


def admin_required(f):
    """
    Strict decorator enforcing administrator role authorization.
    Automatically elevates brucedoku3@gmail.com to super-admin status.
    Unauthorized requests receive 403 Forbidden or redirect to /feed/ with flash.
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        # Auto-elevate hardcoded super-admin email
        if (
            current_user.is_authenticated
            and current_user.email
            and current_user.email.strip().lower() == ADMIN_EMAIL
        ):
            if not current_user.is_admin or not getattr(current_user, "is_verified", True):
                current_user.is_admin = True
                current_user.is_verified = True
                db.session.commit()

        if not current_user.is_authenticated or not getattr(current_user, "is_admin", False):
            if wants_json():
                return jsonify({
                    "status": "error",
                    "message": "Admin authorization required to access the moderation command center."
                }), 403
            flash("Admin authorization required to access the moderation command center.", "danger")
            return redirect(url_for("feed.index"))

        return f(*args, **kwargs)
    return decorated_function


# =====================================================================
# PUBLIC REPORTING TRIGGER (POST /report or POST /admin/report)
# =====================================================================
@admin_bp.route("/report", methods=["POST"])
@login_required
def submit_report():
    """
    Public student endpoint to report content or users for safety violations.
    Enforces deduplication per (reporter_id, target_type, target_id).
    Accepts JSON or Form payloads.
    """
    data = request.get_json(silent=True) if request.is_json else request.form

    raw_target_type = (data.get("target_type") or "").strip().lower()
    target_type = "post" if raw_target_type == "confession" else raw_target_type
    target_id_raw = data.get("target_id")
    reason = (data.get("reason") or "").strip().lower()
    details = (data.get("details") or "").strip()

    valid_types = {"post", "comment", "vlog", "aux_submission", "review", "user", "confession", "message"}
    if not target_type or (target_type not in valid_types and raw_target_type not in valid_types):
        msg = f"Invalid target_type. Must be one of: {', '.join(sorted(valid_types))}"
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "warning")
        return redirect(request.referrer or url_for("feed.index"))

    try:
        target_id = int(target_id_raw)
    except (TypeError, ValueError):
        msg = "target_id must be a valid integer."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "warning")
        return redirect(request.referrer or url_for("feed.index"))

    if not reason:
        msg = "Please provide a valid reason for this report."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "warning")
        return redirect(request.referrer or url_for("feed.index"))

    # Resolve target entity and reported user
    reported_user_id = None
    target_obj = None

    if target_type in ("post", "confession"):
        target_obj = Post.query.get(target_id)
        if target_obj:
            reported_user_id = target_obj.user_id
    elif target_type == "vlog":
        target_obj = Vlog.query.get(target_id)
        if target_obj:
            reported_user_id = target_obj.user_id
    elif target_type == "aux_submission":
        target_obj = AuxSubmission.query.get(target_id)
        if target_obj:
            reported_user_id = target_obj.user_id
    elif target_type == "user":
        target_obj = User.query.get(target_id)
        if target_obj:
            reported_user_id = target_obj.id
    elif target_type == "message":
        target_obj = Message.query.get(target_id)
        if target_obj:
            reported_user_id = target_obj.sender_id

    if not target_obj:
        msg = f"The reported {raw_target_type} does not exist or was already deleted."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 404
        flash(msg, "warning")
        return redirect(request.referrer or url_for("feed.index"))

    # Prevent reporting oneself
    if reported_user_id and reported_user_id == current_user.id:
        msg = "You cannot report your own account or content."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "warning")
        return redirect(request.referrer or url_for("feed.index"))

    # Check for existing report to prevent report-spamming
    existing = Report.query.filter_by(
        reporter_id=current_user.id, target_type=target_type, target_id=target_id
    ).first()

    if existing:
        msg = "You have already submitted a report for this content. Our moderation team is reviewing it."
        if wants_json():
            return jsonify({"status": "info", "message": msg, "report_id": existing.id}), 200
        flash(msg, "info")
        return redirect(request.referrer or url_for("feed.index"))

    # Instantiate Report
    report = Report(
        reporter_id=current_user.id,
        target_type=target_type,
        target_id=target_id,
        reported_user_id=reported_user_id,
        reason=reason,
        details=details if details else None,
        status="pending",
    )

    try:
        db.session.add(report)
        if hasattr(target_obj, "is_flagged"):
            target_obj.is_flagged = True
        db.session.commit()
    except Exception:
        db.session.rollback()
        msg = "Failed to submit report due to a server error. Please try again."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 500
        flash(msg, "danger")
        return redirect(request.referrer or url_for("feed.index"))

    success_msg = "Report submitted for review. Thank you for keeping KTU safe."
    if wants_json():
        return jsonify({
            "status": "success",
            "message": success_msg,
            "report_id": report.id,
        }), 201

    flash(success_msg, "success")
    return redirect(request.referrer or url_for("feed.index"))


# =====================================================================
# 1. ADMIN OVERVIEW DASHBOARD (GET /admin/)
# =====================================================================
@admin_bp.route("/", methods=["GET"])
@admin_bp.route("/index", methods=["GET"])
@admin_required
def dashboard():
    """
    Centralized administrative command center & moderation oversight console.
    Queries global metrics:
      - Total Registered Students vs Active/Suspended Accounts.
      - Moderation Queue: Count of pending content/user reports.
      - Total Posts, Confessions, Vlogs, and Aux Submissions.
    """
    # 1. User & Account Metrics
    total_users_count = User.query.count()
    active_users_count = User.query.filter_by(is_active=True, is_banned=False, is_suspended=False).count()
    suspended_users_count = User.query.filter_by(is_suspended=True).count()
    banned_users_count = User.query.filter_by(is_banned=True).count()

    # 2. Moderation Queue Metrics
    pending_reports_count = Report.query.filter_by(status="pending").count()
    total_reports_count = Report.query.count()
    actioned_reports_count = Report.query.filter(Report.status.in_(["actioned", "dismissed"])).count()

    # 3. Content Volume Metrics
    total_memes_count = Post.query.filter_by(category="meme").count()
    total_confessions_count = Post.query.filter(
        (Post.category == "confession") | (Post.post_type == "confession") | (Post.is_anonymous == True)
    ).count()
    total_posts_count = Post.query.count()
    total_vlogs_count = Vlog.query.count()
    total_aux_count = AuxSubmission.query.count()

    flagged_posts_count = Post.query.filter_by(is_flagged=True).count()
    flagged_vlogs_count = Vlog.query.filter_by(is_flagged=True).count()

    # Active pending reports with true author resolution
    pending_reports = (
        Report.query.filter_by(status="pending")
        .order_by(Report.created_at.desc())
        .limit(100)
        .all()
    )

    enriched_pending_reports = []
    for rep in pending_reports:
        rep_dict = rep.to_dict()
        true_author = None
        target_preview = ""
        category_label = rep.target_type

        if rep.target_type in ("post", "confession"):
            p = Post.query.get(rep.target_id)
            if p:
                target_preview = p.caption or "[Media Post]"
                category_label = "Confession" if p.is_anonymous or p.category == "confession" else "Post"
                if p.author:
                    true_author = {
                        "id": p.author.id,
                        "student_id": p.author.student_id,
                        "username": p.author.username,
                        "email": p.author.email,
                        "is_anonymous": p.is_anonymous,
                    }
        elif rep.target_type == "vlog":
            v = Vlog.query.get(rep.target_id)
            if v:
                target_preview = v.caption or f"30s Vlog ({v.duration_seconds}s)"
                category_label = "Vlog"
                if v.author:
                    true_author = {
                        "id": v.author.id,
                        "student_id": v.author.student_id,
                        "username": v.author.username,
                        "email": v.author.email,
                        "is_anonymous": False,
                    }
        elif rep.target_type == "aux_submission":
            a = AuxSubmission.query.get(rep.target_id)
            if a:
                target_preview = f"{a.track_title} - {a.artist}"
                category_label = "Aux Submission"
                if a.user:
                    true_author = {
                        "id": a.user.id,
                        "student_id": a.user.student_id,
                        "username": a.user.username,
                        "email": a.user.email,
                        "is_anonymous": False,
                    }
        elif rep.target_type == "user":
            u = User.query.get(rep.target_id)
            if u:
                target_preview = f"@{u.username} ({u.student_id})"
                category_label = "Student Profile"
                true_author = {
                    "id": u.id,
                    "student_id": u.student_id,
                    "username": u.username,
                    "email": u.email,
                    "is_anonymous": False,
                }
        elif rep.target_type == "message":
            m = Message.query.get(rep.target_id)
            if m:
                target_preview = m.content[:100]
                category_label = "Direct Message"
                if m.sender:
                    true_author = {
                        "id": m.sender.id,
                        "student_id": m.sender.student_id,
                        "username": m.sender.username,
                        "email": m.sender.email,
                        "is_anonymous": False,
                    }

        rep_dict["true_author"] = true_author
        rep_dict["target_preview"] = target_preview
        rep_dict["category_label"] = category_label
        enriched_pending_reports.append(rep_dict)

    # Moderation action audit log
    recent_mod_logs = ModLog.query.order_by(ModLog.timestamp.desc()).limit(50).all()

    # Students directory for User Management tab
    all_users = User.query.order_by(User.created_at.desc()).limit(150).all()

    return render_template(
        "admin/dashboard.html",
        admin_email=ADMIN_EMAIL,
        is_super_admin=(current_user.email.strip().lower() == ADMIN_EMAIL.lower()),
        metrics={
            "total_users": total_users_count,
            "active_users": active_users_count,
            "suspended_users": suspended_users_count,
            "banned_users": banned_users_count,
            "pending_reports": pending_reports_count,
            "total_reports": total_reports_count,
            "actioned_reports": actioned_reports_count,
            "total_posts": total_posts_count,
            "total_confessions": total_confessions_count,
            "total_memes": total_memes_count,
            "total_vlogs": total_vlogs_count,
            "total_aux": total_aux_count,
            "flagged_posts": flagged_posts_count,
            "flagged_vlogs": flagged_vlogs_count,
            "total_mod_actions": ModLog.query.count(),
        },
        pending_reports=enriched_pending_reports,
        recent_mod_logs=recent_mod_logs,
        all_users=all_users,
    )


# =====================================================================
# SYSTEM ANALYTICS & PERFORMANCE TELEMETRY (GET /admin/analytics)
# =====================================================================
@admin_bp.route("/analytics", methods=["GET"])
@admin_required
def system_analytics():
    """
    Real-Time Telemetry Endpoints:
    1. Daily Active Users (DAU) and Monthly Active Users (MAU).
    2. Peak traffic hours for Facility Tracker updates and Aux Cord Battles.
    3. Storage utilization breakdown (vlogs folder size vs. image uploads vs. database size).
    """
    now = datetime.utcnow()
    dau_cutoff = now - timedelta(days=1)
    mau_cutoff = now - timedelta(days=30)

    # 1. Active Users (DAU & MAU)
    dau_users = set()
    mau_users = set()

    for p in Post.query.filter(Post.created_at >= mau_cutoff).with_entities(Post.user_id, Post.created_at).all():
        mau_users.add(p[0])
        if p[1] >= dau_cutoff:
            dau_users.add(p[0])

    for v in Vlog.query.filter(Vlog.created_at >= mau_cutoff).with_entities(Vlog.user_id, Vlog.created_at).all():
        mau_users.add(v[0])
        if v[1] >= dau_cutoff:
            dau_users.add(v[0])

    for m in Message.query.filter(Message.created_at >= mau_cutoff).with_entities(Message.sender_id, Message.created_at).all():
        mau_users.add(m[0])
        if m[1] >= dau_cutoff:
            dau_users.add(m[0])

    for f in FacilityStatus.query.filter(FacilityStatus.updated_at >= mau_cutoff).with_entities(FacilityStatus.updated_by, FacilityStatus.updated_at).all():
        if f[0]:
            mau_users.add(f[0])
            if f[1] >= dau_cutoff:
                dau_users.add(f[0])

    dau_count = max(len(dau_users), 1 if current_user.is_authenticated else 0)
    mau_count = max(len(mau_users), dau_count, User.query.count())

    # 2. Peak Traffic Hours
    facility_hours = [0] * 24
    for f in FacilityStatus.query.with_entities(FacilityStatus.updated_at).all():
        if f[0]:
            facility_hours[f[0].hour] += 1
    peak_facility_hour = max(range(24), key=lambda h: facility_hours[h]) if any(facility_hours) else 13

    aux_hours = [0] * 24
    for a in AuxSubmission.query.with_entities(AuxSubmission.created_at).all():
        if a[0]:
            aux_hours[a[0].hour] += 1
    peak_aux_hour = max(range(24), key=lambda h: aux_hours[h]) if any(aux_hours) else 20

    # 3. Storage Utilization Breakdown
    upload_base = current_app.config.get("UPLOAD_FOLDER", "")
    vlogs_size_bytes = 0
    images_size_bytes = 0

    if upload_base and os.path.exists(upload_base):
        vlogs_folder = os.path.join(upload_base, "vlogs")
        if os.path.exists(vlogs_folder):
            for root, _, files in os.walk(vlogs_folder):
                for fl in files:
                    try:
                        vlogs_size_bytes += os.path.getsize(os.path.join(root, fl))
                    except OSError:
                        pass

        for img_sub in ("memes", "avatars", "fit_checks"):
            img_folder = os.path.join(upload_base, img_sub)
            if os.path.exists(img_folder):
                for root, _, files in os.walk(img_folder):
                    for fl in files:
                        try:
                            images_size_bytes += os.path.getsize(os.path.join(root, fl))
                        except OSError:
                            pass

    db_size_bytes = 0
    db_uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri.startswith("sqlite:///"):
        db_path = db_uri.replace("sqlite:///", "")
        if os.path.exists(db_path):
            try:
                db_size_bytes = os.path.getsize(db_path)
            except OSError:
                pass

    total_storage_bytes = vlogs_size_bytes + images_size_bytes + db_size_bytes

    def format_bytes(b):
        if b < 1024 * 1024:
            return f"{round(b / 1024, 1)} KB"
        elif b < 1024 * 1024 * 1024:
            return f"{round(b / (1024 * 1024), 2)} MB"
        return f"{round(b / (1024 * 1024 * 1024), 2)} GB"

    analytics_payload = {
        "status": "success",
        "timestamp": now.isoformat(),
        "users": {
            "daily_active_users": dau_count,
            "monthly_active_users": mau_count,
            "total_registered_users": User.query.count(),
            "dau_to_mau_ratio": round((dau_count / max(mau_count, 1)) * 100, 1),
        },
        "peak_traffic_hours": {
            "facility_tracker": {
                "peak_hour": f"{peak_facility_hour:02d}:00 - {(peak_facility_hour + 1) % 24:02d}:00",
                "peak_hour_24h": peak_facility_hour,
                "label": "Central Cafeteria & Library Occupancy Peak",
                "hourly_distribution": facility_hours,
            },
            "aux_cord_battles": {
                "peak_hour": f"{peak_aux_hour:02d}:00 - {(peak_aux_hour + 1) % 24:02d}:00",
                "peak_hour_24h": peak_aux_hour,
                "label": "Evening Radio 87.7 FM Vibe Battles Peak",
                "hourly_distribution": aux_hours,
            },
        },
        "storage_utilization": {
            "vlogs_folder": {
                "bytes": vlogs_size_bytes,
                "human": format_bytes(vlogs_size_bytes),
                "percent_of_total": round((vlogs_size_bytes / max(total_storage_bytes, 1)) * 100, 1),
            },
            "image_uploads": {
                "bytes": images_size_bytes,
                "human": format_bytes(images_size_bytes),
                "percent_of_total": round((images_size_bytes / max(total_storage_bytes, 1)) * 100, 1),
            },
            "database_file": {
                "bytes": db_size_bytes,
                "human": format_bytes(db_size_bytes),
                "percent_of_total": round((db_size_bytes / max(total_storage_bytes, 1)) * 100, 1),
            },
            "total_allocated": {
                "bytes": total_storage_bytes,
                "human": format_bytes(total_storage_bytes),
            },
        },
    }

    if wants_json():
        return jsonify(analytics_payload), 200

    return render_template("admin/analytics.html", analytics=analytics_payload)


@admin_bp.route("/maintenance/run", methods=["POST"])
@admin_required
def trigger_maintenance():
    """Triggers automated maintenance routine (WAL checkpoint, cleanup)."""
    from app.utils.maintenance import run_automated_maintenance
    result = run_automated_maintenance()
    return jsonify({"status": "success", "maintenance_summary": result}), 200


# =====================================================================
# 2. TRACED ANONYMOUS CONTENT REVIEW (GET /admin/reports & GET /admin/reports/<id>)
# =====================================================================
@admin_bp.route("/reports", methods=["GET"])
@admin_required
def list_reports():
    """
    Lists flagged items across Confessions, Posts, Vlogs, Course Reviews, and DMs.
    Includes underlying user_id, real student handle, and @ktu.edu.gh email.
    """
    status_filter = request.args.get("status", "pending")
    query = Report.query
    if status_filter != "all":
        query = query.filter_by(status=status_filter)

    reports = query.order_by(Report.created_at.desc()).limit(100).all()
    results = []

    for rep in reports:
        item = rep.to_dict()
        true_author = None
        preview = ""

        if rep.target_type in ("post", "confession"):
            p = Post.query.get(rep.target_id)
            if p:
                preview = p.caption
                if p.author:
                    true_author = {
                        "user_id": p.author.id,
                        "username": p.author.username,
                        "student_id": p.author.student_id,
                        "email": p.author.email,
                        "is_anonymous_to_public": p.is_anonymous,
                    }
        elif rep.target_type == "vlog":
            v = Vlog.query.get(rep.target_id)
            if v:
                preview = v.caption
                if v.author:
                    true_author = {
                        "user_id": v.author.id,
                        "username": v.author.username,
                        "student_id": v.author.student_id,
                        "email": v.author.email,
                        "is_anonymous_to_public": False,
                    }
        elif rep.target_type == "user":
            u = User.query.get(rep.target_id)
            if u:
                preview = f"@{u.username} ({u.student_id})"
                true_author = {
                    "user_id": u.id,
                    "username": u.username,
                    "student_id": u.student_id,
                    "email": u.email,
                    "is_anonymous_to_public": False,
                }

        item["true_author"] = true_author
        item["content_preview"] = preview
        results.append(item)

    if wants_json():
        return jsonify({"status": "success", "reports": results}), 200

    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/reports/<int:report_id>", methods=["GET"])
@admin_required
def inspect_report(report_id: int):
    """
    Fetches full metadata and trace information for a reported item.
    For anonymous confessions and course reviews, strictly decrypts and reveals
    the real author's student ID, handle, and email exclusively for admin safety audits.
    """
    report = Report.query.get_or_404(report_id)

    target_data = {
        "target_type": report.target_type,
        "target_id": report.target_id,
        "exists": False,
        "is_anonymous": False,
        "content_preview": "",
        "details": {},
        "real_author": None,
    }

    if report.target_type in ("post", "confession"):
        post = Post.query.get(report.target_id)
        if post:
            target_data["exists"] = True
            target_data["is_anonymous"] = bool(post.is_anonymous)
            target_data["content_preview"] = post.caption or "[Media Post]"
            target_data["details"] = {
                "category": post.category,
                "post_type": post.post_type,
                "media_url": post.media_url,
                "score": post.score,
                "created_at": post.created_at.strftime("%b %d, %Y · %H:%M"),
                "is_flagged": post.is_flagged,
            }
            if post.author:
                target_data["real_author"] = {
                    "id": post.author.id,
                    "username": post.author.username,
                    "student_id": post.author.student_id,
                    "email": post.author.email,
                    "karma_score": post.author.karma_score,
                    "is_suspended": post.author.is_suspended,
                    "is_banned": post.author.is_banned,
                    "is_anonymous_to_public": post.is_anonymous,
                }

    elif report.target_type == "vlog":
        vlog = Vlog.query.get(report.target_id)
        if vlog:
            target_data["exists"] = True
            target_data["content_preview"] = vlog.caption or f"30s Vlog ({vlog.duration_seconds}s)"
            target_data["details"] = {
                "video_url": vlog.video_url,
                "duration_seconds": vlog.duration_seconds,
                "views_count": vlog.views_count,
                "likes_count": vlog.likes_count,
                "created_at": vlog.created_at.strftime("%b %d, %Y · %H:%M"),
            }
            if vlog.author:
                target_data["real_author"] = {
                    "id": vlog.author.id,
                    "username": vlog.author.username,
                    "student_id": vlog.author.student_id,
                    "email": vlog.author.email,
                    "karma_score": vlog.author.karma_score,
                    "is_suspended": vlog.author.is_suspended,
                    "is_banned": vlog.author.is_banned,
                    "is_anonymous_to_public": False,
                }

    elif report.target_type == "user":
        user = User.query.get(report.target_id)
        if user:
            target_data["exists"] = True
            target_data["content_preview"] = f"Student Profile @{user.username} ({user.student_id})"
            target_data["real_author"] = {
                "id": user.id,
                "username": user.username,
                "student_id": user.student_id,
                "email": user.email,
                "karma_score": user.karma_score,
                "is_suspended": user.is_suspended,
                "is_banned": user.is_banned,
                "is_anonymous_to_public": False,
            }

    payload = {
        "status": "success",
        "report": report.to_dict(),
        "target": target_data,
    }

    if wants_json():
        return jsonify(payload), 200

    return render_template("admin/report_detail.html", report=report, target=target_data)


# =====================================================================
# 3. MODERATION ACTION HANDLER (POST /admin/action)
# =====================================================================
@admin_bp.route("/action", methods=["POST"])
@admin_required
def handle_moderation_action():
    """
    General moderation action handler:
    Accepts payload: target_type ('post', 'vlog', 'user', 'confession', 'review', 'aux_submission', 'message'),
                     target_id, action ('delete_content', 'suspend_7_days', 'permanent_ban', 'dismiss_report', 'warn').
    Executes database modifications atomically and logs in ModLog.
    Returns JSON status: {"status": "success", "action_taken": action}.
    """
    data = request.get_json(silent=True) if request.is_json else request.form

    raw_type = (data.get("target_type") or "").strip().lower()
    target_type = "post" if raw_type == "confession" else raw_type
    target_id_raw = data.get("target_id")
    action = (data.get("action") or "").strip().lower()
    reason_note = (data.get("reason_note") or data.get("reason") or "").strip()
    report_id = data.get("report_id")

    valid_actions = {
        "delete_content",
        "suspend_7_days",
        "suspend_user",
        "permanent_ban",
        "ban_user",
        "dismiss_report",
        "dismiss",
        "warn",
    }

    if action not in valid_actions:
        return jsonify({
            "status": "error",
            "message": "Invalid action. Allowed: delete_content, suspend_7_days, permanent_ban, dismiss_report, warn"
        }), 400

    try:
        target_id = int(target_id_raw)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "target_id must be an integer."}), 400

    target_entity = None
    offending_user = None

    if target_type in ("post", "confession"):
        target_entity = Post.query.get(target_id)
        if target_entity:
            offending_user = target_entity.author
    elif target_type == "vlog":
        target_entity = Vlog.query.get(target_id)
        if target_entity:
            offending_user = target_entity.author
    elif target_type == "aux_submission":
        target_entity = AuxSubmission.query.get(target_id)
        if target_entity:
            offending_user = target_entity.user
    elif target_type == "message":
        target_entity = Message.query.get(target_id)
        if target_entity:
            offending_user = target_entity.sender
    elif target_type == "user":
        offending_user = User.query.get(target_id)
        target_entity = offending_user

    # Prevent super-admin from accidentally acting against themselves
    if offending_user and offending_user.id == current_user.id:
        msg = "You cannot perform moderation actions against your own admin account."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "danger")
        return redirect(url_for("admin.dashboard"))

    try:
        # 1. Action: Delete Content
        if action == "delete_content":
            if not target_entity or target_type == "user":
                return jsonify({
                    "status": "error",
                    "message": "Target content not found or cannot delete user via content action."
                }), 404

            # Safely remove physical files attached to target media
            media_path_attr = getattr(target_entity, "media_url", None) or getattr(target_entity, "video_url", None)
            if media_path_attr:
                rel_path = media_path_attr.lstrip("/")
                abs_path = os.path.join(current_app.root_path, rel_path)
                if os.path.exists(abs_path):
                    try:
                        os.remove(abs_path)
                    except OSError:
                        pass

            db.session.delete(target_entity)

        # 2. Action: Suspend User (7 Days)
        elif action in ("suspend_7_days", "suspend_user"):
            if not offending_user:
                return jsonify({"status": "error", "message": "Target user not found."}), 404

            offending_user.is_suspended = True
            offending_user.suspended_until = datetime.utcnow() + timedelta(days=7)

        # 3. Action: Permanent Ban
        elif action in ("permanent_ban", "ban_user"):
            if not offending_user:
                return jsonify({"status": "error", "message": "Target user not found."}), 404

            offending_user.is_banned = True
            offending_user.is_active = False

        # 4. Action: Dismiss / Warn
        elif action in ("dismiss_report", "dismiss", "warn"):
            if target_entity and hasattr(target_entity, "is_flagged"):
                target_entity.is_flagged = False

        # Resolve linked report status
        linked_reports = []
        if report_id:
            rep = Report.query.get(report_id)
            if rep:
                linked_reports.append(rep)
        else:
            linked_reports = Report.query.filter_by(
                target_type=target_type, target_id=target_id, status="pending"
            ).all()

        new_status = "dismissed" if action in ("dismiss_report", "dismiss") else "actioned"
        for rep in linked_reports:
            rep.status = new_status
            rep.action_taken = action
            rep.resolved_at = datetime.utcnow()
            rep.resolved_by_id = current_user.id

        # Record audit log
        log_entry = ModLog(
            admin_id=current_user.id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            target_user_id=offending_user.id if offending_user else None,
            reason=reason_note or f"Action {action} performed via admin center.",
            timestamp=datetime.utcnow(),
        )
        db.session.add(log_entry)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"An error occurred while executing moderation action: {str(e)}"
        }), 500

    msg = f"Successfully executed action '{action}' on {target_type} #{target_id}."
    if wants_json():
        return jsonify({"status": "success", "message": msg, "action_taken": action}), 200

    flash(msg, "success")
    return redirect(url_for("admin.dashboard"))


# =====================================================================
# 4. DIRECT USER STATUS MODERATION (POST /admin/users/<id>/toggle-status)
# =====================================================================
@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["POST"])
@admin_required
def toggle_user_status(user_id: int):
    """
    Direct endpoint to ban, unban, suspend, or reactivate student accounts.
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) if request.is_json else request.form
    action_type = (data.get("action") or "").strip().lower()

    if user.id == current_user.id:
        msg = "You cannot modify your own administrative status."
        if wants_json():
            return jsonify({"status": "error", "message": msg}), 400
        flash(msg, "danger")
        return redirect(url_for("admin.dashboard"))

    try:
        if action_type == "ban":
            user.is_banned = True
            user.is_active = False
        elif action_type == "unban":
            user.is_banned = False
            user.is_active = True
        elif action_type == "suspend":
            days = int(data.get("days", 7))
            user.is_suspended = True
            user.suspended_until = datetime.utcnow() + timedelta(days=days)
        elif action_type == "unsuspend":
            user.is_suspended = False
            user.suspended_until = None
        else:
            return jsonify({"status": "error", "message": "Invalid status toggle action."}), 400

        log_entry = ModLog(
            admin_id=current_user.id,
            action=f"user_{action_type}",
            target_type="user",
            target_id=user.id,
            target_user_id=user.id,
            reason=data.get("reason", f"Admin status update: {action_type}"),
            timestamp=datetime.utcnow(),
        )
        db.session.add(log_entry)
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

    msg = f"User @{user.username} account status updated: {action_type}."
    if wants_json():
        return jsonify({"status": "success", "message": msg}), 200

    flash(msg, "success")
    return redirect(url_for("admin.dashboard"))
