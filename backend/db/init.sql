-- HillRoadRisk Database Initialization
-- Runs automatically on first Docker Compose up

-- Enable PostGIS extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================
-- Road Segments
-- ============================================
CREATE TABLE IF NOT EXISTS road_segments (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT,
    name VARCHAR(255),
    highway_class VARCHAR(50),       -- NH, SH, district, village
    road_ref VARCHAR(50),            -- e.g., NH-58, NH-7
    district VARCHAR(100),
    state VARCHAR(50) DEFAULT 'Uttarakhand',
    length_m DOUBLE PRECISION,
    
    -- Terrain features (assigned from DEM)
    elevation_mean DOUBLE PRECISION,
    elevation_max DOUBLE PRECISION,
    slope_mean DOUBLE PRECISION,
    slope_max DOUBLE PRECISION,
    aspect_mean DOUBLE PRECISION,
    curvature_mean DOUBLE PRECISION,
    twi_mean DOUBLE PRECISION,           -- Topographic Wetness Index
    dist_to_river_m DOUBLE PRECISION,    -- Distance to nearest river
    land_cover VARCHAR(50),
    
    -- Risk scores
    susceptibility_score DOUBLE PRECISION,   -- Phase 1: 0-1 static score
    susceptibility_level VARCHAR(20),         -- Low / Medium / High / Very High
    risk_score DOUBLE PRECISION,             -- Phase 2: dynamic 0-1 score
    risk_level VARCHAR(20),                  -- Safe / Watch / Warning / Danger
    risk_updated_at TIMESTAMPTZ,
    
    -- Geometry
    geom GEOMETRY(LineString, 4326) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_geom ON road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_segments_risk ON road_segments (risk_level);
CREATE INDEX IF NOT EXISTS idx_segments_district ON road_segments (district);
CREATE INDEX IF NOT EXISTS idx_segments_highway ON road_segments (highway_class);

-- ============================================
-- Villages
-- ============================================
CREATE TABLE IF NOT EXISTS villages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(50) DEFAULT 'Uttarakhand',
    population INTEGER,
    
    -- Risk scores
    susceptibility_score DOUBLE PRECISION,
    susceptibility_level VARCHAR(20),
    risk_score DOUBLE PRECISION,
    risk_level VARCHAR(20),
    risk_updated_at TIMESTAMPTZ,
    
    -- Geometry
    geom GEOMETRY(Point, 4326) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_villages_geom ON villages USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_villages_risk ON villages (risk_level);

-- ============================================
-- Historical Landslides
-- ============================================
CREATE TABLE IF NOT EXISTS landslide_events (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100),             -- GSI, NDMA, NASA, news
    event_date DATE,
    event_year INTEGER,
    location_name VARCHAR(255),
    district VARCHAR(100),
    state VARCHAR(50) DEFAULT 'Uttarakhand',
    description TEXT,
    fatalities INTEGER,
    injuries INTEGER,
    trigger_type VARCHAR(100),       -- rainfall, earthquake, construction
    landslide_type VARCHAR(100),     -- debris flow, rockslide, mudslide
    
    -- Geometry
    geom GEOMETRY(Point, 4326),
    accuracy_km DOUBLE PRECISION,    -- Location accuracy radius
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landslides_geom ON landslide_events USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_landslides_date ON landslide_events (event_date);

-- ============================================
-- Rainfall Observations (Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS rainfall_observations (
    id SERIAL PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(50),              -- open_meteo, imd
    
    -- Rainfall data
    precipitation_mm DOUBLE PRECISION,
    temperature_c DOUBLE PRECISION,
    
    -- Rolling aggregates (computed)
    rain_6h_mm DOUBLE PRECISION,
    rain_24h_mm DOUBLE PRECISION,
    rain_48h_mm DOUBLE PRECISION,
    rain_72h_mm DOUBLE PRECISION,
    
    geom GEOMETRY(Point, 4326),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rainfall_geom ON rainfall_observations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_rainfall_time ON rainfall_observations (observed_at DESC);

-- ============================================
-- Ingestion Logs
-- ============================================
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,        -- dem, osm, landslides, rainfall
    status VARCHAR(20) NOT NULL,         -- success, failed, partial
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds DOUBLE PRECISION,
    metadata JSONB
);

-- ============================================
-- Alert Subscriptions (Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    push_subscription JSONB,         -- Web Push subscription object
    districts TEXT[],                 -- Subscribed districts
    route_ids INTEGER[],             -- Subscribed road segment IDs
    min_alert_level VARCHAR(20) DEFAULT 'Warning',  -- Minimum level to notify
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Alerts History (Phase 2)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER REFERENCES road_segments(id),
    village_id INTEGER REFERENCES villages(id),
    alert_level VARCHAR(20) NOT NULL,
    message TEXT,
    triggered_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts (triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts (alert_level);
