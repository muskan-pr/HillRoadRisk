/**
 * HillRoadRisk — Sidebar Component
 * 
 * Layer toggles, filters, legend, and summary stats.
 */

import { useAppStore } from '../../stores/appStore';
import { translations, districtTranslations } from '../../utils/translations';

const UTTARAKHAND_DISTRICTS = [
  'Chamoli',
  'Dehradun',
  'Pauri Garhwal',
  'Pithoragarh',
  'Rudraprayag',
  'Tehri Garhwal',
  'Uttarkashi',
  'Almora',
  'Bageshwar',
  'Champawat',
  'Haridwar',
  'Nainital',
  'Udham Singh Nagar',
];

export default function Sidebar() {
  const {
    sidebarOpen,
    layers,
    toggleLayer,
    filters,
    setFilter,
    resetFilters,
    language,
  } = useAppStore();

  const t = translations[language];
  const districts = districtTranslations[language];


  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`} id="sidebar">
      {/* Layers Section */}
      <div className="sidebar__section">
        <h3 className="sidebar__section-title">{t.mapLayers}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            className={`layer-toggle ${layers.riskOverlay ? 'active' : ''}`}
            onClick={() => toggleLayer('riskOverlay')}
            id="toggle-risk-overlay"
          >
            <span className="layer-toggle__indicator" />
            {t.riskOverlay}
          </button>
          <button
            className={`layer-toggle ${layers.roadNetwork ? 'active' : ''}`}
            onClick={() => toggleLayer('roadNetwork')}
            id="toggle-road-network"
          >
            <span className="layer-toggle__indicator" />
            {t.roadNetwork}
          </button>
          <button
            className={`layer-toggle ${layers.villages ? 'active' : ''}`}
            onClick={() => toggleLayer('villages')}
            id="toggle-villages"
          >
            <span className="layer-toggle__indicator" />
            {t.villages}
          </button>
          <button
            className={`layer-toggle ${layers.historicalEvents ? 'active' : ''}`}
            onClick={() => toggleLayer('historicalEvents')}
            id="toggle-historical"
          >
            <span className="layer-toggle__indicator" />
            {t.historicalLandslides}
          </button>
          <button
            className={`layer-toggle ${layers.rainfall ? 'active' : ''}`}
            onClick={() => toggleLayer('rainfall')}
            id="toggle-rainfall"
          >
            <span className="layer-toggle__indicator" />
            {t.rainfallPhase2}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sidebar__section">
        <h3 className="sidebar__section-title">{t.filters}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}
            >
              {t.district}
            </label>
            <select
              className="filter-select"
              value={filters.district || ''}
              onChange={(e) => setFilter('district', e.target.value || null)}
              id="filter-district"
            >
              <option value="">{t.allDistricts}</option>
              {UTTARAKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d}>{districts[d] || d}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}
            >
              {t.susceptibilityLevel}
            </label>
            <select
              className="filter-select"
              value={filters.susceptibilityLevel || ''}
              onChange={(e) =>
                setFilter('susceptibilityLevel', (e.target.value || null) as any)
              }
              id="filter-susceptibility"
            >
              <option value="">{t.allLevels}</option>
              <option value="Low">🟢 {t.low}</option>
              <option value="Medium">🟡 {t.medium}</option>
              <option value="High">🟠 {t.high}</option>
              <option value="Very High">🔴 {t.veryHigh}</option>
            </select>
          </div>

          <div>
            <label
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}
            >
              {t.roadType}
            </label>
            <select
              className="filter-select"
              value={filters.highwayClass || ''}
              onChange={(e) => setFilter('highwayClass', e.target.value || null)}
              id="filter-highway"
            >
              <option value="">{t.allRoads}</option>
              <option value="NH">{t.nationalHighway}</option>
              <option value="SH">{t.stateHighway}</option>
              <option value="district">{t.districtRoad}</option>
            </select>
          </div>

          <button
            className="btn btn--ghost"
            onClick={resetFilters}
            style={{ marginTop: 'var(--space-2)' }}
            id="reset-filters"
          >
            {t.resetFilters}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="sidebar__section">
        <h3 className="sidebar__section-title">{t.susceptibilityLegend}</h3>
        <div className="legend">
          <div className="legend__item">
            <span className="legend__color" style={{ background: '#22c55e' }} />
            {t.lowLegend}
          </div>
          <div className="legend__item">
            <span className="legend__color" style={{ background: '#eab308' }} />
            {t.mediumLegend}
          </div>
          <div className="legend__item">
            <span className="legend__color" style={{ background: '#f97316' }} />
            {t.highLegend}
          </div>
          <div className="legend__item">
            <span className="legend__color" style={{ background: '#ef4444' }} />
            {t.veryHighLegend}
          </div>
        </div>
      </div>

      {/* Data Attribution */}
      <div className="sidebar__section" style={{ borderBottom: 'none' }}>
        <h3 className="sidebar__section-title">{t.dataSources}</h3>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          <div>🗺️ {language === 'hi' ? 'मानचित्र' : 'Map'}: OpenFreeMap / OpenStreetMap</div>
          <div>🏔️ {language === 'hi' ? 'भूभाग' : 'DEM'}: SRTM / Copernicus</div>
          <div>🌧️ {language === 'hi' ? 'मौसम' : 'Weather'}: Open-Meteo</div>
          <div>📊 {language === 'hi' ? 'भूस्खलन' : 'Landslides'}: GSI / NDMA / NASA</div>
          <div style={{ marginTop: 'var(--space-2)', fontStyle: 'italic' }}>
            © OpenStreetMap contributors
          </div>
        </div>
      </div>
    </aside>
  );
}

