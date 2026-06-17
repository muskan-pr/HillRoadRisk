/**
 * HillRoadRisk — Detail Panel Component
 * 
 * Displays detailed information about a selected road segment, village, or historical landslide.
 */

import { useAppStore } from '../../stores/appStore';
import { translations, districtTranslations } from '../../utils/translations';

function getRiskBadgeClass(level: string | null): string {
  if (!level) return '';
  const map: Record<string, string> = {
    Safe: 'risk-badge--safe',
    Watch: 'risk-badge--watch',
    Warning: 'risk-badge--warning',
    Danger: 'risk-badge--danger',
    Low: 'risk-badge--safe',
    Medium: 'risk-badge--watch',
    High: 'risk-badge--warning',
    'Very High': 'risk-badge--danger',
  };
  return map[level] || '';
}

export default function DetailPanel() {
  const {
    selectedSegment,
    selectedVillage,
    selectedLandslide,
    setSelectedSegment,
    setSelectedVillage,
    setSelectedLandslide,
    language,
  } = useAppStore();

  const t = translations[language];
  const districts = districtTranslations[language];

  const isOpen = selectedSegment !== null || selectedVillage !== null || selectedLandslide !== null;

  const handleClose = () => {
    setSelectedSegment(null);
    setSelectedVillage(null);
    setSelectedLandslide(null);
  };

  const getTranslatedLevel = (level: string | null): string => {
    if (!level) return t.unknown;
    const cleanLevel = level.toLowerCase().replace(' ', '');
    if (cleanLevel === 'veryhigh') return t.veryHigh;
    return (t as any)[cleanLevel] || level;
  };

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`} id="detail-panel">
      {selectedSegment && (
        <>
          <div className="detail-panel__header">
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {selectedSegment.name || `${t.roadMetrics} #${selectedSegment.id}`}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {selectedSegment.road_ref && `${selectedSegment.road_ref} · `}
                {selectedSegment.highway_class} · {districts[selectedSegment.district || ''] || selectedSegment.district}
              </p>
            </div>
            <button className="detail-panel__close" onClick={handleClose} id="close-detail">
              ✕
            </button>
          </div>

          <div className="detail-panel__body">
            {/* Risk Badge */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <span
                className={`risk-badge ${getRiskBadgeClass(selectedSegment.susceptibility_level)}`}
              >
                ● {getTranslatedLevel(selectedSegment.susceptibility_level)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="stat-item">
                <div className="stat-item__label">{t.propLevel}</div>
                <div className="stat-item__value" style={{ fontSize: 'var(--text-base)' }}>
                  {getTranslatedLevel(selectedSegment.susceptibility_level)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propSlope}</div>
                <div className="stat-item__value">
                  {selectedSegment.slope_mean
                    ? `${selectedSegment.slope_mean.toFixed(1)}°`
                    : '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propElevation}</div>
                <div className="stat-item__value">
                  {selectedSegment.elevation_mean
                    ? `${selectedSegment.elevation_mean.toFixed(0)}m`
                    : '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propLength}</div>
                <div className="stat-item__value">
                  {selectedSegment.length_m
                    ? `${(selectedSegment.length_m / 1000).toFixed(1)}km`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Risk Score Bar */}
            {selectedSegment.susceptibility_score !== null && (
              <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  {t.propScore}
                </div>
                <div style={{ background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(selectedSegment.susceptibility_score ?? 0) * 100}%`,
                      height: '100%',
                      background: 'var(--gradient-risk)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  <span>{t.low}</span>
                  <span>{t.veryHigh}</span>
                </div>
              </div>
            )}

            {/* Dynamic Risk (Phase 2 placeholder) */}
            <div className="card" style={{ opacity: 0.5, marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                🔒 {t.dynamicRiskPlaceholder}
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {t.dynamicRiskDesc}
              </p>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 'var(--space-4)' }}>
              {t.disclaimer}
            </p>
          </div>
        </>
      )}

      {selectedVillage && (
        <>
          <div className="detail-panel__header">
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {selectedVillage.name}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {districts[selectedVillage.district || ''] || selectedVillage.district} · {language === 'hi' ? 'ग्राम' : 'Village'}
              </p>
            </div>
            <button className="detail-panel__close" onClick={handleClose} id="close-detail-village">
              ✕
            </button>
          </div>

          <div className="detail-panel__body">
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <span
                className={`risk-badge ${getRiskBadgeClass(selectedVillage.susceptibility_level)}`}
              >
                ● {getTranslatedLevel(selectedVillage.susceptibility_level)}
              </span>
            </div>

            <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="stat-item">
                <div className="stat-item__label">{t.propScore}</div>
                <div className="stat-item__value">
                  {selectedVillage.susceptibility_score
                    ? `${(selectedVillage.susceptibility_score * 100).toFixed(0)}%`
                    : '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propPopulation}</div>
                <div className="stat-item__value">
                  {selectedVillage.population?.toLocaleString() || '—'}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 'var(--space-4)' }}>
              {t.disclaimer}
            </p>
          </div>
        </>
      )}

      {selectedLandslide && (
        <>
          <div className="detail-panel__header">
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {selectedLandslide.location_name || `${t.landslideDetailsTitle} #${selectedLandslide.id}`}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {districts[selectedLandslide.district || ''] || selectedLandslide.district} · {t.historicalLandslides}
              </p>
            </div>
            <button className="detail-panel__close" onClick={handleClose} id="close-detail-landslide">
              ✕
            </button>
          </div>

          <div className="detail-panel__body">
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <span className="risk-badge risk-badge--danger">
                ● {language === 'hi' ? 'ऐतिहासिक घटना' : 'Historical Event'}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="stat-item">
                <div className="stat-item__label">{t.propEventDate}</div>
                <div className="stat-item__value" style={{ fontSize: 'var(--text-sm)' }}>
                  {selectedLandslide.event_date
                    ? new Date(selectedLandslide.event_date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : selectedLandslide.event_year || '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propFatalities}</div>
                <div className="stat-item__value">
                  {selectedLandslide.fatalities !== null && selectedLandslide.fatalities !== undefined
                    ? selectedLandslide.fatalities.toLocaleString()
                    : '0'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propTrigger}</div>
                <div className="stat-item__value" style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>
                  {selectedLandslide.trigger_type || '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-item__label">{t.propLandslideType}</div>
                <div className="stat-item__value" style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>
                  {selectedLandslide.landslide_type || '—'}
                </div>
              </div>
            </div>

            {selectedLandslide.description && (
              <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                  {t.propDescription}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                  {selectedLandslide.description}
                </p>
              </div>
            )}

            {selectedLandslide.source && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
                <span>{t.propSource}: {selectedLandslide.source}</span>
                {selectedLandslide.id && <span>ID: {selectedLandslide.id}</span>}
              </div>
            )}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 'var(--space-4)' }}>
              {t.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  );
}


