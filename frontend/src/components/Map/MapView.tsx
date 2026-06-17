/**
 * HillRoadRisk — MapLibre GL Map Component
 * 
 * Interactive map centered on Uttarakhand with risk-colored
 * road segment overlays and village markers.
 */

import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore } from '../../stores/appStore';
import type { SegmentProperties, VillageProperties } from '../../stores/appStore';
import { fetchSegments, fetchVillages, fetchLandslides } from '../../api/client';

// Risk level → color mapping
const RISK_COLORS: Record<string, string> = {
  Safe: '#22c55e',
  Watch: '#eab308',
  Warning: '#f97316',
  Danger: '#ef4444',
};

const SUSCEPTIBILITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  'Very High': '#ef4444',
};

// Helper function to setup map layers
function setupMapSourcesAndLayers(map: maplibregl.Map, theme: 'dark' | 'light') {
  // ---- Road Segments Source ----
  map.addSource('segments', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Road segments casing (creates outline structure so they look like roads)
  map.addLayer({
    id: 'segments-casing',
    type: 'line',
    source: 'segments',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': theme === 'dark' ? '#0a0e1a' : '#ffffff',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6, 3.5,
        10, 5.5,
        14, 8.5,
      ],
      'line-opacity': 0.9,
    },
  });

  // Road segments layer — colored by susceptibility
  map.addLayer({
    id: 'segments-layer',
    type: 'line',
    source: 'segments',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': [
        'match',
        ['get', 'susceptibility_level'],
        'Low', SUSCEPTIBILITY_COLORS.Low,
        'Medium', SUSCEPTIBILITY_COLORS.Medium,
        'High', SUSCEPTIBILITY_COLORS.High,
        'Very High', SUSCEPTIBILITY_COLORS['Very High'],
        '#6b7280', // default gray
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6, 1.5,
        10, 3,
        14, 5,
      ],
      'line-opacity': 0.9,
    },
  });

  // Segments hover highlight
  map.addLayer({
    id: 'segments-hover',
    type: 'line',
    source: 'segments',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ffffff',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6, 2.5,
        10, 4,
        14, 6.5,
      ],
      'line-opacity': 0,
    },
    filter: ['==', ['get', 'id'], -1],
  });

  // ---- Villages Source ----
  map.addSource('villages', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Village markers
  map.addLayer({
    id: 'villages-layer',
    type: 'circle',
    source: 'villages',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6, 3,
        10, 6,
        14, 10,
      ],
      'circle-color': [
        'match',
        ['get', 'susceptibility_level'],
        'Low', SUSCEPTIBILITY_COLORS.Low,
        'Medium', SUSCEPTIBILITY_COLORS.Medium,
        'High', SUSCEPTIBILITY_COLORS.High,
        'Very High', SUSCEPTIBILITY_COLORS['Very High'],
        '#6b7280',
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      'circle-opacity': 0.8,
    },
  });

  // Village labels
  map.addLayer({
    id: 'villages-labels',
    type: 'symbol',
    source: 'villages',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 11,
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: {
      'text-color': theme === 'dark' ? '#e2e8f0' : '#1e293b',
      'text-halo-color': theme === 'dark' ? 'rgba(10, 14, 26, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      'text-halo-width': 1.5,
    },
    minzoom: 10,
  });

  // ---- Historical Landslides Source ----
  map.addSource('landslides', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Landslide heatmap
  map.addLayer({
    id: 'landslides-heat',
    type: 'heatmap',
    source: 'landslides',
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': [
        'interpolate', ['linear'], ['zoom'],
        0, 1, 12, 3,
      ],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0, 0, 0, 0)',
        0.2, 'rgba(103, 58, 183, 0.3)',
        0.4, 'rgba(233, 30, 99, 0.5)',
        0.6, 'rgba(244, 67, 54, 0.6)',
        0.8, 'rgba(255, 152, 0, 0.7)',
        1, 'rgba(255, 235, 59, 0.8)',
      ],
      'heatmap-radius': [
        'interpolate', ['linear'], ['zoom'],
        0, 8, 12, 25,
      ],
      'heatmap-opacity': 0.7,
    },
    layout: {
      visibility: 'none',
    },
  });

  // Landslide points (visible at higher zoom)
  map.addLayer({
    id: 'landslides-points',
    type: 'circle',
    source: 'landslides',
    paint: {
      'circle-radius': 5,
      'circle-color': '#ef4444',
      'circle-stroke-width': 1,
      'circle-stroke-color': theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
      'circle-opacity': 0.7,
    },
    layout: {
      visibility: 'none',
    },
    minzoom: 10,
  });
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const {
    layers,
    sidebarOpen,
    setSelectedSegment,
    setSelectedVillage,
    setSelectedLandslide,
    filters,
    mapTheme,
  } = useAppStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialStyle = mapTheme === 'light'
      ? 'https://tiles.openfreemap.org/styles/bright'
      : 'https://tiles.openfreemap.org/styles/dark';

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle,
      center: [79.5, 30.5], // Uttarakhand center
      zoom: 8,
      minZoom: 6,
      maxZoom: 18,
      attributionControl: true,
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }),
      'bottom-right'
    );

    map.on('load', () => {
      setupMapSourcesAndLayers(map, mapTheme);

      // Load initial data
      loadSegments(map);
      loadVillages(map);
      loadLandslides(map);
    });

    // ---- Click handlers ----
    map.on('click', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties as unknown as SegmentProperties;
        setSelectedSegment(props);
      }
    });

    map.on('click', 'villages-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties as unknown as VillageProperties;
        setSelectedVillage(props);
      }
    });

    map.on('click', 'landslides-points', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties as any;
        setSelectedLandslide(props);
      }
    });

    // ---- Hover effects ----
    map.on('mouseenter', 'segments-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'segments-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'villages-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'villages-layer', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'landslides-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'landslides-points', () => {
      map.getCanvas().style.cursor = '';
    });

    // Hover highlight on segments
    let hoveredId: number | null = null;
    map.on('mousemove', 'segments-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const newId = e.features[0].properties?.id;
        if (newId !== hoveredId) {
          hoveredId = newId;
          map.setFilter('segments-hover', ['==', ['get', 'id'], hoveredId]);
          map.setPaintProperty('segments-hover', 'line-opacity', 0.4);
        }
      }
    });

    map.on('mouseleave', 'segments-layer', () => {
      hoveredId = null;
      map.setPaintProperty('segments-hover', 'line-opacity', 0);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle style (theme) changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const newStyle = mapTheme === 'light'
      ? 'https://tiles.openfreemap.org/styles/bright'
      : 'https://tiles.openfreemap.org/styles/dark';

    map.setStyle(newStyle);

    const handleStyleData = () => {
      if (!map.getSource('segments')) {
        setupMapSourcesAndLayers(map, mapTheme);
        loadSegments(map);
        loadVillages(map);
        loadLandslides(map);
      }
    };

    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [mapTheme]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const setVisibility = (layerId: string, visible: boolean) => {
      try {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      } catch {
        // Layer might not exist yet
      }
    };

    setVisibility('segments-layer', layers.riskOverlay);
    setVisibility('segments-casing', layers.riskOverlay);
    setVisibility('segments-hover', layers.riskOverlay);
    setVisibility('villages-layer', layers.villages);
    setVisibility('villages-labels', layers.villages);
    setVisibility('landslides-heat', layers.historicalEvents);
    setVisibility('landslides-points', layers.historicalEvents);
  }, [layers, mapTheme]);

  // Apply map filters dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const applyFilters = () => {
      // 1. Segment Filters
      const segExpr: any[] = ['all'];
      if (filters.district) {
        segExpr.push(['==', ['get', 'district'], filters.district]);
      }
      if (filters.susceptibilityLevel) {
        segExpr.push(['==', ['get', 'susceptibility_level'], filters.susceptibilityLevel]);
      }
      if (filters.highwayClass) {
        segExpr.push(['==', ['get', 'highway_class'], filters.highwayClass]);
      }

      const segmentFilter = segExpr.length > 1 ? segExpr : null;
      try {
        map.setFilter('segments-layer', segmentFilter);
        map.setFilter('segments-casing', segmentFilter);
      } catch (e) {
        console.warn('Failed to filter segments layer:', e);
      }

      // 2. Village Filters
      const vilExpr: any[] = ['all'];
      if (filters.district) {
        vilExpr.push(['==', ['get', 'district'], filters.district]);
      }
      if (filters.susceptibilityLevel) {
        vilExpr.push(['==', ['get', 'susceptibility_level'], filters.susceptibilityLevel]);
      }

      const villageFilter = vilExpr.length > 1 ? vilExpr : null;
      try {
        map.setFilter('villages-layer', villageFilter);
        map.setFilter('villages-labels', villageFilter);
      } catch (e) {
        console.warn('Failed to filter villages layer:', e);
      }
    };

    applyFilters();
  }, [filters, mapTheme]);

  return (
    <div
      className={`map-container ${!sidebarOpen ? 'full-width' : ''}`}
      id="map-container"
    >
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// ============================================
// Data Loading Functions
// ============================================

async function loadSegments(map: maplibregl.Map) {
  try {
    const data = await fetchSegments({
      bbox: '77.0,29.0,81.0,31.5',
      limit: 2000,
    });
    const source = map.getSource('segments') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data as unknown as GeoJSON.FeatureCollection);
    }
  } catch (err) {
    console.warn('Failed to load segments:', err);
    // Load demo data if API is not available
    loadDemoSegments(map);
  }
}

