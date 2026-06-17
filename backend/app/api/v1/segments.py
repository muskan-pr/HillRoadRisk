"""
HillRoadRisk — Road Segments API endpoints.

Provides road-segment-level landslide risk data for Uttarakhand.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_AsGeoJSON, ST_MakeEnvelope, ST_Intersects

from app.database import get_db
from app.models import RoadSegment
from app.schemas import (
    SegmentRiskResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
)

import json

router = APIRouter(prefix="/segments", tags=["Road Segments"])


@router.get("/{segment_id}/risk", response_model=SegmentRiskResponse)
def get_segment_risk(segment_id: int, db: Session = Depends(get_db)):
    """
    Get current risk assessment for a specific road segment.

    Returns susceptibility score (Phase 1) and dynamic risk score (Phase 2).
    """
    segment = db.query(RoadSegment).filter(RoadSegment.id == segment_id).first()
    if not segment:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found")
    return segment


@router.get("", response_model=GeoJSONFeatureCollection)
def query_segments(
    bbox: Optional[str] = Query(
        None,
        description="Bounding box: min_lon,min_lat,max_lon,max_lat",
        examples=["79.0,30.0,80.0,31.0"],
    ),
    risk_level: Optional[str] = Query(None, description="Safe, Watch, Warning, Danger"),
    susceptibility_level: Optional[str] = Query(None, description="Low, Medium, High, Very High"),
    district: Optional[str] = Query(None),
    highway_class: Optional[str] = Query(None),
    limit: int = Query(default=500, le=2000, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Query road segments by bounding box, risk level, district, or road type.

    Returns GeoJSON FeatureCollection for direct map rendering.
    """
    query = db.query(
        RoadSegment,
        func.ST_AsGeoJSON(RoadSegment.geom).label("geojson"),
    )

    # Bounding box filter
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(x) for x in bbox.split(",")]
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=400,
                detail="Invalid bbox format. Use: min_lon,min_lat,max_lon,max_lat",
            )
        envelope = ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
        query = query.filter(ST_Intersects(RoadSegment.geom, envelope))

    # Risk level filter
    if risk_level:
        query = query.filter(RoadSegment.risk_level == risk_level)

    # Susceptibility level filter
    if susceptibility_level:
        query = query.filter(RoadSegment.susceptibility_level == susceptibility_level)

    # District filter
    if district:
        query = query.filter(RoadSegment.district.ilike(f"%{district}%"))

    # Highway class filter
    if highway_class:
        query = query.filter(RoadSegment.highway_class == highway_class)

    # Pagination
    results = query.offset(offset).limit(limit).all()

    # Build GeoJSON response
    features = []
    for segment, geojson_str in results:
        geom = json.loads(geojson_str)
        feature = GeoJSONFeature(
            id=segment.id,
            geometry=GeoJSONGeometry(
                type=geom["type"],
                coordinates=geom["coordinates"],
            ),
            properties={
                "id": segment.id,
                "name": segment.name,
                "highway_class": segment.highway_class,
                "road_ref": segment.road_ref,
                "district": segment.district,
                "length_m": segment.length_m,
                "susceptibility_score": segment.susceptibility_score,
                "susceptibility_level": segment.susceptibility_level,
                "risk_score": segment.risk_score,
                "risk_level": segment.risk_level,
                "risk_updated_at": (
                    segment.risk_updated_at.isoformat()
                    if segment.risk_updated_at
                    else None
                ),
                "slope_mean": segment.slope_mean,
                "elevation_mean": segment.elevation_mean,
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


@router.get("/{segment_id}/geojson", response_model=GeoJSONFeature)
def get_segment_geojson(segment_id: int, db: Session = Depends(get_db)):
    """Get a single segment as a GeoJSON Feature."""
    result = (
        db.query(
            RoadSegment,
            func.ST_AsGeoJSON(RoadSegment.geom).label("geojson"),
        )
        .filter(RoadSegment.id == segment_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found")

    segment, geojson_str = result
    geom = json.loads(geojson_str)

    return GeoJSONFeature(
        id=segment.id,
        geometry=GeoJSONGeometry(
            type=geom["type"],
            coordinates=geom["coordinates"],
        ),
        properties={
            "id": segment.id,
            "name": segment.name,
            "highway_class": segment.highway_class,
            "road_ref": segment.road_ref,
            "district": segment.district,
            "length_m": segment.length_m,
            "susceptibility_score": segment.susceptibility_score,
            "susceptibility_level": segment.susceptibility_level,
            "risk_score": segment.risk_score,
            "risk_level": segment.risk_level,
            "elevation_mean": segment.elevation_mean,
            "elevation_max": segment.elevation_max,
            "slope_mean": segment.slope_mean,
            "slope_max": segment.slope_max,
            "aspect_mean": segment.aspect_mean,
            "curvature_mean": segment.curvature_mean,
            "twi_mean": segment.twi_mean,
            "dist_to_river_m": segment.dist_to_river_m,
        },
    )
