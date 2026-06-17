/**
 * HillRoadRisk — UI Translations
 * 
 * Dictionary containing English and Hindi translations for all dashboard components.
 */

export const translations = {
  en: {
    // Header
    brandName: 'HillRoadRisk',
    subtitle: 'Uttarakhand · Hyperlocal Landslide Risk',
    phaseIndicator: 'Phase 1 · Static Susceptibility',
    apiDocs: 'API Docs ↗',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',

    // Sidebar Sections
    mapLayers: 'Map Layers',
    filters: 'Filters',
    susceptibilityLegend: 'Susceptibility Legend',
    dataSources: 'Data Sources',

    // Layers
    riskOverlay: 'Risk Overlay',
    roadNetwork: 'Road Network',
    villages: 'Villages',
    historicalLandslides: 'Historical Landslides',
    rainfallPhase2: 'Rainfall (Phase 2)',

    // Filter Labels
    district: 'District',
    susceptibilityLevel: 'Susceptibility Level',
    roadType: 'Road Type',
    resetFilters: '✕ Reset Filters',

    // Filter Options
    allDistricts: 'All Districts',
    allLevels: 'All Levels',
    allRoads: 'All Roads',
    nationalHighway: 'National Highway (NH)',
    stateHighway: 'State Highway (SH)',
    districtRoad: 'District Road',

    // Legend Levels
    lowLegend: 'Low — Stable terrain',
    mediumLegend: 'Medium — Moderate slope/geology',
    highLegend: 'High — Steep, erosion-prone',
    veryHighLegend: 'Very High — Active landslide zone',

    // Detail Panel Header & Tabs
    detailsTitle: 'Details',
    segmentSusceptibility: 'Segment Susceptibility',
    villageSusceptibility: 'Village Susceptibility',
    terrainMetrics: 'Terrain Metrics',
    roadMetrics: 'Road Metrics',
    villageMetrics: 'Village Metrics',
    dynamicRiskPlaceholder: 'Phase 2: Live Forecast',
    dynamicRiskDesc: 'Forecast & dynamic risk alert system triggers during high rainfall periods (Phase 2).',

    // Properties
    propId: 'ID',
    propName: 'Name',
    propRoadRef: 'Road Ref',
    propHighwayClass: 'Highway Class',
    propLength: 'Length',
    propDistrict: 'District',
    propElevation: 'Mean Elevation',
    propSlope: 'Mean Slope',
    propScore: 'Susceptibility Score',
    propLevel: 'Susceptibility Level',
    propPopulation: 'Population',
    landslideDetailsTitle: 'Historical Landslide Event',
    propEventDate: 'Date of Event',
    propFatalities: 'Fatalities',
    propTrigger: 'Trigger Cause',
    propLandslideType: 'Landslide Type',
    propLocationName: 'Location Name',
    propDescription: 'Description',
    propSource: 'Data Source',

    // Disclaimer
    disclaimer: '⚠️ HillRoadRisk provides risk assessments for informational purposes only. Not a guarantee of safety. Always follow official advisories.',
    
    // Levels
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    veryHigh: 'Very High',
    unknown: 'Unknown',
  },
  hi: {
    // Header
    brandName: 'हिलरोडरिस्क (HillRoadRisk)',
    subtitle: 'उत्तराखंड · अति-स्थानीय भूस्खलन जोखिम',
    phaseIndicator: 'चरण १ · स्थिर संवेदनशीलता',
    apiDocs: 'एपीआई डॉक्स ↗',
    collapseSidebar: 'साइडबार बंद करें',
    expandSidebar: 'साइडबार खोलें',

    // Sidebar Sections
    mapLayers: 'मानचित्र परतें',
    filters: 'फ़िल्टर',
    susceptibilityLegend: 'संवेदनशीलता सूची (संकेत)',
    dataSources: 'डेटा स्रोत',

    // Layers
    riskOverlay: 'जोखिम ओवरले',
    roadNetwork: 'सड़क नेटवर्क',
    villages: 'गाँव',
    historicalLandslides: 'ऐतिहासिक भूस्खलन',
    rainfallPhase2: 'वर्षा (चरण २)',

    // Filter Labels
    district: 'जिला',
    susceptibilityLevel: 'संवेदनशीलता स्तर',
    roadType: 'सड़क का प्रकार',
    resetFilters: '✕ फ़िल्टर रीसेट करें',

    // Filter Options
    allDistricts: 'सभी जिले',
    allLevels: 'सभी स्तर',
    allRoads: 'सभी सड़कें',
    nationalHighway: 'राष्ट्रीय राजमार्ग (NH)',
    stateHighway: 'राज्य राजमार्ग (SH)',
    districtRoad: 'जिला सड़क',

    // Legend Levels
    lowLegend: 'कम — स्थिर भूमि (हरा)',
    mediumLegend: 'मध्यम — सामान्य ढलान / भूविज्ञान (पीला)',
    highLegend: 'उच्च — खड़ी ढलान, क्षरण-संवेदनशील (नारंगी)',
    veryHighLegend: 'अत्यधिक उच्च — सक्रिय भूस्खलन क्षेत्र (लाल)',

    // Detail Panel Header & Tabs
    detailsTitle: 'विवरण',
    segmentSusceptibility: 'सड़क खंड संवेदनशीलता',
    villageSusceptibility: 'गाँव संवेदनशीलता',
    terrainMetrics: 'भूभाग मीट्रिक',
    roadMetrics: 'सड़क मीट्रिक',
    villageMetrics: 'ग्राम मीट्रिक',
    dynamicRiskPlaceholder: 'चरण २: लाइव पूर्वानुमान',
    dynamicRiskDesc: 'अत्यधिक वर्षा की अवधि के दौरान पूर्वानुमान और गतिशील जोखिम चेतावनी प्रणाली काम करेगी (चरण २)।',

    // Properties
    propId: 'आईडी',
    propName: 'नाम',
    propRoadRef: 'सड़क संदर्भ',
    propHighwayClass: 'राजमार्ग वर्ग',
    propLength: 'लंबाई',
    propDistrict: 'जिला',
    propElevation: 'औसत ऊंचाई',
    propSlope: 'औसत ढलान',
    propScore: 'संवेदनशीलता स्कोर',
    propLevel: 'संवेदनशीलता स्तर',
    propPopulation: 'जनसंख्या',
    landslideDetailsTitle: 'ऐतिहासिक भूस्खलन घटना',
    propEventDate: 'घटना की तारीख',
    propFatalities: 'हतहत (मृत्यु)',
    propTrigger: 'ट्रिगर का कारण',
    propLandslideType: 'भूस्खलन का प्रकार',
    propLocationName: 'स्थान का नाम',
    propDescription: 'विवरण',
    propSource: 'डेटा स्रोत',

    // Disclaimer
    disclaimer: '⚠️ हिलरोडरिस्क (HillRoadRisk) केवल सूचनात्मक उद्देश्यों के लिए जोखिम मूल्यांकन प्रदान करता है। सुरक्षा की गारंटी नहीं है। हमेशा आधिकारिक सलाह का पालन करें।',
    
    // Levels
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    veryHigh: 'अत्यधिक उच्च',
    unknown: 'अज्ञात',
  },
};

