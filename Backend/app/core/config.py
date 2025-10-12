from pydantic_settings import BaseSettings  # pyright: ignore[reportMissingImports] # Updated import for Pydantic v2

class Settings(BaseSettings):
    APP_NAME: str = "Construction Safety Monitor"
    VERSION: str = "1.0.0"
    YOLO_MODEL_PATH: str = "models/yolo11n.pt" 
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]

settings = Settings()