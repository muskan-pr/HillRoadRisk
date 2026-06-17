"""
HillRoadRisk — Historical landslide events API endpoints.
"""

from typing import Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_AsGeoJSON, ST_MakeEnvelope, ST_Intersects

from app.database import get_db
from app.models import LandslideEvent
from app.schemas import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
)

router = APIRouter(prefix="/landslides", tags=["Historical Landslides"])


@router.get("", response_model=GeoJSONFeatureCollection)
def query_landslides(
    bbox: Optional[str] = Query(
        None,
        description="Bounding box: min_lon,min_lat,max_lon,max_lat",
    ),
    district: Optional[str] = Query(None),
    year_from: Optional[int] = Query(None, description="Filter events from this year"),
    year_to: Optional[int] = Query(None, description="Filter events up to this year"),
    trigger_type: Optional[str] = Query(None, description="e.g., rainfall, earthquake"),
    limit: int = Query(default=500, le=5000, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Query historical landslide events.

    Returns GeoJSON FeatureCollection for heatmap rendering.
    """
    query = db.query(
        LandslideEvent,
        func.ST_AsGeoJSON(LandslideEvent.geom).label("geojson"),
    ).filter(LandslideEvent.geom.isnot(None))

    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(x) for x in bbox.split(",")]
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=400,
                detail="Invalid bbox format. Use: min_lon,min_lat,max_lon,max_lat",
            )
        envelope = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        query = query.filter(ST_Intersects(LandslideEvent.geom, envelope))

    if district:
        query = query.filter(LandslideEvent.district.ilike(f"%{district}%"))

    if year_from:
        query = query.filter(LandslideEvent.event_year >= year_from)

    if year_to:
        query = query.filter(LandslideEvent.event_year <= year_to)

    if trigger_type:
        query = query.filter(LandslideEvent.trigger_type.ilike(f"%{trigger_type}%"))

    results = query.order_by(LandslideEvent.event_date.desc()).offset(offset).limit(limit).all()

    features = []
    for event, geojson_str in results:
        geom = json.loads(geojson_str)
        feature = GeoJSONFeature(
            id=event.id,
            geometry=GeoJSONGeometry(
                type=geom["type"],
                coordinates=geom["coordinates"],
            ),
            properties={
                "id": event.id,
                "source": event.source,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "event_year": event.event_year,
                "location_name": event.location_name,
                "district": event.district,
                "description": event.description,
                "fatalities": event.fatalities,
                "trigger_type": event.trigger_type,
                "landslide_type": event.landslide_type,
            },
        )
        features.append(feature)

    return GeoJSONFeatureCollection(
        features=features,
        metadata={
            "total_returned": len(features),
            "limit": limit,
            "offset": offset,
        },
    )