export const districtTranslations = {
  en: {
    'Chamoli': 'Chamoli',
    'Dehradun': 'Dehradun',
    'Pauri Garhwal': 'Pauri Garhwal',
    'Pithoragarh': 'Pithoragarh',
    'Rudraprayag': 'Rudraprayag',
    'Tehri Garhwal': 'Tehri Garhwal',
    'Uttarkashi': 'Uttarkashi',
    'Almora': 'Almora',
    'Bageshwar': 'Bageshwar',
    'Champawat': 'Champawat',
    'Haridwar': 'Haridwar',
    'Nainital': 'Nainital',
    'Udham Singh Nagar': 'Udham Singh Nagar',
  },
  hi: {
    'Chamoli': 'चमोली',
    'Dehradun': 'देहरादून',
    'Pauri Garhwal': 'पौड़ी गढ़वाल',
    'Pithoragarh': 'पिथौरागढ़',
    'Rudraprayag': 'रुद्रप्रयाग',
    'Tehri Garhwal': 'टिहरी गढ़वाल',
    'Uttarkashi': 'उत्तरकाशी',
    'Almora': 'अल्मोड़ा',
    'Bageshwar': 'बागेश्वर',
    'Champawat': 'चंपावत',
    'Haridwar': 'हरिद्वार',
    'Nainital': 'नैनीताल',
    'Udham Singh Nagar': 'ऊधम सिंह नगर',
  }
};

export type Language = 'en' | 'hi';
export const getTranslation = (lang: Language) => translations[lang];
