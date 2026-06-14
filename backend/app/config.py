import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env file if it exists
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Family Financial OS API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Default to an in-memory SQLite for easy setup if no DB URL is provided
    # Standard Supabase PostgreSQL URL will be injected in production/development env
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./dev.db"
    )
    
    # Environment (development, testing, production)
    ENV: str = os.getenv("ENV", "development")

    # Security Config
    SUPABASE_JWT_SECRET: str = os.getenv(
        "SUPABASE_JWT_SECRET",
        "super-secret-supabase-jwt-key-for-development"
    )
    
    SUPABASE_URL: str = os.getenv(
        "SUPABASE_URL",
        "https://lhufhdvjmhmbvwfdwyqc.supabase.co"
    )

    SUPABASE_ANON_KEY: str = os.getenv(
        "SUPABASE_ANON_KEY",
        "sb_publishable_W9Qd2OzoZDlkSG69fYBMig_OsFCg7Vh"
    )
    
    BACKEND_CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "BACKEND_CORS_ORIGINS",
            "http://localhost:3000,https://family-financial-os.vercel.app"
        ).split(",")
        if origin.strip()
    ]

settings = Settings()