async function loadVillages(map: maplibregl.Map) {
  try {
    const data = await fetchVillages({
      bbox: '77.0,29.0,81.0,31.5',
      limit: 1000,
    });
    const source = map.getSource('villages') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data as unknown as GeoJSON.FeatureCollection);
    }
  } catch (err) {
    console.warn('Failed to load villages:', err);
    loadDemoVillages(map);
  }
}

async function loadLandslides(map: maplibregl.Map) {
  try {
    const data = await fetchLandslides({
      bbox: '77.0,29.0,81.0,31.5',
      limit: 2000,
    });
    const source = map.getSource('landslides') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data as unknown as GeoJSON.FeatureCollection);
    }
  } catch (err) {
    console.warn('Failed to load landslides:', err);
    loadDemoLandslides(map);
  }
}

// ============================================
// Demo Data (for when API is not running)
// ============================================

function loadDemoSegments(map: maplibregl.Map) {
  const demoData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      // NH-7 near Joshimath
      {
        type: 'Feature',
        properties: { id: 1, name: 'NH-7 Joshimath Segment', highway_class: 'NH', road_ref: 'NH-7', district: 'Chamoli', length_m: 1200, susceptibility_score: 0.85, susceptibility_level: 'Very High', risk_score: null, risk_level: null, slope_mean: 35.2, elevation_mean: 2100 },
        geometry: { type: 'LineString', coordinates: [[79.55, 30.55], [79.57, 30.56], [79.59, 30.555]] },
      },
      // NH-58 near Rudraprayag
      {
        type: 'Feature',
        properties: { id: 2, name: 'NH-58 Rudraprayag', highway_class: 'NH', road_ref: 'NH-58', district: 'Rudraprayag', length_m: 980, susceptibility_score: 0.72, susceptibility_level: 'High', risk_score: null, risk_level: null, slope_mean: 28.5, elevation_mean: 1800 },
        geometry: { type: 'LineString', coordinates: [[79.0, 30.28], [79.02, 30.29], [79.04, 30.285]] },
      },
      // Road near Kedarnath
      {
        type: 'Feature',
        properties: { id: 3, name: 'Kedarnath Road', highway_class: 'SH', road_ref: null, district: 'Rudraprayag', length_m: 1500, susceptibility_score: 0.91, susceptibility_level: 'Very High', risk_score: null, risk_level: null, slope_mean: 42.1, elevation_mean: 3200 },
        geometry: { type: 'LineString', coordinates: [[79.06, 30.72], [79.065, 30.73], [79.07, 30.735], [79.075, 30.74]] },
      },
      // Road near Rishikesh (lower risk)
      {
        type: 'Feature',
        properties: { id: 4, name: 'NH-58 Rishikesh', highway_class: 'NH', road_ref: 'NH-58', district: 'Dehradun', length_m: 1100, susceptibility_score: 0.25, susceptibility_level: 'Low', risk_score: null, risk_level: null, slope_mean: 8.3, elevation_mean: 450 },
        geometry: { type: 'LineString', coordinates: [[78.27, 30.1], [78.29, 30.11], [78.31, 30.115]] },
      },
      // Chamoli district road
      {
        type: 'Feature',
        properties: { id: 5, name: 'Chamoli District Rd', highway_class: 'district', road_ref: null, district: 'Chamoli', length_m: 900, susceptibility_score: 0.58, susceptibility_level: 'Medium', risk_score: null, risk_level: null, slope_mean: 22.4, elevation_mean: 1650 },
        geometry: { type: 'LineString', coordinates: [[79.35, 30.4], [79.37, 30.41], [79.39, 30.405]] },
      },
      // Badrinath Road
      {
        type: 'Feature',
        properties: { id: 6, name: 'Badrinath Highway', highway_class: 'NH', road_ref: 'NH-7', district: 'Chamoli', length_m: 1300, susceptibility_score: 0.88, susceptibility_level: 'Very High', risk_score: null, risk_level: null, slope_mean: 38.7, elevation_mean: 2800 },
        geometry: { type: 'LineString', coordinates: [[79.49, 30.73], [79.5, 30.74], [79.51, 30.745], [79.52, 30.74]] },
      },
      // Tehri area road
      {
        type: 'Feature',
        properties: { id: 7, name: 'Tehri Dam Road', highway_class: 'SH', road_ref: null, district: 'Tehri Garhwal', length_m: 1050, susceptibility_score: 0.65, susceptibility_level: 'High', risk_score: null, risk_level: null, slope_mean: 26.8, elevation_mean: 1400 },
        geometry: { type: 'LineString', coordinates: [[78.48, 30.38], [78.5, 30.39], [78.52, 30.385]] },
      },
      // Mussoorie Road
      {
        type: 'Feature',
        properties: { id: 8, name: 'Mussoorie Road', highway_class: 'SH', road_ref: null, district: 'Dehradun', length_m: 850, susceptibility_score: 0.45, susceptibility_level: 'Medium', risk_score: null, risk_level: null, slope_mean: 18.5, elevation_mean: 1800 },
        geometry: { type: 'LineString', coordinates: [[78.06, 30.45], [78.08, 30.46], [78.1, 30.455]] },
      },
    ],
  };

  const source = map.getSource('segments') as maplibregl.GeoJSONSource;
  if (source) source.setData(demoData);
}

