"""
HillRoadRisk — OpenStreetMap Road Network Ingestion for Uttarakhand.

Downloads and processes road network data from OSM using OSMNX,
segments roads into ~1km chunks, and stores in PostGIS.
"""

import structlog
from datetime import datetime
from typing import Optional

import geopandas as gpd
import osmnx as ox
from shapely.geometry import LineString
from shapely.ops import substring
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import RoadSegment, IngestionLog
from app.config import settings

logger = structlog.get_logger()

# Uttarakhand bounding box
UTTARAKHAND_BBOX = (
    settings.region_max_lat,  # north
    settings.region_min_lat,  # south
    settings.region_max_lon,  # east
    settings.region_min_lon,  # west
)

# Road types to include
ROAD_TYPES = [
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "motorway_link",
    "trunk_link",
    "primary_link",
    "secondary_link",
]

# Map OSM highway tags to our classification
HIGHWAY_CLASS_MAP = {
    "motorway": "NH",
    "motorway_link": "NH",
    "trunk": "NH",
    "trunk_link": "NH",
    "primary": "SH",
    "primary_link": "SH",
    "secondary": "district",
    "secondary_link": "district",
    "tertiary": "district",
}

# Target segment length in meters
SEGMENT_LENGTH_M = 1000


def segment_linestring(line: LineString, segment_length: float) -> list[LineString]:
    """
    Split a LineString into segments of approximately `segment_length` meters.

    Uses Shapely's substring function for accurate splitting.
    """
    total_length = line.length
    if total_length <= segment_length:
        return [line]

    segments = []
    current_pos = 0.0
    while current_pos < total_length:
        end_pos = min(current_pos + segment_length, total_length)
        segment = substring(line, current_pos, end_pos)
        if segment.length > 0:
            segments.append(segment)
        current_pos = end_pos

    return segments


def classify_highway(highway_tag: str) -> str:
    """Map OSM highway tag to our classification (NH/SH/district)."""
    if isinstance(highway_tag, list):
        highway_tag = highway_tag[0]
    return HIGHWAY_CLASS_MAP.get(highway_tag, "district")


def extract_road_ref(row) -> Optional[str]:
    """Extract road reference (e.g., NH-58) from OSM tags."""
    ref = row.get("ref", None)
    if isinstance(ref, list):
        ref = ref[0]
    return ref


def ingest_road_network(
    bbox: tuple = UTTARAKHAND_BBOX,
    segment_length: float = SEGMENT_LENGTH_M,
) -> dict:
    """
    Download road network from OSM, segment into ~1km pieces, and store in PostGIS.

    Args:
        bbox: (north, south, east, west) bounding box
        segment_length: Target length per segment in meters

    Returns:
        dict with ingestion statistics
    """
    started_at = datetime.utcnow()
    db: Session = SessionLocal()

    log = IngestionLog(
        source="osm_roads",
        status="running",
        started_at=started_at,
    )
    db.add(log)
    db.commit()

    try:
        logger.info("Downloading road network from OSM", bbox=bbox)

        # Download road network
        cf = f'["highway"~"{"'|'".join(ROAD_TYPES)}"]'
        north, south, east, west = bbox

        gdf = ox.features_from_bbox(
            bbox=(north, south, east, west),
            tags={"highway": ROAD_TYPES},
        )

        # Filter to LineString geometries only
        gdf = gdf[gdf.geometry.type.isin(["LineString", "MultiLineString"])]
        logger.info(f"Downloaded {len(gdf)} road features from OSM")

        # Reproject to UTM for accurate length measurement
        # UTM zone 44N covers most of Uttarakhand
        gdf_utm = gdf.to_crs(epsg=32644)

        records_processed = 0
        records_failed = 0

        for idx, row in gdf_utm.iterrows():
            try:
                geom_utm = row.geometry

                # Handle MultiLineString by taking the longest part
                if geom_utm.geom_type == "MultiLineString":
                    geom_utm = max(geom_utm.geoms, key=lambda g: g.length)

                # Segment the road
                segments = segment_linestring(geom_utm, segment_length)

                for seg_geom_utm in segments:
                    # Convert back to WGS84 for storage
                    seg_gdf = gpd.GeoDataFrame(
                        geometry=[seg_geom_utm], crs="EPSG:32644"
                    )
                    seg_gdf_wgs = seg_gdf.to_crs(epsg=4326)
                    seg_geom_wgs = seg_gdf_wgs.geometry.iloc[0]

                    segment = RoadSegment(
                        osm_id=row.get("osmid", None) if hasattr(row, "osmid") else None,
                        name=row.get("name", None),
                        highway_class=classify_highway(
                            row.get("highway", "tertiary")
                        ),
                        road_ref=extract_road_ref(row),
                        state="Uttarakhand",
                        length_m=round(seg_geom_utm.length, 1),
                        geom=f"SRID=4326;{seg_geom_wgs.wkt}",
                    )
                    db.add(segment)
                    records_processed += 1

                # Batch commit every 500 segments
                if records_processed % 500 == 0:
                    db.commit()
                    logger.info(f"Committed {records_processed} segments so far")

            except Exception as e:
                records_failed += 1
                logger.warning("Failed to process road feature", error=str(e))
                continue

        db.commit()

        # Update log
        completed_at = datetime.utcnow()
        log.status = "success"
        log.records_processed = records_processed
        log.records_failed = records_failed
        log.completed_at = completed_at
        log.duration_seconds = (completed_at - started_at).total_seconds()
        db.commit()

        logger.info(
            "Road network ingestion complete",
            records_processed=records_processed,
            records_failed=records_failed,
            duration_s=log.duration_seconds,
        )

        return {
            "status": "success",
            "records_processed": records_processed,
            "records_failed": records_failed,
            "duration_seconds": log.duration_seconds,
        }

    except Exception as e:
        log.status = "failed"
        log.error_message = str(e)
        log.completed_at = datetime.utcnow()
        db.commit()
        logger.error("Road network ingestion failed", error=str(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    """Run ingestion as a standalone script."""
    result = ingest_road_network()
    print(f"Ingestion result: {result}")
