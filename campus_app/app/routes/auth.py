import random
import re
from urllib.parse import urljoin, urlparse

from flask import (
    Blueprint,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required, login_user, logout_user

from app import db
from app.models.user import User

ADMIN_EMAIL = "brucedoku3@gmail.com"

# Official Koforidua Technical University (KTU) 2026 Academic Catalog
KTU_ACADEMIC_CATALOG = {
    "Faculty of Engineering (FOE)": [
        "B.Tech Automotive Engineering",
        "B.Tech Civil Engineering",
        "B.Tech Electrical/Electronic Engineering",
        "B.Tech Mechanical Engineering",
        "B.Tech Mechatronics Engineering",
        "B.Tech Renewable Energy Systems Engineering",
        "Higher National Diploma (HND) in Automotive Engineering",
        "Higher National Diploma (HND) in Civil Engineering",
        "Higher National Diploma (HND) in Electrical/Electronic Engineering",
        "Higher National Diploma (HND) in Mechanical Engineering",
    ],
    "Faculty of Applied Science and Technology (FAST)": [
        "B.Tech Computer Science",
        "B.Tech Information Technology",
        "B.Tech Artificial Intelligence & Robotics",
        "B.Tech Cyber Security & Digital Forensics",
        "B.Tech Data Science & Analytics",
        "B.Tech Food Technology",
        "B.Tech Medical Laboratory Technology",
        "B.Tech Statistics & Actuarial Science",
        "Higher National Diploma (HND) in Computer Science",
        "Higher National Diploma (HND) in Information Technology",
        "Higher National Diploma (HND) in Network & Systems Administration",
        "Higher National Diploma (HND) in Food Technology",
        "Higher National Diploma (HND) in Post-Harvest Technology",
    ],
    "Faculty of Business and Management Studies (FBMS)": [
        "B.Tech Accounting & Finance",
        "B.Tech Procurement & Supply Chain Management",
        "B.Tech Marketing & Digital Media",
        "B.Tech Secretaryship & Management Studies",
        "Higher National Diploma (HND) in Accountancy",
        "Higher National Diploma (HND) in Marketing",
        "Higher National Diploma (HND) in Purchasing & Supply",
        "Higher National Diploma (HND) in Secretarial & Management Studies",
    ],
    "Faculty of Built and Natural Environment (FBNE)": [
        "B.Tech Construction Technology",
        "B.Tech Environmental Technology",
        "B.Tech Quantity Surveying & Cost Engineering",
        "Higher National Diploma (HND) in Building Technology",
        "Higher National Diploma (HND) in Environmental Management",
    ],
    "Faculty of Health and Allied Sciences (FHAS)": [
        "B.Tech Medical Laboratory Science",
        "B.Tech Biomedical Engineering",
        "B.Tech Community & Public Health Nursing",
        "Diploma in Health Informatics & Records",
    ],
}

auth_bp = Blueprint("auth", __name__)


def is_safe_url(target: str) -> bool:
    """
    Validates that a redirect target URL belongs to the same host and scheme
    to protect against open redirect vulnerabilities.
    """
    if not target:
        return False
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc


def wants_json() -> bool:
    """Detects whether client requested JSON response (AJAX/Fetch/API client)."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


# -----------------------------------------------------------------------------
# Catalog API Route (GET)
# -----------------------------------------------------------------------------
@auth_bp.route("/catalog", methods=["GET"])
def get_catalog():
    """Returns the KTU Academic Catalog for interactive dropdown UI population."""
    return jsonify({"status": "success", "catalog": KTU_ACADEMIC_CATALOG}), 200


# -----------------------------------------------------------------------------
# Registration & Landing Endpoint (GET & POST)
# -----------------------------------------------------------------------------
@auth_bp.route("/", methods=["GET"])
@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """
    Handles verified student registration.
    Form fields:
      1. Full Name
      2. Username
      3. Institutional Email (@ktu.edu.gh, with brucedoku3@gmail.com override)
      4. Password & Password Confirmation
    Creates new student account and forwards immediately to the multi-step onboarding flow.
    """
    if current_user.is_authenticated:
        if not getattr(current_user, "is_onboarded", True):
            return redirect(url_for("auth.onboarding"))
        if wants_json():
            return (
                jsonify({"status": "info", "message": "Already authenticated", "redirect": url_for("feed.index")}),
                200,
            )
        return redirect(url_for("feed.index"))

    if request.method == "POST":
        data = request.get_json(silent=True) if request.is_json else request.form

        full_name = (data.get("full_name") or "").strip()
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        confirm_password = data.get("confirm_password") or ""
        student_id_input = (data.get("student_id") or "").strip().upper()

        is_super_admin = (email == ADMIN_EMAIL)

        errors = []

        # 1. Validation: Required fields
        if not full_name:
            errors.append("Full Name is required.")
        elif len(full_name) < 2:
            errors.append("Full Name must be at least 2 characters.")

        if not username:
            errors.append("Username is required.")
        elif not re.match(r"^[a-zA-Z0-9_]{3,30}$", username):
            errors.append("Username must be 3–30 characters and contain only letters, numbers, or underscores.")

        if not email:
            errors.append("Institutional KTU student email is required.")
        elif not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            errors.append("Please enter a valid email address.")
        elif not User.is_valid_student_email(email):
            errors.append("Only official KTU student emails (@ktu.edu.gh) are permitted for registration.")

        if not password:
            errors.append("Password is required.")
        elif len(password) < 8:
            errors.append("Password must be at least 8 characters in length.")

        if password != confirm_password:
            errors.append("Passwords do not match. Please re-enter your password.")

        # 2. Derive or assign unique Student ID
        derived_student_id = student_id_input
        if not derived_student_id:
            if is_super_admin:
                derived_student_id = "ADMIN-001"
            elif email.endswith("@ktu.edu.gh"):
                local_part = email.split("@")[0].upper()
                derived_student_id = f"KTU-{local_part}"
            else:
                derived_student_id = f"KTU-{username.upper()}"

        # 3. Database uniqueness constraints
        if not errors:
            if User.query.filter_by(username=username).first():
                errors.append("This username is already taken. Please choose another.")
            elif User.query.filter_by(email=email).first():
                errors.append("An account with this email address is already registered.")
            elif derived_student_id and User.query.filter_by(student_id=derived_student_id).first():
                derived_student_id = f"{derived_student_id}-{random.randint(100, 999)}"

        # Return errors if validation failed
        if errors:
            if wants_json():
                return jsonify({"status": "error", "errors": errors, "message": errors[0]}), 422

            for err in errors:
                flash(err, "error")
            return render_template(
                "auth/register.html",
                full_name=full_name,
                username=username,
                email=email,
            ), 422

        # 4. Create User with is_onboarded = False
        user = User(
            full_name=full_name,
            student_id=derived_student_id,
            username=username,
            email=email,
            avatar_url="default_avatar.png",
            is_active=True,
            is_verified=True,
            is_suspended=False,
            is_banned=False,
            is_admin=is_super_admin,
            is_onboarded=False,
        )
        user.set_password(password)

        try:
            db.session.add(user)
            db.session.commit()
        except Exception:
            db.session.rollback()
            err_msg = "Database transaction failed during registration. Please try again."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 500
            flash(err_msg, "error")
            return render_template("auth/register.html"), 500

        # 5. Log the newly registered student in and route to onboarding flow
        login_user(user, remember=True)

        if wants_json():
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Registration successful! Please complete your academic profile.",
                        "redirect": url_for("auth.onboarding"),
                        "user": {
                            "id": user.id,
                            "full_name": user.full_name,
                            "student_id": user.student_id,
                            "username": user.username,
                            "email": user.email,
                            "is_onboarded": False,
                        },
                    }
                ),
                201,
            )

        flash("Account created! Please set up your academic profile and preferences.", "success")
        return redirect(url_for("auth.onboarding"))

    return render_template("auth/register.html")


# -----------------------------------------------------------------------------
# Multi-Step Onboarding Flow (GET & POST)
# -----------------------------------------------------------------------------
@auth_bp.route("/onboarding", methods=["GET", "POST"])
@login_required
def onboarding():
    """
    Guided multi-step onboarding flow displayed immediately after student signup:
      - Step 1: Basic Student Info (Gender: Male, Female, Prefer not to say)
      - Step 2: Academic Details (Level 100-400, Faculty/Department, KTU 2026 Program of Study)
      - Step 3: Avatar & Bio (Profile photo upload / default avatar selection, short bio)
    Sets is_onboarded = True and forwards directly to the campus feed.
    """
    # If already onboarded, bypass directly to feed
    if getattr(current_user, "is_onboarded", False):
        if wants_json():
            return jsonify({"status": "info", "message": "Already onboarded", "redirect": url_for("feed.index")}), 200
        return redirect(url_for("feed.index"))

    if request.method == "POST":
        data = request.get_json(silent=True) if request.is_json else request.form

        gender = (data.get("gender") or "").strip()
        level = (data.get("level") or "").strip()
        faculty = (data.get("faculty") or "").strip()
        course = (data.get("course") or "").strip()
        bio = (data.get("bio") or "").strip()
        avatar_choice = (data.get("avatar_url") or data.get("avatar_preset") or "").strip()

        errors = []

        # Validate Step 1: Gender
        valid_genders = ["Male", "Female", "Prefer not to say"]
        if not gender or gender not in valid_genders:
            errors.append("Please select a valid gender option (Male, Female, or Prefer not to say).")

        # Validate Step 2: Academic Details
        normalized_level = level.replace("Level", "").strip()
        if normalized_level not in ["100", "200", "300", "400"]:
            errors.append("Please select your academic year / level (Level 100, 200, 300, or 400).")

        if not faculty or faculty not in KTU_ACADEMIC_CATALOG:
            errors.append("Please select a valid Faculty or Department.")
        elif not course or course not in KTU_ACADEMIC_CATALOG.get(faculty, []):
            errors.append(f"Selected course is not listed under {faculty}.")

        # Handle Step 3: Avatar Upload or Preset
        avatar_filename = None
        if "avatar_file" in request.files:
            file_storage = request.files.get("avatar_file")
            if file_storage and file_storage.filename:
                try:
                    from app.services.upload_service import save_uploaded_image
                    avatar_filename = save_uploaded_image(
                        file_storage=file_storage,
                        target_subfolder="avatars",
                        user_id=current_user.id,
                        max_dim=(500, 500),
                    )
                except Exception as upload_err:
                    errors.append(f"Avatar upload failed: {str(upload_err)}")

        if errors:
            if wants_json():
                return jsonify({"status": "error", "errors": errors, "message": errors[0]}), 422
            for err in errors:
                flash(err, "error")
            return render_template(
                "auth/onboarding.html",
                catalog=KTU_ACADEMIC_CATALOG,
                selected_gender=gender,
                selected_level=normalized_level,
                selected_faculty=faculty,
                selected_course=course,
                bio=bio,
            ), 422

        # Save profile details to User model
        current_user.gender = gender
        current_user.level = normalized_level
        current_user.faculty = faculty
        current_user.course = course
        if bio:
            current_user.bio = bio[:160]

        if avatar_filename:
            current_user.avatar_url = avatar_filename
        elif avatar_choice:
            current_user.avatar_url = avatar_choice

        current_user.is_onboarded = True

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            err_msg = "Could not save your academic profile. Please try again."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 500
            flash(err_msg, "error")
            return render_template("auth/onboarding.html", catalog=KTU_ACADEMIC_CATALOG), 500

        if wants_json():
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Profile onboarding complete! Welcome to KTU CampusSocial.",
                        "redirect": url_for("feed.index"),
                        "user": {
                            "id": current_user.id,
                            "full_name": current_user.full_name,
                            "gender": current_user.gender,
                            "level": current_user.level,
                            "faculty": current_user.faculty,
                            "course": current_user.course,
                            "is_onboarded": True,
                        },
                    }
                ),
                200,
            )

        flash("Welcome to KTU CampusSocial! Your student profile is all set.", "success")
        return redirect(url_for("feed.index"))

    return render_template(
        "auth/onboarding.html",
        catalog=KTU_ACADEMIC_CATALOG,
        user=current_user,
    )


# -----------------------------------------------------------------------------
# Login Endpoint (GET & POST)
# -----------------------------------------------------------------------------
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """
    Authenticates students via Student ID, Username, or Email along with password.
    Enforces moderation quarantine (banned or suspended accounts).
    """
    if current_user.is_authenticated:
        if wants_json():
            return (
                jsonify({"status": "info", "message": "Already authenticated", "redirect": url_for("feed.index")}),
                200,
            )
        return redirect(url_for("feed.index"))

    if request.method == "POST":
        data = request.get_json(silent=True) if request.is_json else request.form

        identifier = (data.get("student_id") or data.get("username") or data.get("identifier") or "").strip()
        password = data.get("password") or ""
        remember = bool(data.get("remember", True))

        if not identifier or not password:
            err_msg = "Please enter your Student ID (or username/email) and password."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 400
            flash(err_msg, "error")
            return render_template("auth/login.html", identifier=identifier), 400

        # Locate student across student_id, username, or email
        user = User.query.filter(
            (User.student_id == identifier.upper())
            | (User.username == identifier)
            | (User.email == identifier.lower())
        ).first()

        # Check credentials
        if not user or not user.check_password(password):
            err_msg = "Invalid Student ID/username or password."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 401
            flash(err_msg, "error")
            return render_template("auth/login.html", identifier=identifier), 401

        # Automatic super-admin elevation for hardcoded admin email
        if user.email and user.email.strip().lower() == ADMIN_EMAIL:
            if not user.is_admin or not user.is_verified:
                user.is_admin = True
                user.is_verified = True
                db.session.commit()

        # Check moderation flags: Banned or Suspended accounts rejected
        if user.is_banned or user.is_suspended:
            err_msg = "Account suspended or banned due to community policy violation."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg, "moderation_status": "banned"}), 403
            flash(err_msg, "error")
            return render_template("auth/login.html", identifier=identifier), 403

        # Check active status
        if not user.is_active:
            err_msg = "Your account is marked inactive. Please contact campus administration."
            if wants_json():
                return jsonify({"status": "error", "message": err_msg}), 403
            flash(err_msg, "error")
            return render_template("auth/login.html", identifier=identifier), 403

        # Log student in via Flask-Login
        login_user(user, remember=remember)

        # Check onboarding status: if not onboarded, redirect to onboarding flow
        if not getattr(user, "is_onboarded", False):
            if wants_json():
                return (
                    jsonify(
                        {
                            "status": "success",
                            "message": f"Welcome back, {user.username}! Please complete your academic profile onboarding.",
                            "redirect": url_for("auth.onboarding"),
                            "user": {
                                "id": user.id,
                                "full_name": user.full_name,
                                "student_id": user.student_id,
                                "username": user.username,
                                "avatar_url": user.avatar_url,
                                "is_admin": user.is_admin,
                                "is_onboarded": False,
                            },
                        }
                    ),
                    200,
                )
            flash(f"Welcome back, {user.username}! Please finish your student onboarding.", "info")
            return redirect(url_for("auth.onboarding"))

        # Onboarded students bypass onboarding directly to feed or next_page
        next_page = request.args.get("next") or data.get("next")
        if not next_page or not is_safe_url(next_page) or "onboarding" in next_page:
            next_page = url_for("feed.index")

        if wants_json():
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": f"Welcome back, {user.username}!",
                        "redirect": next_page,
                        "user": {
                            "id": user.id,
                            "full_name": user.full_name,
                            "student_id": user.student_id,
                            "username": user.username,
                            "avatar_url": user.avatar_url,
                            "is_admin": user.is_admin,
                            "is_onboarded": True,
                        },
                    }
                ),
                200,
            )

        flash(f"Welcome back, {user.username}!", "success")
        return redirect(next_page)

    return render_template("auth/login.html", next=request.args.get("next"))


# -----------------------------------------------------------------------------
# Logout Endpoint (GET & POST)
# -----------------------------------------------------------------------------
@auth_bp.route("/logout", methods=["GET", "POST"])
@login_required
def logout():
    """Logs out the authenticated student session and cleans cookies."""
    logout_user()

    if wants_json():
        return (
            jsonify({"status": "success", "message": "Logged out successfully", "redirect": url_for("auth.login")}),
            200,
        )

    flash("You have been logged out successfully.", "info")
    return redirect(url_for("auth.login"))


# -----------------------------------------------------------------------------
# Session Verification Endpoint (GET)
# -----------------------------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """
    Returns active user profile metadata or 401 Unauthorized if unauthenticated.
    Used by mobile frontends and single-page applications.
    """
    if not current_user.is_authenticated:
        return (
            jsonify({
                "authenticated": False,
                "error": "Unauthorized",
                "message": "No active campus session found.",
            }),
            401,
        )

    return (
        jsonify({
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "full_name": getattr(current_user, "full_name", None),
                "student_id": current_user.student_id,
                "username": current_user.username,
                "email": current_user.email,
                "gender": getattr(current_user, "gender", None),
                "level": getattr(current_user, "level", None),
                "faculty": getattr(current_user, "faculty", None),
                "course": getattr(current_user, "course", None),
                "avatar_url": current_user.avatar_url,
                "bio": current_user.bio,
                "is_onboarded": getattr(current_user, "is_onboarded", False),
                "is_admin": current_user.is_admin,
                "is_active": current_user.is_active,
                "created_at": current_user.created_at.isoformat() if getattr(current_user, "created_at", None) else None,
            },
        }),
        200,
    )
