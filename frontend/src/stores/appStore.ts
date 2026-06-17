/**
 * HillRoadRisk — Zustand Store
 * 
 * Global state management for map layers, filters, and selected features.
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export interface SegmentProperties {
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
  slope_mean: number | null;
  elevation_mean: number | null;
}

export interface VillageProperties {
  id: number;
  name: string;
  district: string | null;
  population: number | null;
  susceptibility_score: number | null;
  susceptibility_level: string | null;
  risk_score: number | null;
  risk_level: string | null;
}

export interface LandslideProperties {
  id: number;
  source: string | null;
  event_date: string | null;
  event_year: number | null;
  location_name: string | null;
  district: string | null;
  description: string | null;
  fatalities: number | null;
  trigger_type: string | null;
  landslide_type: string | null;
}

export type RiskLevel = 'Safe' | 'Watch' | 'Warning' | 'Danger' | null;
export type SusceptibilityLevel = 'Low' | 'Medium' | 'High' | 'Very High' | null;

// ============================================
// Store State
// ============================================

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Map layers visibility
  layers: {
    riskOverlay: boolean;
    roadNetwork: boolean;
    villages: boolean;
    historicalEvents: boolean;
    rainfall: boolean;
  };
  toggleLayer: (layer: keyof AppState['layers']) => void;

  // Filters
  filters: {
    district: string | null;
    riskLevel: RiskLevel;
    susceptibilityLevel: SusceptibilityLevel;
    highwayClass: string | null;
  };
  setFilter: <K extends keyof AppState['filters']>(
    key: K,
    value: AppState['filters'][K]
  ) => void;
  resetFilters: () => void;

  // Selected feature (detail panel)
  selectedSegment: SegmentProperties | null;
  setSelectedSegment: (segment: SegmentProperties | null) => void;

  selectedVillage: VillageProperties | null;
  setSelectedVillage: (village: VillageProperties | null) => void;

  selectedLandslide: LandslideProperties | null;
  setSelectedLandslide: (landslide: LandslideProperties | null) => void;

  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  setMapView: (center: [number, number], zoom: number) => void;

  // Loading states
  isLoadingSegments: boolean;
  isLoadingVillages: boolean;
  setLoading: (key: 'isLoadingSegments' | 'isLoadingVillages', value: boolean) => void;

  // Language & Internationalization
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;

  // Day/Night Map Theme
  mapTheme: 'dark' | 'light';
  setMapTheme: (theme: 'dark' | 'light') => void;
}

// ============================================
// Default Filters
// ============================================

const defaultFilters: AppState['filters'] = {
  district: null,
  riskLevel: null,
  susceptibilityLevel: null,
  highwayClass: null,
};

// ============================================
// Store
// ============================================

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Layers
  layers: {
    riskOverlay: true,
    roadNetwork: true,
    villages: true,
    historicalEvents: false,
    rainfall: false,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  // Filters
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  // Selected features
  selectedSegment: null,
  setSelectedSegment: (segment) =>
    set({ selectedSegment: segment, selectedVillage: null, selectedLandslide: null }),

  selectedVillage: null,
  setSelectedVillage: (village) =>
    set({ selectedVillage: village, selectedSegment: null, selectedLandslide: null }),

  selectedLandslide: null,
  setSelectedLandslide: (landslide) =>
    set({ selectedLandslide: landslide, selectedSegment: null, selectedVillage: null }),

  // Map view — centered on Uttarakhand (Joshimath area)
  mapCenter: [79.5, 30.5],
  mapZoom: 8,
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),

  // Loading
  isLoadingSegments: false,
  isLoadingVillages: false,
  setLoading: (key, value) => set({ [key]: value }),

  // Language
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),

  // Theme
  mapTheme: 'dark',
  setMapTheme: (theme) => set({ mapTheme: theme }),
}));
