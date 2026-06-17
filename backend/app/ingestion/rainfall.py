"""
HillRoadRisk — Open-Meteo Rainfall Ingestion.

Fetches hourly rainfall data from Open-Meteo API (free, no key needed)
for grid points across Uttarakhand.
"""

import structlog
from datetime import datetime, timedelta
from typing import Optional

import httpx
import numpy as np
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import RainfallObservation, IngestionLog
from app.config import settings

logger = structlog.get_logger()

# Grid spacing for rainfall sampling (in degrees)
# ~0.25° ≈ 25km grid — reasonable for Open-Meteo resolution
GRID_SPACING = 0.25


def generate_grid_points(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    spacing: float = GRID_SPACING,
) -> list[tuple[float, float]]:
    """Generate a regular grid of (lat, lon) points over the bounding box."""
    lats = np.arange(min_lat, max_lat + spacing, spacing)
    lons = np.arange(min_lon, max_lon + spacing, spacing)
    points = [(round(lat, 4), round(lon, 4)) for lat in lats for lon in lons]
    return points


async def fetch_rainfall_from_open_meteo(
    latitude: float,
    longitude: float,
    hours_back: int = 72,
) -> Optional[dict]:
    """
    Fetch hourly rainfall data from Open-Meteo API.

    Args:
        latitude: Grid point latitude
        longitude: Grid point longitude
        hours_back: How many hours of past data to fetch

    Returns:
        Dict with hourly rainfall data, or None on failure
    """
    url = f"{settings.open_meteo_base_url}/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "precipitation,temperature_2m",
        "past_hours": hours_back,
        "forecast_hours": 24,
        "timezone": "Asia/Kolkata",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.warning(
            "Open-Meteo API call failed",
            lat=latitude,
            lon=longitude,
            error=str(e),
        )
        return None


def compute_rolling_aggregates(
    hourly_precip: list[float],
    current_index: int,
) -> dict:
    """
    Compute rolling rainfall aggregates from hourly data.

    Returns:
        Dict with 6h, 24h, 48h, 72h totals
    """
    def safe_sum(data, start, end):
        sliced = data[max(0, start):end]
        return round(sum(x for x in sliced if x is not None), 2)

    return {
        "rain_6h_mm": safe_sum(hourly_precip, current_index - 6, current_index),
        "rain_24h_mm": safe_sum(hourly_precip, current_index - 24, current_index),
        "rain_48h_mm": safe_sum(hourly_precip, current_index - 48, current_index),
        "rain_72h_mm": safe_sum(hourly_precip, current_index - 72, current_index),
    }


async def ingest_rainfall(hours_back: int = 72) -> dict:
    """
    Ingest hourly rainfall data for all grid points across Uttarakhand.

    Fetches from Open-Meteo (primary) with Open-Meteo as a zero-cost,
    reliable data source.

    Returns:
        dict with ingestion statistics
    """
    started_at = datetime.utcnow()
    db: Session = SessionLocal()

    log = IngestionLog(
        source="open_meteo_rainfall",
        status="running",
        started_at=started_at,
    )
    db.add(log)
    db.commit()

    try:
        # Generate grid points over Uttarakhand
        grid_points = generate_grid_points(
            settings.region_min_lat,
            settings.region_max_lat,
            settings.region_min_lon,
            settings.region_max_lon,
        )
        logger.info(f"Fetching rainfall for {len(grid_points)} grid points")

        records_processed = 0
        records_failed = 0

        for lat, lon in grid_points:
            data = await fetch_rainfall_from_open_meteo(lat, lon, hours_back)
            if data is None:
                records_failed += 1
                continue

            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            precip = hourly.get("precipitation", [])
            temps = hourly.get("temperature_2m", [])

            # Store the most recent observation with rolling aggregates
            if times and precip:
                # Find the last non-future observation
                now = datetime.utcnow()
                for i in range(len(times) - 1, -1, -1):
                    obs_time = datetime.fromisoformat(times[i])
                    if obs_time <= now:
                        aggregates = compute_rolling_aggregates(precip, i + 1)

                        observation = RainfallObservation(
                            latitude=lat,
                            longitude=lon,
                            observed_at=obs_time,
                            source="open_meteo",
                            precipitation_mm=precip[i] if precip[i] is not None else 0.0,
                            temperature_c=temps[i] if i < len(temps) and temps[i] is not None else None,
                            rain_6h_mm=aggregates["rain_6h_mm"],
                            rain_24h_mm=aggregates["rain_24h_mm"],
                            rain_48h_mm=aggregates["rain_48h_mm"],
                            rain_72h_mm=aggregates["rain_72h_mm"],
                            geom=f"SRID=4326;POINT({lon} {lat})",
                        )
                        db.add(observation)
                        records_processed += 1
                        break

            # Batch commit every 50 grid points
            if records_processed % 50 == 0 and records_processed > 0:
                db.commit()

        db.commit()

        completed_at = datetime.utcnow()
        log.status = "success"
        log.records_processed = records_processed
        log.records_failed = records_failed
        log.completed_at = completed_at
        log.duration_seconds = (completed_at - started_at).total_seconds()
        db.commit()

        logger.info(
            "Rainfall ingestion complete",
            records_processed=records_processed,
            records_failed=records_failed,
            grid_points=len(grid_points),
        )

        return {
            "status": "success",
            "records_processed": records_processed,
            "records_failed": records_failed,
            "grid_points": len(grid_points),
        }

    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.utcnow()
        db.commit()
        logger.error("Rainfall ingestion failed", error=str(e))
        raise
    finally:
        db.close()
