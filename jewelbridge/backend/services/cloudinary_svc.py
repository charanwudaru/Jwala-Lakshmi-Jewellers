import os

os.environ.pop("CLOUDINARY_URL", None)

import cloudinary
import cloudinary.uploader
from core.config import settings

cloud_name = settings.CLOUDINARY_CLOUD_NAME.strip()
api_key = settings.CLOUDINARY_API_KEY.strip()
api_secret = settings.CLOUDINARY_API_SECRET.strip().split("@", 1)[0]

if not cloud_name or not api_key or not api_secret:
    raise RuntimeError("Cloudinary config is incomplete. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True,
)

def upload_image(file_contents: bytes, folder: str = "jwala-lakshmi-jewellers") -> str:
    """
    Uploads an image to Cloudinary and returns the secure URL.
    """
    result = cloudinary.uploader.upload(
        file_contents,
        folder=folder,
        resource_type="image"
    )
    return result.get("secure_url")
