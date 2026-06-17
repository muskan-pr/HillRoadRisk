/**
 * HillRoadRisk — Header Component
 */

import { useAppStore } from '../../stores/appStore';
import { translations } from '../../utils/translations';

export default function Header() {
  const {
    toggleSidebar,
    sidebarOpen,
    language,
    setLanguage,
    mapTheme,
    setMapTheme,
  } = useAppStore();

  const t = translations[language];

  return (
    <header className="header" id="app-header">
      <div className="header__brand">
        <button
          onClick={toggleSidebar}
          className="btn btn--ghost"
          style={{ padding: '6px 10px', fontSize: '18px', lineHeight: 1 }}
          id="toggle-sidebar-btn"
          title={sidebarOpen ? t.collapseSidebar : t.expandSidebar}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <div className="header__logo">⛰</div>
        <h1 className="header__title">{t.brandName}</h1>
        <span className="header__subtitle">
          {t.subtitle}
        </span>
      </div>

      <div className="header__actions">
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
          className="header__phase-indicator"
        >
          {t.phaseIndicator}
        </span>

        {/* Day/Night Theme Toggle */}
        <button
          onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
          className="btn btn--ghost"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          id="theme-toggle-btn"
          title={mapTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {mapTheme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* Language Switcher */}
        <div className="language-selector" style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={() => setLanguage('en')}
            className={`btn ${language === 'en' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', minWidth: '40px' }}
            id="lang-en-btn"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`btn ${language === 'hi' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
            id="lang-hi-btn"
          >
            हिन्दी
          </button>
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost"
          style={{ fontSize: 'var(--text-xs)' }}
          id="api-docs-link"
        >
          {t.apiDocs}
        </a>
      </div>
    </header>
  );
}

