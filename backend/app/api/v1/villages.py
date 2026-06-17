"""
HillRoadRisk — Villages API endpoints.

Provides village-level landslide risk data for Uttarakhand.
"""

from typing import Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_AsGeoJSON, ST_MakeEnvelope, ST_Intersects

from app.database import get_db
from app.models import Village
from app.schemas import (
    VillageRiskResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
)

router = APIRouter(prefix="/villages", tags=["Villages"])


@router.get("/{village_id}/risk", response_model=VillageRiskResponse)
def get_village_risk(village_id: int, db: Session = Depends(get_db)):
    """Get current risk assessment for a specific village."""
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return village


@router.get("", response_model=GeoJSONFeatureCollection)
def query_villages(
    bbox: Optional[str] = Query(
        None,
        description="Bounding box: min_lon,min_lat,max_lon,max_lat",
        examples=["79.0,30.0,80.0,31.0"],
    ),
    risk_level: Optional[str] = Query(None),
    susceptibility_level: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(default=500, le=2000, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Query villages by bounding box, risk level, or district.

    Returns GeoJSON FeatureCollection.
    """
    query = db.query(
        Village,
        func.ST_AsGeoJSON(Village.geom).label("geojson"),
    )

    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(x) for x in bbox.split(",")]
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=400,
                detail="Invalid bbox format. Use: min_lon,min_lat,max_lon,max_lat",
            )
        envelope = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        query = query.filter(ST_Intersects(Village.geom, envelope))

    if risk_level:
        query = query.filter(Village.risk_level == risk_level)

    if susceptibility_level:
        query = query.filter(Village.susceptibility_level == susceptibility_level)

    if district:
        query = query.filter(Village.district.ilike(f"%{district}%"))

    results = query.offset(offset).limit(limit).all()

    features = []
    for village, geojson_str in results:
        geom = json.loads(geojson_str)
        feature = GeoJSONFeature(
            id=village.id,
            geometry=GeoJSONGeometry(
                type=geom["type"],
                coordinates=geom["coordinates"],
            ),
            properties={
                "id": village.id,
                "name": village.name,
                "district": village.district,
                "population": village.population,
                "susceptibility_score": village.susceptibility_score,
                "susceptibility_level": village.susceptibility_level,
                "risk_score": village.risk_score,
                "risk_level": village.risk_level,
                "risk_updated_at": (
                    village.risk_updated_at.isoformat()
                    if village.risk_updated_at
                    else None
                ),
            },
        )
        features.append(feature)

    return GeoJSONFeatureCollection(
        features=features,
        metadata={
            "total_returned": len(features),
            "limit": limit,
            "offset": offset,
            "disclaimer": "For informational purposes only; not a guarantee of safety.",
        },
    )
