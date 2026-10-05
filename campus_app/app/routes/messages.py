from datetime import datetime
from flask import (
    Blueprint,
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
from app.models.moderation import Block, Report
from app.models.user import User

messages_bp = Blueprint("messages", __name__)


def wants_json() -> bool:
    """Detects whether client requested a JSON response or AJAX request."""
    return (
        request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
        or "application/json" in request.headers.get("Accept", "")
    )


def are_blocked(user_id_1: int, user_id_2: int) -> bool:
    """Checks mutual block constraints between two campus student accounts."""
    return (
        Block.query.filter(
            or_(
                and_(Block.blocker_id == user_id_1, Block.blocked_id == user_id_2),
                and_(Block.blocker_id == user_id_2, Block.blocked_id == user_id_1),
            )
        ).count()
        > 0
    )


# -----------------------------------------------------------------------------
# 1. Inbox: List all active conversations (GET /messages/)
# -----------------------------------------------------------------------------
@messages_bp.route("/", methods=["GET"])
@login_required
def index():
    """
    Lists all active peer-to-peer conversations for the current student,
    sorted by most recent message timestamp. Shows unread badges, partner avatars,
    latest snippet, and filters out blocked or banned accounts.
    """
    # Subqueries for users blocked by current_user or blocking current_user
    blocked_by_me = db.session.query(Block.blocked_id).filter_by(blocker_id=current_user.id).subquery()
    blocking_me = db.session.query(Block.blocker_id).filter_by(blocked_id=current_user.id).subquery()

    # Query all messages involving current_user with block exclusions
    messages_query = (
        Message.query.filter(
            or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
        )
        .filter(~Message.sender_id.in_(blocked_by_me))
        .filter(~Message.sender_id.in_(blocking_me))
        .filter(~Message.recipient_id.in_(blocked_by_me))
        .filter(~Message.recipient_id.in_(blocking_me))
        .order_by(desc(Message.created_at))
        .all()
    )

    # Group messages into conversation threads keyed by partner ID
    conversations_map = {}
    total_unread = 0

    for msg in messages_query:
        partner_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if partner_id not in conversations_map:
            partner = User.query.get(partner_id)
            if not partner or partner.is_banned:
                continue
            conversations_map[partner_id] = {
                "partner": partner,
                "latest_message": msg,
                "unread_count": 0,
            }

        if msg.recipient_id == current_user.id and not msg.is_read:
            conversations_map[partner_id]["unread_count"] += 1
            total_unread += 1

    conversations_list = list(conversations_map.values())

    # Optional search query filter
    search_q = request.args.get("q", "").strip().lower()
    if search_q:
        conversations_list = [
            c for c in conversations_list
            if search_q in c["partner"].username.lower()
            or search_q in (c["partner"].student_id or "").lower()
            or search_q in (c["partner"].full_name or "").lower()
        ]

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
                        "faculty": getattr(c["partner"], "faculty", "KTU Student"),
                    },
                    "latest_message": {
                        "id": c["latest_message"].id,
                        "body": c["latest_message"].content,
                        "is_read": c["latest_message"].is_read,
                        "created_at": c["latest_message"].created_at.strftime("%I:%M %p"),
                        "created_at_iso": c["latest_message"].created_at.isoformat(),
                        "is_mine": c["latest_message"].sender_id == current_user.id,
                    },
                    "unread_count": c["unread_count"],
                }
                for c in conversations_list
            ],
        }), 200

    return render_template(
        "messages/inbox.html",
        conversations=conversations_list,
        total_unread=total_unread,
        search_query=search_q,
    )


# -----------------------------------------------------------------------------
# 2. Conversation Thread: Direct Peer Chat (GET /messages/<username>)
# -----------------------------------------------------------------------------
@messages_bp.route("/<username>", methods=["GET"])
@login_required
def thread(username: str):
    """
    Renders direct 1-to-1 conversation thread between current_user and target username.
    Enforces privacy blocking: if blocked, rejects thread access with the required warning.
    Marks all received unread messages from this peer as read.
    """
    target = User.query.filter_by(username=username).first()
    if not target or target.is_banned:
        if wants_json():
            return jsonify({"status": "error", "message": "Student profile not found."}), 404
        flash("Student profile not found.", "error")
        return redirect(url_for("messages.index"))

    if target.id == current_user.id:
        if wants_json():
            return jsonify({"status": "error", "message": "You cannot message yourself."}), 400
        flash("You cannot initiate a private conversation with yourself.", "warning")
        return redirect(url_for("messages.index"))

    # Privacy Safety Check: Re-verify that neither user has blocked the other
    if are_blocked(current_user.id, target.id):
        error_msg = "You cannot message this user due to privacy preferences."
        if wants_json():
            return jsonify({"status": "restricted", "message": error_msg}), 403
        flash(error_msg, "error")
        return redirect(url_for("messages.index"))

    # Fetch chronological conversation history
    thread_messages = (
        Message.query.filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == target.id),
                and_(Message.sender_id == target.id, Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Mark all unread messages sent by target as read
    marked_count = 0
    for msg in thread_messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
            marked_count += 1

    if marked_count > 0:
        db.session.commit()

    # Deterministic room name for client SocketIO listener
    min_id = min(current_user.id, target.id)
    max_id = max(current_user.id, target.id)
    chat_room = f"chat_{min_id}_{max_id}"

    if wants_json():
        return jsonify({
            "status": "success",
            "target": {
                "id": target.id,
                "username": target.username,
                "student_id": target.student_id,
                "avatar_url": target.avatar_url,
                "faculty": getattr(target, "faculty", "KTU Student"),
            },
            "chat_room": chat_room,
            "messages": [m.to_dict() for m in thread_messages],
        }), 200

    return render_template(
        "messages/thread.html",
        target=target,
        partner=target,  # Template alias
        messages=thread_messages,
        chat_room=chat_room,
    )


# -----------------------------------------------------------------------------
# 2b. REST / Long-Polling Fallback Endpoint (GET /messages/<username>/updates)
# -----------------------------------------------------------------------------
@messages_bp.route("/<username>/updates", methods=["GET"])
@login_required
def get_updates(username: str):
    """
    REST / Long-Polling Fallback Endpoint:
    Query parameter 'since' (ISO timestamp or message ID).
    Returns unread/new messages created after 'since' timestamp in JSON format
    for environments where WebSockets are unavailable or disconnected.
    """
    target = User.query.filter_by(username=username).first()
    if not target or target.is_banned:
        return jsonify({"status": "error", "message": "Student profile not found."}), 404

    if are_blocked(current_user.id, target.id):
        return jsonify({
            "status": "restricted",
            "message": "You cannot message this user due to privacy preferences.",
        }), 403

    since_param = request.args.get("since", "").strip()

    base_query = Message.query.filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == target.id),
            and_(Message.sender_id == target.id, Message.recipient_id == current_user.id),
        )
    )

    if since_param:
        try:
            # Check if integer message ID
            since_id = int(since_param)
            base_query = base_query.filter(Message.id > since_id)
        except ValueError:
            # Parse ISO timestamp
            try:
                since_dt = datetime.fromisoformat(since_param.replace("Z", "+00:00"))
                base_query = base_query.filter(Message.created_at > since_dt)
            except Exception:
                pass

    new_messages = base_query.order_by(Message.created_at.asc()).all()

    # Automatically mark incoming new messages as read
    marked_count = 0
    for msg in new_messages:
        if msg.recipient_id == current_user.id and not msg.is_read:
            msg.is_read = True
            marked_count += 1
    if marked_count > 0:
        db.session.commit()

    return jsonify({
        "status": "success",
        "messages": [m.to_dict() for m in new_messages],
    }), 200


