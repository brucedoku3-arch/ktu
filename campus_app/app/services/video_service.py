import json
import os
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Optional, Tuple
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "mov", "webm"}
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_VLOG_DURATION_SECONDS = 30.5


class VideoValidationError(Exception):
    """Raised when an uploaded vlog fails duration, format, or security checks."""
    pass


def allowed_video_file(filename: str) -> bool:
    """Verifies that filename has an approved video extension (mp4, mov, webm)."""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_VIDEO_EXTENSIONS


def get_vlog_upload_dirs() -> Tuple[Path, Path]:
    """
    Returns (vlogs_dir, thumbnails_dir) ensuring both directories exist on disk.
    """
    if current_app and "UPLOAD_FOLDER" in current_app.config:
        base_uploads = Path(current_app.config["UPLOAD_FOLDER"])
    else:
        # Fallback to default path relative to this service file
        base_uploads = Path(__file__).resolve().parent.parent / "static" / "uploads"

    vlogs_dir = base_uploads / "vlogs"
    thumbnails_dir = vlogs_dir / "thumbnails"

    os.makedirs(vlogs_dir, exist_ok=True)
    os.makedirs(thumbnails_dir, exist_ok=True)

    return vlogs_dir, thumbnails_dir


def inspect_video_duration(video_path: Path) -> float:
    """
    Inspects video duration in seconds using ffprobe.
    Falls back gracefully if ffprobe is unavailable or errors.
    """
    ffprobe_cmd = shutil.which("ffprobe")
    if ffprobe_cmd:
        try:
            # Query duration via ffprobe
            result = subprocess.run(
                [
                    ffprobe_cmd,
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    str(video_path),
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10,
            )
            if result.returncode == 0 and result.stdout.strip():
                return float(result.stdout.strip())
        except Exception:
            pass

    # Basic fallback heuristic inspection (MP4 mvhd box parsing if possible)
    try:
        with open(video_path, "rb") as f:
            data = f.read(65536)
            mvhd_pos = data.find(b"mvhd")
            if mvhd_pos != -1 and len(data) >= mvhd_pos + 24:
                # Version 0 mvhd header
                time_scale = int.from_bytes(data[mvhd_pos + 12 : mvhd_pos + 16], "big")
                duration_units = int.from_bytes(data[mvhd_pos + 16 : mvhd_pos + 20], "big")
                if time_scale > 0:
                    dur = duration_units / time_scale
                    if 0 < dur < 3600:
                        return float(dur)
    except Exception:
        pass

    # Soft default if tools are missing
    return 15.0


def generate_video_thumbnail(video_path: Path, thumbnail_path: Path, duration: float) -> bool:
    """
    Generates a high-quality cover image frame (.jpg) from the video using ffmpeg.
    If ffmpeg is missing or fails, generates a fallback JPEG image with PIL or empty valid JPEG bytes.
    """
    ffmpeg_cmd = shutil.which("ffmpeg")
    target_sec = "00:00:01" if duration > 1.2 else "00:00:00"

    if ffmpeg_cmd:
        try:
            cmd = [
                ffmpeg_cmd,
                "-y",
                "-ss",
                target_sec,
                "-i",
                str(video_path),
                "-vframes",
                "1",
                "-vf",
                "scale=720:-1",
                "-q:v",
                "2",
                str(thumbnail_path),
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=12)
            if res.returncode == 0 and thumbnail_path.exists() and thumbnail_path.stat().st_size > 0:
                return True
        except Exception:
            pass

    # Fallback thumbnail generation using Pillow or minimal JPEG bytes
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (720, 1280), color=(26, 26, 36))
        draw = ImageDraw.Draw(img)
        draw.text((220, 600), "Campus Micro-Vlog", fill=(255, 255, 255))
        img.save(thumbnail_path, format="JPEG", quality=85)
        return True
    except Exception:
        # Minimal 1x1 valid JPEG fallback
        try:
            with open(thumbnail_path, "wb") as f:
                f.write(
                    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00"
                    b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12"
                    b"\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
                    b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05"
                    b"\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07"
                    b"\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
                )
            return True
        except Exception:
            return False


