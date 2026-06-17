import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.main import app
from app.database import get_db
from app.models import RoadSegment, Village, LandslideEvent

client = TestClient(app)

# ============================================
# General / Health Checks
# ============================================

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "HillRoadRisk API"
    assert "segments" in data["endpoints"]

@patch("app.database.SessionLocal")
def test_health_check_connected(mock_session_local):
    mock_db = MagicMock()
    mock_db.execute.return_value = None
    mock_session_local.return_value = mock_db

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

@patch("app.database.SessionLocal")
def test_health_check_disconnected(mock_session_local):
    mock_session_local.side_effect = Exception("Database is down")

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "disconnected"

def test_404_handler():
    response = client.get("/non-existent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Resource not found"

# ============================================
# Road Segments Endpoint
# ============================================

def test_get_segment_risk_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/segments/999/risk")
    # Custom 404 handler overrides the 404 message format
    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"

    app.dependency_overrides.clear()

def test_get_segment_risk_success():
    mock_db = MagicMock()
    mock_segment = RoadSegment(
        id=12,
        name="Joshimath highway",
        highway_class="NH",
        road_ref="NH-7",
        district="Chamoli",
        length_m=1200.0,
        susceptibility_score=0.75,
        susceptibility_level="High",
        risk_score=0.8,
        risk_level="Warning",
        risk_updated_at=datetime(2026, 6, 17, 12, 0, 0),
        slope_mean=34.5,
        elevation_mean=1850.0
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_segment
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/segments/12/risk")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 12
    assert data["name"] == "Joshimath highway"
    assert data["susceptibility_level"] == "High"
    assert data["risk_level"] == "Warning"

    app.dependency_overrides.clear()

def test_query_segments_geojson():
    mock_db = MagicMock()
    mock_segment = RoadSegment(
        id=1,
        name="NH-58 Rudraprayag",
        highway_class="NH",
        road_ref="NH-58",
        district="Rudraprayag",
        length_m=900.0,
        susceptibility_score=0.5,
        susceptibility_level="Medium",
        risk_score=None,
        risk_level=None,
        risk_updated_at=None,
        slope_mean=24.0,
        elevation_mean=1200.0
    )
    mock_geojson = '{"type": "LineString", "coordinates": [[78.9, 30.2], [79.0, 30.3]]}'
    
    # Setup chainable query mock
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.all.return_value = [(mock_segment, mock_geojson)]
    
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/segments?district=Rudraprayag")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    
    feature = data["features"][0]
    assert feature["id"] == 1
    assert feature["geometry"]["type"] == "LineString"
    assert feature["properties"]["name"] == "NH-58 Rudraprayag"
    assert feature["properties"]["district"] == "Rudraprayag"

    app.dependency_overrides.clear()

# ============================================
# Villages Endpoints
# ============================================

def test_get_village_risk_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/villages/888/risk")
    assert response.status_code == 404
    assert response.json()["detail"] == "Resource not found"

    app.dependency_overrides.clear()

def test_get_village_risk_success():
    mock_db = MagicMock()
    mock_village = Village(
        id=88,
        name="Govindghat",
        district="Chamoli",
        population=1200,
        susceptibility_score=0.68,
        susceptibility_level="High",
        risk_score=None,
        risk_level=None
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_village
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/villages/88/risk")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 88
    assert data["name"] == "Govindghat"
    assert data["population"] == 1200

    app.dependency_overrides.clear()

def test_query_villages_geojson():
    mock_db = MagicMock()
    mock_village = Village(
        id=2,
        name="Mana",
        district="Chamoli",
        population=400,
        susceptibility_score=0.9,
        susceptibility_level="Very High",
        risk_score=0.95,
        risk_level="Danger",
        risk_updated_at=datetime(2026, 6, 17, 12, 0, 0)
    )
    mock_geojson = '{"type": "Point", "coordinates": [79.49, 30.77]}'
    
    # Setup chainable query mock
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.all.return_value = [(mock_village, mock_geojson)]
    
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/villages?bbox=79.0,30.0,80.0,31.0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["features"]) == 1
    feature = data["features"][0]
    assert feature["properties"]["name"] == "Mana"
    assert feature["geometry"]["coordinates"] == [79.49, 30.77]

    app.dependency_overrides.clear()

# ============================================
# Landslides Endpoints
# ============================================

def test_query_landslides_geojson():
    mock_db = MagicMock()
    mock_event = LandslideEvent(
        id=5,
        source="NASA",
        event_date=datetime(2024, 7, 20),
        event_year=2024,
        location_name="Nainital Highway",
        district="Nainital",
        description="Heavy rockslide",
        fatalities=2,
        trigger_type="rainfall",
        landslide_type="rockslide"
    )
    mock_geojson = '{"type": "Point", "coordinates": [79.45, 29.38]}'
    
    # Setup chainable query mock
    query_mock = mock_db.query.return_value
    query_mock.filter.return_value = query_mock
    query_mock.order_by.return_value = query_mock
    query_mock.offset.return_value = query_mock
    query_mock.limit.return_value = query_mock
    query_mock.all.return_value = [(mock_event, mock_geojson)]
    
    app.dependency_overrides[get_db] = lambda: mock_db

    response = client.get("/api/v1/landslides?trigger_type=rainfall")
    assert response.status_code == 200
    data = response.json()
    assert len(data["features"]) == 1
    feature = data["features"][0]
    assert feature["properties"]["location_name"] == "Nainital Highway"
    assert feature["properties"]["fatalities"] == 2

    app.dependency_overrides.clear()

