"""
HillRoadRisk — Pydantic schemas for API request/response serialization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ============================================
# GeoJSON Helpers
# ============================================

class GeoJSONGeometry(BaseModel):
    """GeoJSON geometry object."""
    type: str
    coordinates: list


class GeoJSONProperties(BaseModel):
    """Base properties for GeoJSON features."""
    pass


class GeoJSONFeature(BaseModel):
    """Single GeoJSON feature."""
    type: str = "Feature"
    id: Optional[int] = None
    geometry: GeoJSONGeometry
    properties: dict


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection response."""
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]
    metadata: Optional[dict] = None


# ============================================
# Road Segment Schemas
# ============================================

class SegmentRiskResponse(BaseModel):
    """Risk response for a single road segment."""
    id: int
    name: Optional[str] = None
    highway_class: Optional[str] = None
    road_ref: Optional[str] = None
    district: Optional[str] = None
    length_m: Optional[float] = None

    # Terrain
    elevation_mean: Optional[float] = None
    slope_mean: Optional[float] = None
    slope_max: Optional[float] = None

    # Risk
    susceptibility_score: Optional[float] = None
    susceptibility_level: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_updated_at: Optional[datetime] = None

    # Disclaimer
    disclaimer: str = "For informational purposes only; not a guarantee of safety."

    model_config = {"from_attributes": True}


class SegmentQueryParams(BaseModel):
    """Query parameters for segment search."""
    bbox: Optional[str] = Field(
        None,
        description="Bounding box: min_lon,min_lat,max_lon,max_lat",
        examples=["79.0,30.0,80.0,31.0"],
    )
    risk_level: Optional[str] = Field(
        None,
        description="Filter by risk level: Safe, Watch, Warning, Danger",
    )
    susceptibility_level: Optional[str] = Field(
        None,
        description="Filter by susceptibility: Low, Medium, High, Very High",
    )
    district: Optional[str] = None
    highway_class: Optional[str] = None
    limit: int = Field(default=500, le=2000, ge=1)
    offset: int = Field(default=0, ge=0)


# ============================================
# Village Schemas
# ============================================

class VillageRiskResponse(BaseModel):
    """Risk response for a single village."""
    id: int
    name: str
    district: Optional[str] = None
    population: Optional[int] = None

    # Risk
    susceptibility_score: Optional[float] = None
    susceptibility_level: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_updated_at: Optional[datetime] = None

    disclaimer: str = "For informational purposes only; not a guarantee of safety."

    model_config = {"from_attributes": True}


# ============================================
# Landslide Event Schemas
# ============================================

class LandslideEventResponse(BaseModel):
    """Historical landslide event."""
    id: int
    source: Optional[str] = None
    event_date: Optional[str] = None
    location_name: Optional[str] = None
    district: Optional[str] = None
    description: Optional[str] = None
    fatalities: Optional[int] = None
    trigger_type: Optional[str] = None
    landslide_type: Optional[str] = None

    model_config = {"from_attributes": True}


# ============================================
# Health / Status Schemas
# ============================================

class HealthResponse(BaseModel):
    """API health check response."""
    status: str = "healthy"
    version: str
    database: str = "connected"
    region: str = "Uttarakhand"
    segments_count: Optional[int] = None
    villages_count: Optional[int] = None
    last_risk_update: Optional[datetime] = None


class IngestionStatusResponse(BaseModel):
    """Status of data ingestion pipeline."""
    source: str
    status: str
    records_processed: int
    last_run: Optional[datetime] = None
    duration_seconds: Optional[float] = None
