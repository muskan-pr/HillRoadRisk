"""
HillRoadRisk — Configuration settings.

Loads from environment variables (.env file).
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = Field(
        default="postgresql://hillrisk:hillrisk@localhost:5432/hillroadrisk",
        description="PostgreSQL connection string with PostGIS",
    )

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    api_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Weather Data
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"

    # Region: Uttarakhand bounding box
    region_min_lat: float = 29.0
    region_max_lat: float = 31.5
    region_min_lon: float = 77.0
    region_max_lon: float = 81.0

    # Data directories
    data_dir: str = "./data"
    dem_dir: str = "./data/dem"
    models_dir: str = "./data/models"
    processed_dir: str = "./data/processed"

    # MLflow
    mlflow_tracking_uri: str = "sqlite:///mlflow.db"

    # Admin
    admin_username: str = "admin"
    admin_password: str = "changeme"
    secret_key: str = "change-this-to-a-random-secret-key"

    # Alert Engine (Phase 2)
    resend_api_key: Optional[str] = None
    vapid_public_key: Optional[str] = None
    vapid_private_key: Optional[str] = None

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.api_cors_origins.split(",")]

    @property
    def uttarakhand_bbox(self) -> dict:
        """Return the Uttarakhand bounding box as a dict."""
        return {
            "min_lat": self.region_min_lat,
            "max_lat": self.region_max_lat,
            "min_lon": self.region_min_lon,
            "max_lon": self.region_max_lon,
        }

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


# Singleton settings instance
settings = Settings()
