import os
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
from sqlalchemy import or_, and_, desc

from app import db
from app.models.message import Message
from app.models.moderation import Block
from app.models.user import User

messaging_bp = Blueprint("messaging", __name__)


def wants_json() -> bool:
    """Detects whether client requested a JSON response."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


# -----------------------------------------------------------------------------
# Inbox View (GET /messages/)
# -----------------------------------------------------------------------------
@messaging_bp.route("/", methods=["GET"])
@login_required
def inbox():
    """
    Renders student inbox listing all active 1-to-1 conversations.
    Groups messages by conversation partner, displaying the latest message,
    unread message count per peer, and filters out blocked accounts.
    """
    # Find all users who are currently blocked or blocking the current student
    blocked_ids = db.session.query(Block.blocked_id).filter_by(blocker_id=current_user.id).subquery()
    blocking_ids = db.session.query(Block.blocker_id).filter_by(blocked_id=current_user.id).subquery()

    # Query all messages involving current user where partner is not blocked
    all_messages = (
        Message.query.filter(
            or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
        )
        .filter(~Message.sender_id.in_(blocked_ids))
        .filter(~Message.sender_id.in_(blocking_ids))
        .filter(~Message.recipient_id.in_(blocked_ids))
        .filter(~Message.recipient_id.in_(blocking_ids))
        .order_by(desc(Message.created_at))
        .all()
    )

    # Group into conversations keyed by partner ID
    conversations = {}
    total_unread = 0

    for msg in all_messages:
        partner_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if partner_id not in conversations:
            partner = User.query.get(partner_id)
            if not partner or partner.is_banned:
                continue
            conversations[partner_id] = {
                "partner": partner,
                "latest_message": msg,
                "unread_count": 0,
            }

        # Track unread incoming messages
        if msg.recipient_id == current_user.id and not msg.is_read:
            conversations[partner_id]["unread_count"] += 1
            total_unread += 1

    conversation_list = list(conversations.values())

    if wants_json():
        return jsonify({
            "status": "success",
            "total_unread": total_unread,
            "conversations": [
                {
                    "partner": {
                        "id": c["partner"].id,
                        "username": c["partner"].username,
                        "student_id": c["partner"].student_id,
                        "avatar_url": c["partner"].avatar_url,
                    },
                    "latest_message": {
                        "id": c["latest_message"].id,
                        "content": c["latest_message"].content,
                        "is_read": c["latest_message"].is_read,
                        "created_at": c["latest_message"].created_at.isoformat(),
                        "is_mine": c["latest_message"].sender_id == current_user.id,
                    },
                    "unread_count": c["unread_count"],
                }
                for c in conversation_list
            ],
        }), 200

    return render_template(
        "messaging/inbox.html",
        conversations=conversation_list,
        total_unread=total_unread,
    )


# -----------------------------------------------------------------------------
# Conversation Thread View (GET /messages/<username>)
# -----------------------------------------------------------------------------
@messaging_bp.route("/<username>", methods=["GET"])
@login_required
def conversation(username: str):
    """
    Renders direct 1-to-1 conversation history with a peer student.
    Marks all received unread messages from this peer as read.
    Enforces privacy and moderation blocking rules.
    """
    peer = User.query.filter_by(username=username).first()
    if not peer or peer.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Student not found."}), 404
        flash("Student profile not found.", "error")
        return redirect(url_for("messaging.inbox"))

    if peer.id == current_user.id:
        if wants_json():
            return jsonify({"status": "error", "message": "Cannot message yourself."}), 400
        flash("You cannot initiate a private conversation with yourself.", "warning")
        return redirect(url_for("messaging.inbox"))

    # Block integrity check: verify neither student has blocked the other
    is_blocked_by_me = current_user.is_blocking(peer.id)
    is_blocked_by_peer = peer.is_blocking(current_user.id)

    if is_blocked_by_me or is_blocked_by_peer:
        if wants_json():
            return jsonify({
                "status": "restricted",
                "message": "Conversation unavailable due to block restrictions.",
                "is_blocked_by_me": is_blocked_by_me,
            }), 403
        flash(
            f"You cannot exchange messages with @{peer.username} because interaction is restricted.",
            "error",
        )
        return redirect(url_for("messaging.inbox"))

    # Fetch ordered thread messages
    thread_messages = (
        Message.query.filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == peer.id),
                and_(Message.sender_id == peer.id, Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Automatically mark incoming unread messages as read
    marked_any = False
    for msg in thread_messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
            marked_any = True

    if marked_any:
        db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "peer": {
                "id": peer.id,
                "username": peer.username,
                "student_id": peer.student_id,
                "avatar_url": peer.avatar_url,
            },
            "messages": [
                {
                    "id": m.id,
                    "sender_id": m.sender_id,
                    "recipient_id": m.recipient_id,
                    "content": m.content,
                    "is_read": m.is_read,
                    "created_at": m.created_at.isoformat(),
                    "is_mine": m.sender_id == current_user.id,
                }
                for m in thread_messages
            ],
        }), 200

    return render_template(
        "messaging/conversation.html",
        peer=peer,
        messages=thread_messages,
    )


# -----------------------------------------------------------------------------
# Send Direct Message (POST /messages/send)
# -----------------------------------------------------------------------------
@messaging_bp.route("/send", methods=["POST"])
@login_required
def send_message():
    """
    Sends a new direct 1-to-1 message to a verified campus student.
    Validates content, checks recipient active status and mutual blocks.
    Supports both standard HTML form post and AJAX/JSON API submissions.
    """
    if current_user.is_suspended or current_user.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Account suspended from messaging."}), 403
        flash("Your account is currently restricted from sending messages.", "error")
        return redirect(url_for("messaging.inbox"))

    # Extract recipient and content from either JSON or Form data
    if request.is_json:
        data = request.get_json() or {}
        recipient_username = (data.get("recipient_username") or "").strip()
        recipient_id = data.get("recipient_id")
        content = (data.get("content") or "").strip()
    else:
        recipient_username = (request.form.get("recipient_username") or "").strip()
        recipient_id = request.form.get("recipient_id", type=int)
        content = (request.form.get("content") or "").strip()

    if not content:
        if wants_json():
            return jsonify({"status": "error", "message": "Message content cannot be empty."}), 400
        flash("Message content cannot be blank.", "error")
        return redirect(request.referrer or url_for("messaging.inbox"))

    # Resolve recipient student
    recipient = None
    if recipient_id:
        recipient = User.query.get(recipient_id)
    elif recipient_username:
        recipient = User.query.filter_by(username=recipient_username).first()

    if not recipient or recipient.is_banned or not recipient.is_active:
        if wants_json():
            return jsonify({"status": "error", "message": "Recipient student not found."}), 404
        flash("Recipient student could not be located.", "error")
        return redirect(url_for("messaging.inbox"))

    if recipient.id == current_user.id:
        if wants_json():
            return jsonify({"status": "error", "message": "Cannot message yourself."}), 400
        flash("You cannot send messages to yourself.", "warning")
        return redirect(url_for("messaging.inbox"))

    # Moderation & Privacy Check
    if current_user.is_blocking(recipient.id) or recipient.is_blocking(current_user.id):
        if wants_json():
            return jsonify({"status": "error", "message": "Cannot send message due to block restrictions."}), 403
        flash(f"Unable to send message: communication with @{recipient.username} is blocked.", "error")
        return redirect(url_for("messaging.inbox"))

    # Persist message
    new_message = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        content=content,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.session.add(new_message)
    db.session.commit()

    if wants_json():
        return jsonify({
            "status": "success",
            "message": {
                "id": new_message.id,
                "sender_id": new_message.sender_id,
                "recipient_id": new_message.recipient_id,
                "content": new_message.content,
                "is_read": new_message.is_read,
                "created_at": new_message.created_at.isoformat(),
                "is_mine": True,
            },
        }), 201

    return redirect(url_for("messaging.conversation", username=recipient.username))


# -----------------------------------------------------------------------------
# Polling API Endpoint (GET /messages/api/thread/<username>)
# -----------------------------------------------------------------------------
@messaging_bp.route("/api/thread/<username>", methods=["GET"])
@login_required
def api_poll_thread(username: str):
    """
    AJAX endpoint for real-time polling in an open chat window.
    Accepts '?after=<message_id>' to only return newly arrived messages.
    Automatically marks incoming messages as read.
    """
    peer = User.query.filter_by(username=username).first()
    if not peer or peer.is_banned:
        return jsonify({"status": "error", "message": "Student not found."}), 404

    after_id = request.args.get("after", 0, type=int)

    query = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == peer.id),
            and_(Message.sender_id == peer.id, Message.recipient_id == current_user.id),
        )
    )

    if after_id > 0:
        query = query.filter(Message.id > after_id)

    new_messages = query.order_by(Message.created_at.asc()).all()

    # Mark incoming as read
    marked_any = False
    for msg in new_messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
            marked_any = True

    if marked_any:
        db.session.commit()

    return jsonify({
        "status": "success",
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "recipient_id": m.recipient_id,
                "content": m.content,
                "is_read": m.is_read,
                "created_at": m.created_at.strftime("%I:%M %p"),
                "is_mine": m.sender_id == current_user.id,
            }
            for m in new_messages
        ],
    }), 200


# -----------------------------------------------------------------------------
# Unread Badge Counter API (GET /messages/api/unread_count)
# -----------------------------------------------------------------------------
@messaging_bp.route("/api/unread_count", methods=["GET"])
@login_required
def api_unread_count():
    """
    Returns total unread incoming messages for client navigation badge.
    """
    unread_count = Message.query.filter_by(
        recipient_id=current_user.id,
        is_read=False,
    ).count()

    return jsonify({
        "status": "success",
        "unread_count": unread_count,
    }), 200