# -----------------------------------------------------------------------------
# 3. HTTP / REST Fallback Message Sender (POST /messages/<username>/send)
# -----------------------------------------------------------------------------
@messages_bp.route("/<username>/send", methods=["POST"])
@login_required
def send_direct_message(username: str):
    """
    HTTP / REST Fallback to send direct message to peer.
    Accepts form or JSON payload 'body'. Enforces block validation and persists record.
    Returns JSON response: {"status": "success", "message": message.to_dict()}
    """
    if current_user.is_suspended or current_user.is_banned:
        return jsonify({"status": "error", "message": "Account suspended from messaging."}), 403

    target = User.query.filter_by(username=username).first()
    if not target or target.is_banned:
        return jsonify({"status": "error", "message": "Recipient student profile not found."}), 404

    if target.id == current_user.id:
        return jsonify({"status": "error", "message": "Cannot message yourself."}), 400

    # Privacy safety verification
    if are_blocked(current_user.id, target.id):
        return jsonify({
            "status": "restricted",
            "message": "You cannot message this user due to privacy preferences.",
        }), 403

    # Extract body from JSON or Form data
    if request.is_json:
        data = request.get_json() or {}
        body = (data.get("body") or data.get("content") or "").strip()
    else:
        body = (request.form.get("body") or request.form.get("content") or "").strip()

    if not body:
        return jsonify({"status": "error", "message": "Message body cannot be empty."}), 400

    # Create and persist Message record
    message = Message(
        sender_id=current_user.id,
        recipient_id=target.id,
        content=body,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.session.add(message)
    db.session.commit()

    # Real-time SocketIO broadcast if socketio is initialized
    try:
        from app.sockets import socketio, get_chat_room_name
        room = get_chat_room_name(current_user.id, target.id)
        socketio.emit(
            "new_direct_message",
            {
                "id": message.id,
                "sender_id": message.sender_id,
                "recipient_id": message.recipient_id,
                "body": message.content,
                "content": message.content,
                "sender_username": current_user.username,
                "created_at": message.created_at.strftime("%I:%M %p"),
                "created_at_iso": message.created_at.isoformat(),
                "is_read": False,
            },
            to=room,
        )
    except Exception:
        pass  # Graceful fallback if SocketIO is offline or running worker thread

    if wants_json():
        return jsonify({
            "status": "success",
            "message": message.to_dict(),
        }), 201

    # Standard form redirect fallback
    return redirect(url_for("messages.thread", username=target.username))


# -----------------------------------------------------------------------------
# 4. Blocking & Safety Endpoint (POST /messages/<username>/block)
# -----------------------------------------------------------------------------
@messages_bp.route("/<username>/block", methods=["POST"])
@login_required
def block_user(username: str):
    """
    Enforces privacy blocking against a peer student.
    Prevents any further direct message exchanges or notifications.
    """
    target = User.query.filter_by(username=username).first()
    if not target or target.id == current_user.id:
        flash("Invalid user action.", "error")
        return redirect(url_for("messages.index"))

    existing_block = Block.query.filter_by(
        blocker_id=current_user.id, blocked_id=target.id
    ).first()

    if not existing_block:
        new_block = Block(blocker_id=current_user.id, blocked_id=target.id)
        db.session.add(new_block)
        db.session.commit()
        flash(f"You have blocked @{target.username}. Direct messages are now restricted.", "info")
    else:
        # Unblock toggle
        db.session.delete(existing_block)
        db.session.commit()
        flash(f"You have unblocked @{target.username}.", "success")

    if wants_json():
        return jsonify({"status": "success", "blocked": existing_block is None}), 200

    return redirect(url_for("messages.index"))
