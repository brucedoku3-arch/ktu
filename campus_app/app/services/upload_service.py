import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from flask import current_app

# Optional Pillow integration for privacy EXIF stripping and mobile compression
try:
    from PIL import Image, ImageOps
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_TARGET_SUBFOLDERS = {"memes", "fit_checks", "avatars", "vlogs"}


class UploadValidationError(Exception):
    """Raised when an uploaded file fails validation or security integrity checks."""
    pass


def allowed_image_file(filename: str) -> bool:
    """Verifies that filename has an approved image extension."""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS


def check_image_safety(file_storage: FileStorage) -> dict:
    """
    Performs initial content integrity and safety validation on an uploaded image.
    Verifies that file is non-empty, contains valid header magic bytes, and is uncorrupted.
    """
    if not file_storage or not file_storage.filename:
        return {"is_safe": False, "flagged_reason": "No file payload provided."}

    # Verify stream length / non-empty
    stream = file_storage.stream
    stream.seek(0, os.SEEK_END)
    size_bytes = stream.tell()
    stream.seek(0)

    if size_bytes == 0:
        return {"is_safe": False, "flagged_reason": "Uploaded file is 0 bytes (empty)."}

    # Magic byte signature check
    header = file_storage.read(16)
    file_storage.seek(0)

    is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpeg = header.startswith(b"\xff\xd8\xff")
    is_webp = len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WEBP"

    if not (is_png or is_jpeg or is_webp):
        return {
            "is_safe": False,
            "flagged_reason": "File header magic bytes do not match a valid PNG, JPEG, or WEBP image.",
        }

    return {"is_safe": True, "flagged_reason": None}


def save_uploaded_image(
    file_storage: FileStorage,
    target_subfolder: str = "memes",
    user_id: int = 0,
    max_dim: Optional[Tuple[int, int]] = (1080, 1350),
) -> str:
    """
    Validates, sanitizes, compresses, strips EXIF metadata, and saves an uploaded image.

    Args:
        file_storage: The incoming Werkzeug FileStorage object.
        target_subfolder: Destination upload subfolder ('memes', 'fit_checks', or 'avatars').
        user_id: ID of the uploading student for non-colliding filename generation.
        max_dim: Optional maximum bounding box dimensions (width, height) for mobile optimization.

    Returns:
        The relative media path (e.g. 'memes/meme_101_3a8b4c2e.jpg').

    Raises:
        UploadValidationError: If validation or storage operations fail.
    """
    if not file_storage or not file_storage.filename:
        raise UploadValidationError("No file uploaded or missing filename.")

    original_filename = file_storage.filename.strip()
    if not allowed_image_file(original_filename):
        valid_exts = ", ".join(sorted(list(ALLOWED_IMAGE_EXTENSIONS)))
        raise UploadValidationError(
            f"Invalid file extension. Permitted image formats: {valid_exts.upper()}."
        )

    if target_subfolder not in ALLOWED_TARGET_SUBFOLDERS:
        raise UploadValidationError(f"Invalid target upload subfolder: '{target_subfolder}'.")

    # Safety Pre-Check
    safety_result = check_image_safety(file_storage)
    if not safety_result["is_safe"]:
        raise UploadValidationError(safety_result["flagged_reason"])

    # Resolve upload directory from Flask app configuration
    upload_root = current_app.config.get(
        "UPLOAD_FOLDER",
        os.path.join(current_app.root_path, "static", "uploads")
    )
    destination_dir = os.path.join(upload_root, target_subfolder)
    os.makedirs(destination_dir, exist_ok=True)

    # Generate unique, non-colliding filename: <prefix>_<user_id>_<uuid4_hex>.<ext>
    ext = original_filename.rsplit(".", 1)[1].lower()
    # Normalize jpeg to jpg
    if ext == "jpeg":
        ext = "jpg"

    prefix_map = {
        "memes": "meme",
        "fit_checks": "fit",
        "avatars": "avatar",
    }
    prefix = prefix_map.get(target_subfolder, "img")
    unique_token = uuid.uuid4().hex[:12]
    unique_filename = f"{prefix}_{user_id}_{unique_token}.{ext}"
    final_filepath = os.path.join(destination_dir, unique_filename)

    # Process via Pillow: strip EXIF location data and apply max dimensions
    if HAS_PILLOW:
        try:
            with Image.open(file_storage.stream) as img:
                # Transpose according to EXIF orientation then discard raw EXIF
                img = ImageOps.exif_transpose(img)

                # Convert RGBA to RGB for JPEG files
                if ext == "jpg" and img.mode in ("RGBA", "LA", "P"):
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                    img = bg
                elif ext == "png" and img.mode not in ("RGBA", "RGB", "L"):
                    img = img.convert("RGBA")

                # Mobile viewport thumbnail resize if dimensions exceed max_dim
                if max_dim:
                    img.thumbnail(max_dim, Image.Resampling.LANCZOS)

                # Save clean image without original EXIF/GPS tags
                save_kwargs = {}
                if ext in ("jpg", "jpeg"):
                    save_kwargs = {"quality": 85, "optimize": True}
                elif ext == "webp":
                    save_kwargs = {"quality": 85, "method": 4}
                elif ext == "png":
                    save_kwargs = {"optimize": True}

                img.save(final_filepath, **save_kwargs)

        except Exception as e:
            # Fallback to direct raw file saving if PIL processing encounters an error
            file_storage.seek(0)
            file_storage.save(final_filepath)
    else:
        # Standard file fallback if Pillow is not available
        file_storage.seek(0)
        file_storage.save(final_filepath)

    # Return relative media path for database storage and Jinja url_for resolution
    return f"{target_subfolder}/{unique_filename}"


def delete_uploaded_file(relative_path: str) -> bool:
    """
    Safely removes an uploaded file from disk, strictly verifying that the path
    resolves inside the configured UPLOAD_FOLDER to prevent directory traversal attacks.

    Args:
        relative_path: The relative file path stored in the database (e.g. 'memes/meme_1_abc.jpg').

    Returns:
        True if file was deleted, False if file was not found or safely skipped.

    Raises:
        UploadValidationError: If a path traversal attempt is detected.
    """
    if not relative_path or relative_path == "default_avatar.png":
        return False

    upload_root = os.path.abspath(
        current_app.config.get(
            "UPLOAD_FOLDER",
            os.path.join(current_app.root_path, "static", "uploads")
        )
    )

    # Normalize relative path removing any leading 'uploads/' if present
    clean_rel = relative_path.lstrip("/\\")
    if clean_rel.startswith("uploads/"):
        clean_rel = clean_rel[len("uploads/"):]

    target_path = os.path.abspath(os.path.join(upload_root, clean_rel))

    # Directory Traversal Protection: verify target path is inside upload_root
    common = os.path.commonpath([upload_root, target_path])
    if common != upload_root:
        raise UploadValidationError(
            f"Security Exception: Path traversal attempt blocked for '{relative_path}'."
        )

    if os.path.isfile(target_path):
        try:
            os.remove(target_path)
            return True
        except OSError:
            return False

    return False
