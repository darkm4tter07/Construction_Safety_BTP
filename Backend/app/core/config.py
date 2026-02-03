from pydantic_settings import BaseSettings  # pyright: ignore[reportMissingImports] # Updated import for Pydantic v2
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Construction Safety Monitor"
    VERSION: str = "1.0.0"
    YOLO_MODEL_PATH: str = "yolo_models/yolo11n.pt" 
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]

    # Database
    DATABASE_URL: str
    
    # JWT Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 172800  # 120 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # Encryption
    ENCRYPTION_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