function loadDemoVillages(map: maplibregl.Map) {
  const demoData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 1, name: 'Joshimath', district: 'Chamoli', population: 16000, susceptibility_score: 0.88, susceptibility_level: 'Very High' }, geometry: { type: 'Point', coordinates: [79.565, 30.555] } },
      { type: 'Feature', properties: { id: 2, name: 'Rudraprayag', district: 'Rudraprayag', population: 8500, susceptibility_score: 0.72, susceptibility_level: 'High' }, geometry: { type: 'Point', coordinates: [78.98, 30.285] } },
      { type: 'Feature', properties: { id: 3, name: 'Chamoli', district: 'Chamoli', population: 5000, susceptibility_score: 0.65, susceptibility_level: 'High' }, geometry: { type: 'Point', coordinates: [79.33, 30.41] } },
      { type: 'Feature', properties: { id: 4, name: 'Uttarkashi', district: 'Uttarkashi', population: 18000, susceptibility_score: 0.55, susceptibility_level: 'Medium' }, geometry: { type: 'Point', coordinates: [78.45, 30.73] } },
      { type: 'Feature', properties: { id: 5, name: 'Rishikesh', district: 'Dehradun', population: 100000, susceptibility_score: 0.2, susceptibility_level: 'Low' }, geometry: { type: 'Point', coordinates: [78.27, 30.1] } },
      { type: 'Feature', properties: { id: 6, name: 'Tehri', district: 'Tehri Garhwal', population: 25000, susceptibility_score: 0.6, susceptibility_level: 'High' }, geometry: { type: 'Point', coordinates: [78.48, 30.39] } },
      { type: 'Feature', properties: { id: 7, name: 'Badrinath', district: 'Chamoli', population: 800, susceptibility_score: 0.78, susceptibility_level: 'High' }, geometry: { type: 'Point', coordinates: [79.49, 30.74] } },
      { type: 'Feature', properties: { id: 8, name: 'Kedarnath', district: 'Rudraprayag', population: 500, susceptibility_score: 0.92, susceptibility_level: 'Very High' }, geometry: { type: 'Point', coordinates: [79.07, 30.735] } },
      { type: 'Feature', properties: { id: 9, name: 'Mussoorie', district: 'Dehradun', population: 30000, susceptibility_score: 0.42, susceptibility_level: 'Medium' }, geometry: { type: 'Point', coordinates: [78.08, 30.46] } },
      { type: 'Feature', properties: { id: 10, name: 'Pithoragarh', district: 'Pithoragarh', population: 56000, susceptibility_score: 0.58, susceptibility_level: 'Medium' }, geometry: { type: 'Point', coordinates: [80.22, 29.58] } },
    ],
  };

  const source = map.getSource('villages') as maplibregl.GeoJSONSource;
  if (source) source.setData(demoData);
}

