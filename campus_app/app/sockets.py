from datetime import datetime
from flask import request
from flask_login import current_user
from flask_socketio import SocketIO, emit, join_room, leave_room

from app import db
from app.models.message import Message
from app.models.moderation import Block
from app.models.user import User

# Global SocketIO instance
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def get_chat_room_name(user_id_1: int, user_id_2: int) -> str:
    """
    Deterministic room identifier ensuring bidirectional conversation pairing:
    chat_<min_id>_<max_id>
    """
    min_id = min(int(user_id_1), int(user_id_2))
    max_id = max(int(user_id_1), int(user_id_2))
    return f"chat_{min_id}_{max_id}"


def are_users_blocked(user_id_1: int, user_id_2: int) -> bool:
    """Checks mutual block constraints between two campus student accounts."""
    blocked_count = Block.query.filter(
        db.or_(
            db.and_(Block.blocker_id == user_id_1, Block.blocked_id == user_id_2),
            db.and_(Block.blocker_id == user_id_2, Block.blocked_id == user_id_1),
        )
    ).count()
    return blocked_count > 0


@socketio.on("connect")
def handle_connect():
    """Client handshake handler."""
    if not current_user.is_authenticated:
        return False  # Reject unauthenticated connections


@socketio.on("join_chat")
def handle_join_chat(data):
    """
    Registers the authenticated student into the dedicated peer room:
    chat_<min_id>_<max_id>
    """
    if not current_user.is_authenticated:
        emit("error_event", {"message": "Authentication required."})
        return

    recipient_id = data.get("recipient_id") or data.get("partner_id")
    if not recipient_id:
        # Fallback resolve via partner username
        partner_username = data.get("recipient_username") or data.get("partner_username")
        if partner_username:
            peer = User.query.filter_by(username=partner_username).first()
            if peer:
                recipient_id = peer.id

    if not recipient_id:
        emit("error_event", {"message": "Invalid chat recipient specified."})
        return

    recipient_id = int(recipient_id)

    # Privacy / Block check
    if are_users_blocked(current_user.id, recipient_id):
        emit("chat_restricted", {
            "message": "You cannot message this user due to privacy preferences."
        })
        return

    room = get_chat_room_name(current_user.id, recipient_id)
    join_room(room)

    emit("joined_chat", {
        "status": "connected",
        "room": room,
        "user_id": current_user.id,
        "partner_id": recipient_id,
    })


@socketio.on("leave_chat")
def handle_leave_chat(data):
    """Graceful disconnection from peer room."""
    recipient_id = data.get("recipient_id") or data.get("partner_id")
    if current_user.is_authenticated and recipient_id:
        room = get_chat_room_name(current_user.id, int(recipient_id))
        leave_room(room)


@socketio.on("send_direct_message")
def handle_send_direct_message(data):
    """
    Validates, persists, and broadcasts real-time peer messages.
    Enforces privacy blocks and emits 'new_direct_message' to the peer room.
    """
    if not current_user.is_authenticated:
        emit("error_event", {"message": "Please log in to send messages."})
        return

    recipient_id = data.get("recipient_id")
    body = (data.get("body") or data.get("content") or "").strip()

    if not recipient_id or not body:
        emit("error_event", {"message": "Recipient ID and message body are required."})
        return

    recipient = User.query.get(int(recipient_id))
    if not recipient or recipient.is_banned:
        emit("error_event", {"message": "Recipient student account is unavailable."})
        return

    if recipient.id == current_user.id:
        emit("error_event", {"message": "Self-messaging is disabled."})
        return

    # Enforce mutual privacy blocks
    if are_users_blocked(current_user.id, recipient.id):
        emit("chat_restricted", {
            "message": "You cannot message this user due to privacy preferences."
        })
        return

    # Persist message record to database
    message = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        content=body,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.session.add(message)
    db.session.commit()

    room = get_chat_room_name(current_user.id, recipient.id)

    payload = {
        "id": message.id,
        "sender_id": message.sender_id,
        "recipient_id": message.recipient_id,
        "body": message.content,
        "content": message.content,
        "sender_username": current_user.username,
        "sender_avatar": current_user.avatar_url or "default_avatar.png",
        "created_at": message.created_at.strftime("%I:%M %p"),
        "created_at_iso": message.created_at.isoformat(),
        "is_read": False,
    }

    # Broadcast event to both participants in the room
    emit("new_direct_message", payload, to=room)
