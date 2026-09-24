from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolves to backend/.env regardless of working directory
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str
    frontend_origin: str = "http://localhost:5173"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8")


settings = Settings()
