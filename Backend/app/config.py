# backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Groq API
    GROQ_API_KEY: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str
    
    # Redis
    # REDIS_URL: str = "redis://localhost:6379"
    
    # App Settings
    SECRET_KEY: str = "SHYAM234"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["https://ai-powered-interview-assistant-cris-seven.vercel.app/"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False  # Makes it case-insensitive
        extra = "ignore"  # Ignores extra fields like 'secret_key'

settings = Settings()