import { useEffect } from 'react';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MapView from './components/Map/MapView';
import DetailPanel from './components/DetailPanel/DetailPanel';
import { useAppStore } from './stores/appStore';
import { translations } from './utils/translations';
import './index.css';

function App() {
  const mapTheme = useAppStore((state) => state.mapTheme);
  const language = useAppStore((state) => state.language);
  
  const t = translations[language];

  // Apply global theme class
  useEffect(() => {
    if (mapTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [mapTheme]);

  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <MapView />
        <DetailPanel />
      </div>
      <div className="disclaimer" id="disclaimer">
        {t.disclaimer}
      </div>
    </>
  );
}

export default App;
