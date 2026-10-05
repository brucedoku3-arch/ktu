from flask import Blueprint, redirect, render_template, request, url_for
from flask_login import current_user

main_bp = Blueprint("main", __name__)


@main_bp.route("/", methods=["GET"])
def index():
    """
    Default root site URL route (GET /):
    Whenever anyone opens the site URL, the landing page (register.html)
    is the very first page they see.
    - If the user is already logged in:
        * If onboarded: redirect to the main campus feed (/feed).
        * If pending onboarding: redirect to (/auth/onboarding).
    - If the user is not logged in:
        * Show them the landing page (register.html).
    """
    if current_user.is_authenticated:
        if not getattr(current_user, "is_onboarded", True):
            return redirect(url_for("auth.onboarding"))
        return redirect(url_for("feed.index"))

    return render_template("auth/register.html")
