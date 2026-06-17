/**
 * HillRoadRisk — API Client
 * 
 * Typed API client for the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============================================
// Types
// ============================================

export interface GeoJSONFeature {
  type: 'Feature';
  id?: number;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  metadata?: Record<string, unknown>;
}

export interface SegmentRisk {
  id: number;
  name: string | null;
  highway_class: string | null;
  road_ref: string | null;
  district: string | null;
  length_m: number | null;
  susceptibility_score: number | null;
  susceptibility_level: string | null;
  risk_score: number | null;
  risk_level: string | null;
  risk_updated_at: string | null;
  elevation_mean: number | null;
  slope_mean: number | null;
  slope_max: number | null;
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  database: string;
  region: string;
}

// ============================================
// Query Parameters
// ============================================

interface SegmentQueryParams {
  bbox?: string;
  risk_level?: string;
  susceptibility_level?: string;
  district?: string;
  highway_class?: string;
  limit?: number;
  offset?: number;
}

interface LandslideQueryParams {
  bbox?: string;
  district?: string;
  year_from?: number;
  year_to?: number;
  trigger_type?: string;
  limit?: number;
}

// ============================================
// API Functions
// ============================================

async function fetchJSON<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ---- Health ----

export async function checkHealth(): Promise<HealthResponse> {
  return fetchJSON('/health');
}

// ---- Segments ----

export async function fetchSegments(params?: SegmentQueryParams): Promise<GeoJSONFeatureCollection> {
  return fetchJSON('/api/v1/segments', params as Record<string, string | number | undefined>);
}

export async function fetchSegmentRisk(segmentId: number): Promise<SegmentRisk> {
  return fetchJSON(`/api/v1/segments/${segmentId}/risk`);
}

export async function fetchSegmentGeoJSON(segmentId: number): Promise<GeoJSONFeature> {
  return fetchJSON(`/api/v1/segments/${segmentId}/geojson`);
}

// ---- Villages ----

export async function fetchVillages(params?: SegmentQueryParams): Promise<GeoJSONFeatureCollection> {
  return fetchJSON('/api/v1/villages', params as Record<string, string | number | undefined>);
}

// ---- Landslides ----

export async function fetchLandslides(params?: LandslideQueryParams): Promise<GeoJSONFeatureCollection> {
  return fetchJSON('/api/v1/landslides', params as Record<string, string | number | undefined>);
}
