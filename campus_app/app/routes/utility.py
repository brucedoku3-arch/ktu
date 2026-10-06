from datetime import datetime, timedelta
from flask import (
    Blueprint,
    abort,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required
from sqlalchemy import func, or_, and_, desc

from app import db
from app.models.academic import CourseReview
from app.models.facility import FacilityStatus
from app.models.message import Message
from app.models.social import FriendMatchRequest
from app.models.swap import SkillSwap
from app.models.user import User

utility_bp = Blueprint("utility", __name__)

DEFAULT_FACILITIES = [
    ("Main Recreation & Gym Center", "moderate"),
    ("Library 2nd Floor (Silent Study)", "empty"),
    ("Central Dining & Cafeteria", "packed"),
    ("Student Union Lounge", "moderate"),
    ("Engineering Computer Lab (Turing Hall)", "empty"),
]

DEFAULT_COURSES = [
    {
        "code": "IT 204",
        "name": "Data Structures & Algorithms",
        "department": "Computer Science & IT",
        "reviews": [
            {
                "workload": 4,
                "ease": 3,
                "strictness": 4,
                "overall": 3.8,
                "text": "Intense weekly problem sets on binary trees and dynamic programming. Start the assignments early; midterm curve is generous.",
            },
            {
                "workload": 3,
                "ease": 4,
                "strictness": 3,
                "overall": 4.1,
                "text": "Great lecturer who provides real code snippets. The sorting algorithms lab practical is straightforward if you practice on LeetCode.",
            },
        ],
    },
    {
        "code": "MATH 101",
        "name": "Calculus with Analytic Geometry",
        "department": "Mathematical Sciences",
        "reviews": [
            {
                "workload": 4,
                "ease": 2,
                "strictness": 5,
                "overall": 2.9,
                "text": "Strict 8:00 AM attendance policy. Derivatives and Taylor series exams have tricky questions, form study groups immediately.",
            },
        ],
    },
    {
        "code": "EE 210",
        "name": "Digital Logic & Circuit Design",
        "department": "Electrical & Electronic Engineering",
        "reviews": [
            {
                "workload": 3,
                "ease": 4,
                "strictness": 3,
                "overall": 4.3,
                "text": "Hands-on breadboard and FPGA labs in Turing Hall. TAs are super helpful if you get stuck on Karnaugh maps.",
            },
        ],
    },
    {
        "code": "COMM 102",
        "name": "Technical Communication & Reports",
        "department": "General & Institutional Studies",
        "reviews": [
            {
                "workload": 2,
                "ease": 5,
                "strictness": 2,
                "overall": 4.8,
                "text": "Very flexible grading and great practical advice on writing professional engineering reports and project memos.",
            },
        ],
    },
]

DEFAULT_SWAPS = [
    {
        "title": "Fresh Fade Haircut for Laundry Tokens",
        "offering": "Precision clippers haircut / taper fade (have barber kit in Unity Hall room 14)",
        "seeking": "6 laundry wash tokens or assistance with discrete math homework",
        "category": "haircut",
    },
    {
        "title": "Calculus II Exam Prep Tutoring",
        "offering": "2-hour intensive walkthrough of integration by parts & series tests",
        "seeking": "Homemade Jollof Rice or lunch at Central Dining Hall",
        "category": "tutoring",
    },
    {
        "title": "Final Year Project Proofreading",
        "offering": "Comprehensive grammar, LaTeX formatting, and IEEE citation review",
        "seeking": "Car ride to Koforidua Central Market on Saturday morning",
        "category": "proofreading",
    },
    {
        "title": "Guitar Lessons in Exchange for Dorm Ironing",
        "offering": "Beginner acoustic/electric guitar fundamentals (fingerpicking, basic chords)",
        "seeking": "Ironing 4 formal presentation shirts",
        "category": "other",
    },
]


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


def ensure_seeded_data():
    """Seeds default campus facilities, courses, and swaps if tables are unpopulated."""
    # 1. Facilities
    if FacilityStatus.query.count() == 0:
        for name, initial_status in DEFAULT_FACILITIES:
            fac = FacilityStatus(
                facility_name=name,
                status=initial_status,
                updated_at=datetime.utcnow() - timedelta(minutes=15),
            )
            db.session.add(fac)

    # 2. Sample Course Reviews (associate with first user if exists)
    first_user = User.query.first()
    if CourseReview.query.count() == 0 and first_user:
        for c in DEFAULT_COURSES:
            for r in c["reviews"]:
                review = CourseReview(
                    course_code=c["code"],
                    course_name=c["name"],
                    department=c["department"],
                    workload_rating=r["workload"],
                    grading_ease=r["ease"],
                    attendance_strictness=r["strictness"],
                    overall_rating=r["overall"],
                    review_text=r["text"],
                    is_anonymous=True,
                    user_id=first_user.id,
                    created_at=datetime.utcnow() - timedelta(days=2),
                )
                db.session.add(review)

    # 3. Sample Skill Swaps
    if SkillSwap.query.count() == 0 and first_user:
        for s in DEFAULT_SWAPS:
            swap = SkillSwap(
                title=s["title"],
                offering=s["offering"],
                seeking=s["seeking"],
                category=s["category"],
                status="open",
                user_id=first_user.id,
                created_at=datetime.utcnow() - timedelta(hours=6),
            )
            db.session.add(swap)

    db.session.commit()


# =============================================================================
# 1. FACILITY TRACKER (PROMPT 2.3)
# =============================================================================
@utility_bp.route("/", methods=["GET"])
def index():
    """Default utilities landing route."""
    return redirect(url_for("utility.get_facilities"))


@utility_bp.route("/facilities", methods=["GET"])
def get_facilities():
    """Live crowdsourced facility occupancy tracker."""
    ensure_seeded_data()
    facilities = FacilityStatus.query.order_by(FacilityStatus.id.asc()).all()
    cutoff_time = datetime.utcnow() - timedelta(minutes=45)

    facility_list = []
    for f in facilities:
        is_fresh = f.updated_at and f.updated_at >= cutoff_time
        item = f.to_dict()
        item["is_fresh"] = is_fresh
        facility_list.append(item)

    if wants_json():
        return jsonify({
            "status": "success",
            "count": len(facility_list),
            "facilities": facility_list,
        }), 200

    return render_template(
        "utility/facilities.html",
        facilities=facilities,
        facility_list=facility_list,
        cutoff_minutes=45,
    )


@utility_bp.route("/facilities/<int:facility_id>/report", methods=["POST"])
@login_required
def report_facility_status(facility_id: int):
    """Allows students to submit real-time occupancy status."""
    facility = FacilityStatus.query.get_or_404(facility_id)
    data = request.get_json(silent=True) if request.is_json else request.form
    new_status = (data.get("status") or "").lower().strip()

    valid_statuses = {"empty", "moderate", "packed"}
    if new_status not in valid_statuses:
        err_msg = "Invalid status. Allowed values: empty, moderate, or packed."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 422
        flash(err_msg, "error")
        return redirect(url_for("utility.get_facilities"))

    facility.status = new_status
    facility.updated_by = current_user.id
    facility.updated_at = datetime.utcnow()
    db.session.commit()

    success_msg = f"Reported @{facility.facility_name} as {facility.status_label}."
    flash(success_msg, "success")

    if wants_json():
        return jsonify({"status": "success", "message": success_msg, "facility": facility.to_dict()}), 200

    return redirect(url_for("utility.get_facilities"))


# =============================================================================
# 2. LECTURE REVIEWS DIRECTORY (PROMPT 2.5)
# =============================================================================
@utility_bp.route("/courses", methods=["GET"])
def get_courses():
    """
    Renders peer-reviewed course directory. Aggregates review metrics per course code,
    including average workload, grading ease, attendance strictness, and overall rating.
    """
    ensure_seeded_data()

    search_query = request.args.get("q", "").strip()
    department_filter = request.args.get("department", "all").strip()

    query = CourseReview.query

    if department_filter and department_filter != "all":
        query = query.filter_by(department=department_filter)

    if search_query:
        query = query.filter(
            or_(
                CourseReview.course_code.ilike(f"%{search_query}%"),
                CourseReview.course_name.ilike(f"%{search_query}%"),
            )
        )

    all_reviews = query.order_by(CourseReview.created_at.desc()).all()

    # Group reviews by course_code
    grouped_courses = {}
    departments_set = set()

    for rev in all_reviews:
        departments_set.add(rev.department)
        code = rev.course_code.upper()
        if code not in grouped_courses:
            grouped_courses[code] = {
                "course_code": code,
                "course_name": rev.course_name,
                "department": rev.department,
                "reviews": [],
                "workload_sum": 0,
                "ease_sum": 0,
                "strictness_sum": 0,
                "overall_sum": 0,
            }

        grouped_courses[code]["reviews"].append(
            rev.to_dict(current_user_id=current_user.id if current_user.is_authenticated else None)
        )
        grouped_courses[code]["workload_sum"] += rev.workload_rating
        grouped_courses[code]["ease_sum"] += rev.grading_ease
        grouped_courses[code]["strictness_sum"] += rev.attendance_strictness
        grouped_courses[code]["overall_sum"] += rev.overall_rating

    course_list = []
    for code, data in grouped_courses.items():
        count = len(data["reviews"])
        course_list.append({
            "course_code": data["course_code"],
            "course_name": data["course_name"],
            "department": data["department"],
            "review_count": count,
            "avg_workload": round(data["workload_sum"] / count, 1),
            "avg_ease": round(data["ease_sum"] / count, 1),
            "avg_strictness": round(data["strictness_sum"] / count, 1),
            "avg_overall": round(data["overall_sum"] / count, 1),
            "reviews": data["reviews"],
        })

    # Sort courses by average overall rating descending
    course_list.sort(key=lambda c: c["avg_overall"], reverse=True)

    departments = sorted(list(departments_set))

    if wants_json():
        return jsonify({
            "status": "success",
            "count": len(course_list),
            "courses": course_list,
            "departments": departments,
        }), 200

    return render_template(
        "utility/courses.html",
        courses=course_list,
        departments=departments,
        active_department=department_filter,
        search_query=search_query,
    )


@utility_bp.route("/courses/review", methods=["POST"])
@login_required
def submit_course_review():
    """
    Submits a new anonymous course review with workload, ease, and strictness ratings.
    Calculates weighted overall rating and stores review text.
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account restricted from reviewing."}), 403
        flash("Your account is restricted from posting reviews.", "error")
        return redirect(url_for("utility.get_courses"))

    data = request.get_json(silent=True) if request.is_json else request.form

    course_code = (data.get("course_code") or "").strip().upper()
    course_name = (data.get("course_name") or "").strip()
    department = (data.get("department") or "").strip()
    review_text = (data.get("review_text") or "").strip()
    is_anonymous = data.get("is_anonymous", "true") in ("true", "1", True, "on")

    try:
        workload = max(1, min(5, int(data.get("workload_rating", 3))))
        ease = max(1, min(5, int(data.get("grading_ease", 3))))
        strictness = max(1, min(5, int(data.get("attendance_strictness", 3))))
    except (ValueError, TypeError):
        workload, ease, strictness = 3, 3, 3

    if not course_code or not course_name or not review_text:
        err_msg = "Please fill in course code, title, and advice text."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 400
        flash(err_msg, "error")
        return redirect(url_for("utility.get_courses"))

    # Compute balanced overall score (out of 5.0)
    # Higher ease + lower workload + reasonable strictness = higher satisfaction
    overall = round((ease * 1.5 + (6 - workload) * 1.0 + (6 - strictness) * 0.5 + 3.0) / 2.5, 1)
    overall = max(1.0, min(5.0, overall))

    review = CourseReview(
        course_code=course_code[:20],
        course_name=course_name[:100],
        department=department[:100] or "General Studies",
        workload_rating=workload,
        grading_ease=ease,
        attendance_strictness=strictness,
        overall_rating=overall,
        review_text=review_text,
        is_anonymous=is_anonymous,
        user_id=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.session.add(review)
    db.session.commit()

    flash(f"Review for {course_code} published anonymously. Thanks for helping fellow students!", "success")

    if wants_json():
        return jsonify({
            "status": "success",
            "message": "Course review submitted.",
            "review": review.to_dict(current_user_id=current_user.id),
        }), 201

    return redirect(url_for("utility.get_courses"))


# =============================================================================
# 3. CASUAL SKILL SWAP NOTICE BOARD (PROMPT 2.5)
# =============================================================================
@utility_bp.route("/skill-swap", methods=["GET"])
def get_skill_swaps():
    """
    Lists active student skill swaps and favor barters.
    Filterable by category: 'haircut', 'laundry', 'tutoring', 'proofreading', 'other'.
    """
    ensure_seeded_data()

    category_filter = request.args.get("category", "all").lower().strip()
    status_filter = request.args.get("status", "open").lower().strip()

    query = SkillSwap.query

    if status_filter != "all":
        query = query.filter_by(status=status_filter)

    if category_filter != "all":
        query = query.filter_by(category=category_filter)

    swaps = query.order_by(desc(SkillSwap.created_at)).all()

    categories = [
        {"slug": "all", "label": "All Swaps", "icon": "🔄"},
        {"slug": "haircut", "label": "Haircuts", "icon": "✂️"},
        {"slug": "laundry", "label": "Laundry", "icon": "🧺"},
        {"slug": "tutoring", "label": "Tutoring", "icon": "📚"},
        {"slug": "proofreading", "label": "Proofreading", "icon": "📝"},
        {"slug": "other", "label": "Other Barter", "icon": "🤝"},
    ]

    if wants_json():
        return jsonify({
            "status": "success",
            "count": len(swaps),
            "category": category_filter,
            "swaps": [s.to_dict() for s in swaps],
        }), 200

    return render_template(
        "utility/skill_swap.html",
        swaps=swaps,
        categories=categories,
        active_category=category_filter,
        active_status=status_filter,
    )


@utility_bp.route("/skill-swap/create", methods=["POST"])
@login_required
def create_skill_swap():
    """Creates a new student favor exchange offer."""
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended."}), 403
        flash("Account restricted.", "error")
        return redirect(url_for("utility.get_skill_swaps"))

    data = request.get_json(silent=True) if request.is_json else request.form

    title = (data.get("title") or "").strip()
    offering = (data.get("offering") or "").strip()
    seeking = (data.get("seeking") or "").strip()
    category = (data.get("category") or "other").lower().strip()

    valid_cats = {"haircut", "laundry", "tutoring", "proofreading", "other"}
    if category not in valid_cats:
        category = "other"

    if not title or not offering or not seeking:
        err_msg = "Please specify what you offer and what you are seeking in return."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 400
        flash(err_msg, "error")
        return redirect(url_for("utility.get_skill_swaps"))

    swap = SkillSwap(
        title=title[:120],
        offering=offering[:200],
        seeking=seeking[:200],
        category=category,
        status="open",
        user_id=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.session.add(swap)
    db.session.commit()

    flash("Your skill swap offer is posted to the campus barter board!", "success")

    if wants_json():
        return jsonify({"status": "success", "swap": swap.to_dict()}), 201

    return redirect(url_for("utility.get_skill_swaps"))


@utility_bp.route("/skill-swap/<int:swap_id>/fulfill", methods=["POST"])
@login_required
def fulfill_skill_swap(swap_id: int):
    """Marks a skill swap listing as fulfilled or closed."""
    swap = SkillSwap.query.get_or_404(swap_id)

    if swap.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    swap.status = "fulfilled"
    db.session.commit()

    flash("Skill swap marked as fulfilled!", "success")
    return redirect(url_for("utility.get_skill_swaps"))


# =============================================================================
# 4. LOW-PRESSURE FRIEND ROULETTE MATCHER (PROMPT 2.5)
# =============================================================================
@utility_bp.route("/roulette", methods=["GET"])
def roulette_matcher():
    """
    Renders low-pressure campus companionship matcher.
    Checks if current student has an active pending or matched roulette request.
    """
    active_request = None
    if current_user.is_authenticated:
        active_request = (
            FriendMatchRequest.query.filter_by(user_id=current_user.id)
            .filter(FriendMatchRequest.status.in_(["pending", "matched"]))
            .order_by(FriendMatchRequest.created_at.desc())
            .first()
        )

    # Queue statistics
    queue_counts = {
        "study_buddy": FriendMatchRequest.query.filter_by(activity_type="study_buddy", status="pending").count(),
        "lab_partner": FriendMatchRequest.query.filter_by(activity_type="lab_partner", status="pending").count(),
        "dining_hall": FriendMatchRequest.query.filter_by(activity_type="dining_hall", status="pending").count(),
    }
    total_waiting = sum(queue_counts.values())

    if wants_json():
        return jsonify({
            "status": "success",
            "active_request": active_request.to_dict() if active_request else None,
            "queue_counts": queue_counts,
            "total_waiting": total_waiting,
        }), 200

    return render_template(
        "utility/roulette.html",
        active_request=active_request,
        queue_counts=queue_counts,
        total_waiting=total_waiting,
    )


@utility_bp.route("/roulette/join", methods=["POST"])
@login_required
def join_roulette():
    """
    Enters student into low-pressure Friend Roulette matching queue.
    Searches for an immediate pending match with the same activity & time slot.
    If match found, pairs instantly and creates direct message channel.
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended."}), 403
        flash("Account restricted.", "error")
        return redirect(url_for("utility.roulette_matcher"))

    data = request.get_json(silent=True) if request.is_json else request.form

    activity = (data.get("activity_type") or "study_buddy").lower().strip()
    time_slot = (data.get("time_slot") or "evening").lower().strip()

    valid_activities = {"study_buddy", "lab_partner", "dining_hall"}
    valid_slots = {"morning", "afternoon", "evening"}

    if activity not in valid_activities:
        activity = "study_buddy"
    if time_slot not in valid_slots:
        time_slot = "evening"

    # Cancel any previous pending requests for this student
    FriendMatchRequest.query.filter_by(user_id=current_user.id, status="pending").update({"status": "cancelled"})

    # Matching Search: Find candidate waiting in queue
    candidate = (
        FriendMatchRequest.query.filter(
            FriendMatchRequest.user_id != current_user.id,
            FriendMatchRequest.activity_type == activity,
            FriendMatchRequest.time_slot == time_slot,
            FriendMatchRequest.status == "pending",
        )
        .order_by(FriendMatchRequest.created_at.asc())
        .first()
    )

    if candidate:
        # Instant Match Found!
        my_req = FriendMatchRequest(
            user_id=current_user.id,
            activity_type=activity,
            time_slot=time_slot,
            status="matched",
            matched_user_id=candidate.user_id,
            created_at=datetime.utcnow(),
        )
        candidate.status = "matched"
        candidate.matched_user_id = current_user.id

        db.session.add(my_req)

        # Automatically seed a friendly connection message in Direct Messages
        partner = User.query.get(candidate.user_id)
        if partner:
            activity_names = {
                "study_buddy": "Library Study Session",
                "lab_partner": "Workshop & Lab Practicals",
                "dining_hall": "Dining Hall Meal",
            }
            conn_msg = Message(
                sender_id=current_user.id,
                recipient_id=partner.id,
                content=f"👋 Hey @{partner.username}! We just matched on Campus Friend Roulette for a {activity_names.get(activity, 'meetup')} ({time_slot.capitalize()}). Ready to link up?",
                is_read=False,
                created_at=datetime.utcnow(),
            )
            db.session.add(conn_msg)

        db.session.commit()

        match_msg = f"🎉 Match Found! You've been paired with @{candidate.user.username} for {activity.replace('_', ' ').title()}!"
        flash(match_msg, "success")

        if wants_json():
            return jsonify({
                "status": "matched",
                "message": match_msg,
                "partner": {
                    "id": candidate.user.id,
                    "username": candidate.user.username,
                    "student_id": candidate.user.student_id,
                    "avatar_url": candidate.user.avatar_url,
                },
                "chat_url": url_for("messaging.conversation", username=candidate.user.username),
            }), 200

        return redirect(url_for("messaging.conversation", username=candidate.user.username))

    # No immediate partner; wait in queue
    my_req = FriendMatchRequest(
        user_id=current_user.id,
        activity_type=activity,
        time_slot=time_slot,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.session.add(my_req)
    db.session.commit()

    flash(f"Entered queue for {activity.replace('_', ' ').title()} ({time_slot.capitalize()}). We'll pair you as soon as a student joins!", "info")

    if wants_json():
        return jsonify({
            "status": "pending",
            "message": "Entered Friend Roulette queue.",
            "request": my_req.to_dict(),
        }), 201

    return redirect(url_for("utility.roulette_matcher"))


@utility_bp.route("/roulette/cancel", methods=["POST"])
@login_required
def cancel_roulette():
    """Leaves the friend roulette queue."""
    FriendMatchRequest.query.filter_by(user_id=current_user.id, status="pending").update({"status": "cancelled"})
    db.session.commit()
    flash("Left the Friend Roulette queue.", "info")
    return redirect(url_for("utility.roulette_matcher"))
