# backend/app/services/cloudinary_service.py
import cloudinary
import cloudinary.uploader
from app.config import settings
from typing import Dict
import io
import time

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class CloudinaryService:
    @staticmethod
    async def upload_resume(file_content: bytes, filename: str) -> Dict[str, str]:
        """Upload resume to Cloudinary and return URL"""
        try:
            # Convert bytes to file-like object
            file_stream = io.BytesIO(file_content)
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_stream,
                resource_type="raw",
                folder="resumes",
                public_id=f"{filename.split('.')[0]}_{int(time.time())}",
                allowed_formats=["pdf", "docx"]
            )
            
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"]
            }
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            raise Exception(f"Failed to upload resume: {str(e)}")