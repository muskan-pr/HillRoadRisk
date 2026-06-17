import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset filters and settings before each test
    const store = useAppStore.getState();
    store.resetFilters();
    store.setLanguage('en');
    store.setMapTheme('dark');
  });

  it('should initialize with default states', () => {
    const state = useAppStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.language).toBe('en');
    expect(state.mapTheme).toBe('dark');
    expect(state.filters.district).toBeNull();
    expect(state.filters.susceptibilityLevel).toBeNull();
    expect(state.filters.highwayClass).toBeNull();
  });

  it('should toggle sidebar', () => {
    const store = useAppStore.getState();
    expect(store.sidebarOpen).toBe(true);
    store.toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(false);
  });

  it('should update language settings', () => {
    const store = useAppStore.getState();
    expect(store.language).toBe('en');
    store.setLanguage('hi');
    expect(useAppStore.getState().language).toBe('hi');
  });

  it('should update theme settings', () => {
    const store = useAppStore.getState();
    expect(store.mapTheme).toBe('dark');
    store.setMapTheme('light');
    expect(useAppStore.getState().mapTheme).toBe('light');
  });

  it('should set and reset filters', () => {
    const store = useAppStore.getState();
    
    // Set filters
    store.setFilter('district', 'Chamoli');
    store.setFilter('susceptibilityLevel', 'High');
    store.setFilter('highwayClass', 'NH');
    
    let state = useAppStore.getState();
    expect(state.filters.district).toBe('Chamoli');
    expect(state.filters.susceptibilityLevel).toBe('High');
    expect(state.filters.highwayClass).toBe('NH');
    
    // Reset filters
    store.resetFilters();
    state = useAppStore.getState();
    expect(state.filters.district).toBeNull();
    expect(state.filters.susceptibilityLevel).toBeNull();
    expect(state.filters.highwayClass).toBeNull();
  });

  it('should toggle map layer visibility states', () => {
    const store = useAppStore.getState();
    expect(store.layers.historicalEvents).toBe(false);
    
    store.toggleLayer('historicalEvents');
    expect(useAppStore.getState().layers.historicalEvents).toBe(true);
  });

  it('should handle selectedLandslide state and clear segment/village selections', () => {
    const store = useAppStore.getState();
    
    // Default should be null
    expect(store.selectedLandslide).toBeNull();
    
    // Set mock landslide event
    const mockEvent = {
      id: 5,
      source: 'NASA',
      event_date: '2024-07-20',
      event_year: 2024,
      location_name: 'Nainital Highway',
      district: 'Nainital',
      description: 'Heavy rockslide',
      fatalities: 2,
      trigger_type: 'rainfall',
      landslide_type: 'rockslide'
    };
    
    store.setSelectedSegment({ id: 1 } as any);
    expect(useAppStore.getState().selectedSegment).not.toBeNull();
    
    store.setSelectedLandslide(mockEvent);
    
    const state = useAppStore.getState();
    expect(state.selectedLandslide).toEqual(mockEvent);
    // Setting landslide should clear segment and village
    expect(state.selectedSegment).toBeNull();
    expect(state.selectedVillage).toBeNull();
  });
});
