from datetime import datetime, timedelta
from flask import (
    Blueprint,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required

from app import db
from app.models.facility import FacilityStatus
from app.models.user import User

utility_bp = Blueprint("utility", __name__)

DEFAULT_FACILITIES = [
    ("Main Recreation & Gym Center", "moderate"),
    ("Library 2nd Floor (Silent Study)", "empty"),
    ("Central Dining & Cafeteria", "packed"),
    ("Student Union Lounge", "moderate"),
    ("Engineering Computer Lab (Turing Hall)", "empty"),
]


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


def ensure_seeded_data():
    """Seeds default campus facilities if tables are unpopulated."""
    if FacilityStatus.query.count() == 0:
        for name, initial_status in DEFAULT_FACILITIES:
            fac = FacilityStatus(
                facility_name=name,
                status=initial_status,
                updated_at=datetime.utcnow() - timedelta(minutes=15),
            )
            db.session.add(fac)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()


# =============================================================================
# FACILITY TRACKER (CAMPUS UTILITY)
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
        is_fresh = bool(f.updated_at and f.updated_at >= cutoff_time)
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
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        err_msg = "Failed to update facility status. Please try again."
        if wants_json():
            return jsonify({"status": "error", "message": err_msg}), 500
        flash(err_msg, "error")
        return redirect(url_for("utility.get_facilities"))

    success_msg = f"Reported @{facility.facility_name} as {facility.status_label}."
    flash(success_msg, "success")

    if wants_json():
        return jsonify({"status": "success", "message": success_msg, "facility": facility.to_dict()}), 200

    return redirect(url_for("utility.get_facilities"))