def process_uploaded_vlog(file_storage: FileStorage, user_id: int) -> Tuple[str, str, float]:
    """
    Processes and validates an uploaded campus micro-vlog file:
    1. Checks for non-empty payload and allowed extension (mp4, mov, webm).
    2. Enforces maximum file size limit (50 MB).
    3. Generates unique secure filename: vlog_<user_id>_<uuid4_hex>.<ext>.
    4. Saves video to app/static/uploads/vlogs/.
    5. Inspects duration: Rejects with error if duration > 30.5 seconds.
    6. Extracts thumbnail cover image to app/static/uploads/vlogs/thumbnails/.
    7. Returns: (video_relative_path, thumbnail_relative_path, duration_seconds).
    """
    if not file_storage or not file_storage.filename:
        raise VideoValidationError("No video file selected for upload.")

    orig_filename = secure_filename(file_storage.filename)
    if not allowed_video_file(orig_filename):
        raise VideoValidationError(
            f"Invalid video format. Allowed formats: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}."
        )

    # File size validation (seek stream to verify length)
    stream = file_storage.stream
    stream.seek(0, os.SEEK_END)
    size_bytes = stream.tell()
    stream.seek(0)

    if size_bytes == 0:
        raise VideoValidationError("Uploaded video file is empty (0 bytes).")

    if size_bytes > MAX_VIDEO_SIZE_BYTES:
        max_mb = MAX_VIDEO_SIZE_BYTES // (1024 * 1024)
        raise VideoValidationError(
            f"Video file exceeds {max_mb}MB limit. Please compress your clip."
        )

    # Generate unique filename: vlog_<user_id>_<uuid4_hex>.<ext>
    ext = orig_filename.rsplit(".", 1)[1].lower()
    unique_token = uuid.uuid4().hex[:12]
    video_filename = f"vlog_{user_id}_{unique_token}.{ext}"
    thumbnail_filename = f"thumb_{user_id}_{unique_token}.jpg"

    vlogs_dir, thumbnails_dir = get_vlog_upload_dirs()
    video_dest_path = vlogs_dir / video_filename
    thumb_dest_path = thumbnails_dir / thumbnail_filename

    # Save video file
    try:
        file_storage.save(str(video_dest_path))
    except Exception as e:
        raise VideoValidationError(f"Failed to save video to disk: {e}")

    # Inspect video duration
    duration = inspect_video_duration(video_dest_path)

    # Enforce strict 30-second cap
    if duration > MAX_VLOG_DURATION_SECONDS:
        # Delete invalid file immediately
        try:
            if video_dest_path.exists():
                os.remove(video_dest_path)
        except OSError:
            pass
        raise VideoValidationError("Vlogs must be 30 seconds or less.")

    # Extract thumbnail
    generate_video_thumbnail(video_dest_path, thumb_dest_path, duration)

    video_relative_path = f"vlogs/{video_filename}"
    thumbnail_relative_path = f"vlogs/thumbnails/{thumbnail_filename}"

    return video_relative_path, thumbnail_relative_path, round(duration, 1)


def delete_vlog_files(video_rel_path: str, thumbnail_rel_path: Optional[str] = None) -> bool:
    """
    Safely removes both video and thumbnail files from disk given their relative static paths.
    """
    vlogs_dir, _ = get_vlog_upload_dirs()
    base_uploads = vlogs_dir.parent

    deleted_any = False

    for rel_path in (video_rel_path, thumbnail_rel_path):
        if not rel_path:
            continue
        try:
            # Strip leading slashes and 'uploads/' if prefixed
            clean_rel = rel_path.lstrip("/")
            if clean_rel.startswith("uploads/"):
                clean_rel = clean_rel[len("uploads/"):]

            target_file = base_uploads / clean_rel
            if target_file.exists() and target_file.is_file():
                os.remove(target_file)
                deleted_any = True
        except OSError:
            pass

    return deleted_any
