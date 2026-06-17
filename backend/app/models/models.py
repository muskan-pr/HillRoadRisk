"""
HillRoadRisk — SQLAlchemy models with PostGIS geometry support.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Float,
    Text,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry

from app.database import Base


class RoadSegment(Base):
    """Road segment with terrain features and risk scores."""

    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True)
    osm_id = Column(BigInteger)
    name = Column(String(255))
    highway_class = Column(String(50))
    road_ref = Column(String(50))
    district = Column(String(100))
    state = Column(String(50), default="Uttarakhand")
    length_m = Column(Float)

    # Terrain features
    elevation_mean = Column(Float)
    elevation_max = Column(Float)
    slope_mean = Column(Float)
    slope_max = Column(Float)
    aspect_mean = Column(Float)
    curvature_mean = Column(Float)
    twi_mean = Column(Float)
    dist_to_river_m = Column(Float)
    land_cover = Column(String(50))

    # Risk scores
    susceptibility_score = Column(Float)
    susceptibility_level = Column(String(20))
    risk_score = Column(Float)
    risk_level = Column(String(20))
    risk_updated_at = Column(DateTime(timezone=True))

    # Geometry
    geom = Column(Geometry("LINESTRING", srid=4326), nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class Village(Base):
    """Village/settlement with risk scores."""

    __tablename__ = "villages"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    district = Column(String(100))
    state = Column(String(50), default="Uttarakhand")
    population = Column(Integer)

    # Risk scores
    susceptibility_score = Column(Float)
    susceptibility_level = Column(String(20))
    risk_score = Column(Float)
    risk_level = Column(String(20))
    risk_updated_at = Column(DateTime(timezone=True))

    # Geometry
    geom = Column(Geometry("POINT", srid=4326), nullable=False)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class LandslideEvent(Base):
    """Historical landslide record."""

    __tablename__ = "landslide_events"

    id = Column(Integer, primary_key=True)
    source = Column(String(100))
    event_date = Column(Date)
    event_year = Column(Integer)
    location_name = Column(String(255))
    district = Column(String(100))
    state = Column(String(50), default="Uttarakhand")
    description = Column(Text)
    fatalities = Column(Integer)
    injuries = Column(Integer)
    trigger_type = Column(String(100))
    landslide_type = Column(String(100))

    # Geometry
    geom = Column(Geometry("POINT", srid=4326))
    accuracy_km = Column(Float)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class RainfallObservation(Base):
    """Hourly rainfall observation (Phase 2)."""

    __tablename__ = "rainfall_observations"

    id = Column(Integer, primary_key=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    source = Column(String(50))

    precipitation_mm = Column(Float)
    temperature_c = Column(Float)

    rain_6h_mm = Column(Float)
    rain_24h_mm = Column(Float)
    rain_48h_mm = Column(Float)
    rain_72h_mm = Column(Float)

    geom = Column(Geometry("POINT", srid=4326))

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class IngestionLog(Base):
    """Log entry for data ingestion runs."""

    __tablename__ = "ingestion_logs"

    id = Column(Integer, primary_key=True)
    source = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)
    metadata_ = Column("metadata", JSONB)


class AlertSubscription(Base):
    """User alert subscription (Phase 2)."""

    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    push_subscription = Column(JSONB)
    districts = Column(ARRAY(Text))
    route_ids = Column(ARRAY(Integer))
    min_alert_level = Column(String(20), default="Warning")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Alert(Base):
    """Alert history record (Phase 2)."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    segment_id = Column(Integer, ForeignKey("road_segments.id"))
    village_id = Column(Integer, ForeignKey("villages.id"))
    alert_level = Column(String(20), nullable=False)
    message = Column(Text)
    triggered_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True))
    metadata_ = Column("metadata", JSONB)
