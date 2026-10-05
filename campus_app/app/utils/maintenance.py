import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

from sqlalchemy import text
from flask import current_app

from app import db
from app.models.post import Post
from app.models.vlog import Vlog
from app.models.user import User
from app.models.facility import FacilityStatus


def checkpoint_sqlite_wal() -> Dict[str, Any]:
    """
    Executes an explicit SQLite WAL (Write-Ahead Logging) Checkpoint.
    Truncates the WAL log file and forces dirty pages back into the main database file
    without locking read transactions.
    """
    try:
        engine = db.engine
        with engine.connect() as connection:
            result = connection.execute(text("PRAGMA wal_checkpoint(FULL);")).fetchone()
            return {
                "status": "success",
                "checkpoint_mode": "FULL",
                "busy": result[0] if result else 0,
                "log": result[1] if result else 0,
                "checkpointed": result[2] if result else 0,
            }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


def cleanup_expired_facility_reports(max_age_hours: int = 24) -> int:
    """
    Resets or cleans facility tracker reports that have not received student updates
    within the last 24 hours, restoring them to neutral 'moderate' status.
    Returns count of updated facility rows.
    """
    cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
    try:
        stale_facilities = FacilityStatus.query.filter(FacilityStatus.updated_at < cutoff).all()
        count = len(stale_facilities)
        for facility in stale_facilities:
            facility.status = "moderate"
            facility.updated_at = datetime.utcnow()
        db.session.commit()
        return count
    except Exception:
        db.session.rollback()
        return 0


def cleanup_orphaned_media_files(min_age_minutes: int = 60) -> Dict[str, Any]:
    """
    Detects and deletes orphaned video clips, thumbnails, or image uploads in static/uploads
    that do not correspond to any active database record in Vlog, Post, or User.
    Safeguards against deleting freshly uploaded files in progress by checking min_age_minutes.
    """
    upload_base = current_app.config.get("UPLOAD_FOLDER")
    if not upload_base or not os.path.exists(upload_base):
        return {"deleted_files": 0, "freed_bytes": 0}

    # Collect known DB media filenames
    referenced_files = set()

    for vlog in Vlog.query.with_entities(Vlog.video_url, Vlog.thumbnail_url).all():
        if vlog[0]:
            referenced_files.add(os.path.basename(vlog[0]))
        if vlog[1]:
            referenced_files.add(os.path.basename(vlog[1]))

    for post in Post.query.with_entities(Post.media_url).all():
        if post[0]:
            referenced_files.add(os.path.basename(post[0]))

    for user in User.query.with_entities(User.avatar_url).all():
        if user[0]:
            referenced_files.add(os.path.basename(user[0]))

    # Standard default assets protected from purge
    protected_basenames = {
        "default_avatar.png",
        ".gitkeep",
        ".DS_Store",
    }
    referenced_files |= protected_basenames

    now = time.time()
    min_age_seconds = min_age_minutes * 60
    deleted_count = 0
    freed_bytes = 0

    subdirs = ["vlogs", "memes", "avatars", "fit_checks"]
    for sub in subdirs:
        folder_path = os.path.join(upload_base, sub)
        if not os.path.exists(folder_path):
            continue

        for root, _, files in os.walk(folder_path):
            for file_name in files:
                if file_name in referenced_files or file_name.startswith("."):
                    continue

                full_path = os.path.join(root, file_name)
                try:
                    file_stat = os.stat(full_path)
                    if now - file_stat.st_mtime > min_age_seconds:
                        file_size = file_stat.st_size
                        os.remove(full_path)
                        deleted_count += 1
                        freed_bytes += file_size
                except OSError:
                    continue

    return {
        "deleted_files": deleted_count,
        "freed_bytes": freed_bytes,
        "freed_mb": round(freed_bytes / (1024 * 1024), 2),
    }


def run_automated_maintenance() -> Dict[str, Any]:
    """
    Master maintenance routine combining WAL checkpointing,
    facility report expiration, and orphaned file cleanup.
    """
    wal_result = checkpoint_sqlite_wal()
    stale_facilities = cleanup_expired_facility_reports(max_age_hours=24)
    media_cleanup = cleanup_orphaned_media_files(min_age_minutes=60)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sqlite_wal_checkpoint": wal_result,
        "stale_facilities_reset": stale_facilities,
        "orphaned_media_cleanup": media_cleanup,
    }