function loadDemoLandslides(map: maplibregl.Map) {
  const demoData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 1, event_date: '2013-06-17', location_name: 'Kedarnath Disaster', district: 'Rudraprayag', fatalities: 5000, trigger_type: 'cloudburst' }, geometry: { type: 'Point', coordinates: [79.07, 30.73] } },
      { type: 'Feature', properties: { id: 2, event_date: '2021-02-07', location_name: 'Chamoli Glacier Burst', district: 'Chamoli', fatalities: 200, trigger_type: 'glacier' }, geometry: { type: 'Point', coordinates: [79.7, 30.48] } },
      { type: 'Feature', properties: { id: 3, event_date: '2023-01-02', location_name: 'Joshimath Subsidence', district: 'Chamoli', fatalities: 0, trigger_type: 'subsidence' }, geometry: { type: 'Point', coordinates: [79.565, 30.555] } },
      { type: 'Feature', properties: { id: 4, event_date: '2022-09-15', location_name: 'Uttarkashi Landslide', district: 'Uttarkashi', fatalities: 8, trigger_type: 'rainfall' }, geometry: { type: 'Point', coordinates: [78.5, 30.7] } },
      { type: 'Feature', properties: { id: 5, event_date: '2024-07-20', location_name: 'Rudraprayag Road Collapse', district: 'Rudraprayag', fatalities: 12, trigger_type: 'rainfall' }, geometry: { type: 'Point', coordinates: [79.0, 30.3] } },
      { type: 'Feature', properties: { id: 6, event_date: '2023-08-14', location_name: 'Tehri Garhwal Slide', district: 'Tehri Garhwal', fatalities: 3, trigger_type: 'rainfall' }, geometry: { type: 'Point', coordinates: [78.6, 30.4] } },
      { type: 'Feature', properties: { id: 7, event_date: '2024-09-01', location_name: 'Pithoragarh Rock Fall', district: 'Pithoragarh', fatalities: 5, trigger_type: 'earthquake' }, geometry: { type: 'Point', coordinates: [80.1, 29.6] } },
    ],
  };

  const source = map.getSource('landslides') as maplibregl.GeoJSONSource;
  if (source) source.setData(demoData);
}
