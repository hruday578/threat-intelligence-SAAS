import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, ZoomControl, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTRIES } from './data/countries';

// ── THREAT LEVEL CONSTANTS ─────────────────────────────────────────────────
const THREAT_LEVEL = {
  RED:    { label: 'RED ALERT',   color: 'rgba(220,38,38,0.55)',  border: '#dc2626', emoji: '●' },
  YELLOW: { label: 'YELLOW ALERT',color: 'rgba(234,179,8,0.45)', border: '#ca8a04', emoji: '●' },
  GREEN:  { label: 'ALL CLEAR',   color: 'rgba(34,197,94,0.3)',  border: '#16a34a', emoji: '●' },
};

// ── COUNTRY NAME EXTRACTOR ─────────────────────────────────────────────────
// Tries to derive a standardised country name from an AI region string like
// "Manila, Philippines" or "Southern Philippines" → "Philippines"
function extractCountry(region) {
  if (!region || region.toLowerCase() === 'global') return null;
  const parts = region.split(',').map(p => p.trim()).reverse(); // Last token first
  for (const part of parts) {
    const match = COUNTRIES.find(c =>
      c.name.toLowerCase() === part.toLowerCase() ||
      (c.name.toLowerCase().includes(part.toLowerCase()) && part.length > 4)
    );
    if (match) return match.name;
  }
  // Fallback: check if any country name is contained anywhere in the region string
  const regionLower = region.toLowerCase();
  const fuzzy = COUNTRIES.find(c => regionLower.includes(c.name.toLowerCase()) && c.name.length > 3);
  return fuzzy ? fuzzy.name : null;
}

// ── CHOROPLETH LAYER ──────────────────────────────────────────────────────
function ChoroplethLayer({ countryThreatLevels, onCountryClick }) {
  const [geoData, setGeoData] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const map = useMap();
  const geoDataRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (geoDataRef.current) { setGeoData(geoDataRef.current); return; }
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(data => { geoDataRef.current = data; setGeoData(data); })
      .catch(e => console.warn('[Choropleth] Failed to load GeoJSON:', e));
  }, []);

  // GeoJSON uses different country name variants than our COUNTRIES list
  // Map GeoJSON ADMIN field values → our standardised COUNTRIES names
  const GEO_NAME_ALIAS = {
    'United States of America': 'United States',
    'Republic of Korea': 'South Korea',
    'Democratic Republic of the Congo': 'Congo (Democratic Republic)',
    'Republic of the Congo': 'Congo (Congo-Brazzaville)',
    "Côte d'Ivoire": 'Ivory Coast',
    'Czech Republic': 'Czechia (Czech Republic)',
    'Czechia': 'Czechia (Czech Republic)',
    'Republic of Serbia': 'Serbia',
    'United Republic of Tanzania': 'Tanzania',
    'Lao PDR': 'Laos',
    'Palestinian Territory': 'Palestine State',
    'Palestine': 'Palestine State',
    'Taiwan': 'Taiwan',
    'Somaliland': 'Somalia',
    'South Korea': 'South Korea',
    'North Korea': 'North Korea',
    'Russia': 'Russia',
    'Iran (Islamic Republic of)': 'Iran',
    'Syrian Arab Republic': 'Syria',
    'Viet Nam': 'Vietnam',
    'Bolivia (Plurinational State of)': 'Bolivia',
    'Venezuela (Bolivarian Republic of)': 'Venezuela',
    'Tanzania, United Republic of': 'Tanzania',
    'Myanmar': 'Myanmar',
    'United Arab Emirates': 'United Arab Emirates',
  };

  const resolveGeoName = (rawName) => GEO_NAME_ALIAS[rawName] || rawName;

  const styleFeature = useCallback((feature) => {
    const rawName = feature.properties.ADMIN || feature.properties.name || '';
    const name = resolveGeoName(rawName);
    const level = countryThreatLevels[name];
    if (!level) return { fillOpacity: 0, weight: 0.4, color: '#334155', opacity: 0.3 };
    const cfg = THREAT_LEVEL[level];
    return {
      fillColor: cfg.color,
      fillOpacity: 1,
      weight: 1.5,
      color: cfg.border,
      opacity: 0.9,
    };
  }, [countryThreatLevels]);

  const onEachFeature = useCallback((feature, layer) => {
    const rawName = feature.properties.ADMIN || feature.properties.name || '';
    const name = resolveGeoName(rawName);
    const level = countryThreatLevels[name];
    layer.on({
      mouseover(e) {
        if (level) {
          layer.setStyle({ fillOpacity: level ? 1 : 0, weight: 2.5 });
          const pt = e.containerPoint;
          setTooltip({ name, level, x: pt.x, y: pt.y });
        }
      },
      mousemove(e) {
        const pt = e.containerPoint;
        setTooltip(prev => prev ? { ...prev, x: pt.x, y: pt.y } : null);
      },
      mouseout() {
        layer.setStyle(styleFeature(feature));
        setTooltip(null);
      },
      click() {
        if (level && onCountryClick) onCountryClick(name);
      }
    });
  }, [countryThreatLevels, styleFeature, onCountryClick]);

  if (!geoData) return null;
  return (
    <>
      <GeoJSON
        key={JSON.stringify(countryThreatLevels)}
        data={geoData}
        style={styleFeature}
        onEachFeature={onEachFeature}
      />
      {tooltip && (
        <div
          style={{
            position: 'absolute', left: tooltip.x + 14, top: tooltip.y - 10,
            background: 'rgba(15,23,42,0.95)', border: `1px solid ${THREAT_LEVEL[tooltip.level].border}`,
            borderRadius: '8px', padding: '8px 12px', zIndex: 9999,
            pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            fontSize: '11px', color: '#f1f5f9', whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: '900', fontSize: '12px', marginBottom: '3px' }}>{tooltip.name}</div>
          <div style={{ color: THREAT_LEVEL[tooltip.level].border, fontWeight: '800', letterSpacing: '0.05em' }}>
            {THREAT_LEVEL[tooltip.level].emoji} {THREAT_LEVEL[tooltip.level].label}
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>Click to filter threats</div>
        </div>
      )}
    </>
  );
}

// --- MOCK LIVE THREAT TEMPLATES FOR SIMULATION ---
const MOCK_LIVE_FEED_TEMPLATES = [
  { title: "Severe 7.2 Magnitude Earthquake Strikes Tokyo Region", ai: { classification: "ALERT", hazard: "Earthquake", region: "Tokyo", urgency: "HIGH", reasoning: "Major tectonic movement detected. Heavy shaking in Tokyo metro area." } },
  { title: "Critical Infrastructure Cyber Incident Hits Frankfurt Grid", ai: { classification: "ALERT", hazard: "Cyberattack", region: "Frankfurt", urgency: "HIGH", reasoning: "Ransomware vector compromised substation systems." } },
  { title: "Chemical Refinery Explosion Triggers Evacuation in Houston", ai: { classification: "ALERT", hazard: "Industrial Fire", region: "Houston", urgency: "HIGH", reasoning: "Hazardous fumes spreading north. Shelter-in-place active." } },
  { title: "Severe Flash Flooding Submerges Sydney Subway Network", ai: { classification: "ALERT", hazard: "Flooding", region: "Sydney", urgency: "HIGH", reasoning: "Record torrential rainfall over 4 hours." } },
  { title: "Wildfire Outbreak Threatens Residential Zones in Cape Town", ai: { classification: "ALERT", hazard: "Wildfire", region: "Cape Town", urgency: "HIGH", reasoning: "Strong winds driving flames towards southern suburbs." } },
  { title: "Tropical Cyclone Warnings Issued for Mumbai Coastal Areas", ai: { classification: "ALERT", hazard: "Cyclone", region: "Mumbai", urgency: "HIGH", reasoning: "Storm surge expected to inundate low-lying regions." } },
  { title: "Local Water Contamination Reported in London Financial District", ai: { classification: "INFORMATIVE", hazard: "Water Quality", region: "London", urgency: "LOW", reasoning: "E. Coli trace detected. Boiling notice advisory." } },
];

const CITY_COORDINATES = {
  // Mock feed cities
  "Tokyo": { lat: 35.6762, lon: 139.6503 },
  "Frankfurt": { lat: 50.1109, lon: 8.6821 },
  "Houston": { lat: 29.7604, lon: -95.3698 },
  "Sydney": { lat: -33.8688, lon: 151.2093 },
  "Cape Town": { lat: -33.9249, lon: 18.4241 },
  "Mumbai": { lat: 19.0760, lon: 72.8777 },
  "London": { lat: 51.5074, lon: -0.1278 },
  "Bangalore": { lat: 12.9716, lon: 77.5946 },
  "New York": { lat: 40.7128, lon: -74.0060 },
  "San Francisco": { lat: 37.7749, lon: -122.4194 },
  "California": { lat: 36.7783, lon: -119.4179 },
  "Karnataka": { lat: 15.3173, lon: 75.7139 },

  // ── Asia-Pacific ────────────────────────────────────────────────────────────
  "Philippines": { lat: 14.5995, lon: 120.9842 }, // Manila
  "Manila": { lat: 14.5995, lon: 120.9842 },
  "Mindanao": { lat: 7.0731, lon: 125.6128 }, // Davao City
  "Davao": { lat: 7.0707, lon: 125.6087 },
  "Cebu": { lat: 10.3157, lon: 123.8854 },
  "General Santos": { lat: 6.1164, lon: 125.1716 },
  "Leyte": { lat: 11.0000, lon: 124.8333 },
  "Luzon": { lat: 14.6760, lon: 121.0437 },
  "Visayas": { lat: 10.3160, lon: 123.8854 },
  "Quezon City": { lat: 14.6760, lon: 121.0437 },
  "Southern Philippines": { lat: 6.9214, lon: 122.0790 },
  "Northern Philippines": { lat: 18.1987, lon: 120.5960 },
  "Japan": { lat: 35.6762, lon: 139.6503 }, // Tokyo
  "Osaka": { lat: 34.6937, lon: 135.5023 },
  "Nagoya": { lat: 35.1815, lon: 136.9066 },
  "Hiroshima": { lat: 34.3853, lon: 132.4553 },
  "Fukuoka": { lat: 33.5902, lon: 130.4017 },
  "Sapporo": { lat: 43.0618, lon: 141.3545 },
  "China": { lat: 39.9042, lon: 116.4074 }, // Beijing
  "Beijing": { lat: 39.9042, lon: 116.4074 },
  "Shanghai": { lat: 31.2304, lon: 121.4737 },
  "Guangzhou": { lat: 23.1291, lon: 113.2644 },
  "Shenzhen": { lat: 22.5431, lon: 114.0579 },
  "Chengdu": { lat: 30.5728, lon: 104.0668 },
  "Wuhan": { lat: 30.5928, lon: 114.3055 },
  "India": { lat: 28.6139, lon: 77.2090 }, // New Delhi
  "New Delhi": { lat: 28.6139, lon: 77.2090 },
  "Delhi": { lat: 28.6139, lon: 77.2090 },
  "Chennai": { lat: 13.0827, lon: 80.2707 },
  "Kolkata": { lat: 22.5726, lon: 88.3639 },
  "Hyderabad": { lat: 17.3850, lon: 78.4867 },
  "Pune": { lat: 18.5204, lon: 73.8567 },
  "Khadakwasla": { lat: 18.4414, lon: 73.7661 },
  "khadakwasla": { lat: 18.4414, lon: 73.7661 },
  "Khadakwasla Dam": { lat: 18.4414, lon: 73.7661 },
  "Pimpri-Chinchwad": { lat: 18.6298, lon: 73.7997 },
  "Pimpri Chinchwad": { lat: 18.6298, lon: 73.7997 },
  "Pimpri": { lat: 18.6298, lon: 73.7997 },
  "pimpri": { lat: 18.6298, lon: 73.7997 },
  "Chinchwad": { lat: 18.6278, lon: 73.7915 },
  "Hinjewadi": { lat: 18.5912, lon: 73.7389 },
  "Kothrud": { lat: 18.5074, lon: 73.8077 },
  "Viman Nagar": { lat: 18.5679, lon: 73.9143 },
  "Ahmedabad": { lat: 23.0225, lon: 72.5714 },
  "Jaipur": { lat: 26.9124, lon: 75.7873 },
  "Lucknow": { lat: 26.8467, lon: 80.9462 },
  "Maharashtra": { lat: 19.0760, lon: 72.8777 },
  "Dadar": { lat: 19.0178, lon: 72.8478 },
  "dadar": { lat: 19.0178, lon: 72.8478 },
  "Gujarat": { lat: 23.0225, lon: 72.5714 },
  "Rajasthan": { lat: 26.9124, lon: 75.7873 },
  "Tamil Nadu": { lat: 13.0827, lon: 80.2707 },
  "West Bengal": { lat: 22.5726, lon: 88.3639 },
  "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
  "Odisha": { lat: 20.9517, lon: 85.0985 },
  "odisha": { lat: 20.9517, lon: 85.0985 },
  "Orissa": { lat: 20.9517, lon: 85.0985 },
  "Bhubaneswar": { lat: 20.2961, lon: 85.8245 },
  "Cuttack": { lat: 20.4625, lon: 85.8830 },
  "Puri": { lat: 19.8135, lon: 85.8312 },
  "Rourkela": { lat: 22.2604, lon: 84.8536 },
  "Berhampur": { lat: 19.3150, lon: 84.7941 },
  "Sambalpur": { lat: 21.4669, lon: 83.9756 },
  "Balasore": { lat: 21.4942, lon: 86.9327 },
  "Baleshwar": { lat: 21.4942, lon: 86.9327 },
  "Baleswar": { lat: 21.4942, lon: 86.9327 },
  "Mayurbhanj": { lat: 21.9333, lon: 86.7333 },
  "Koraput": { lat: 18.8143, lon: 82.7108 },
  "Kendrapara": { lat: 20.5012, lon: 86.4223 },
  "Jagatsinghpur": { lat: 20.2578, lon: 86.1701 },
  "Bhadrak": { lat: 21.0544, lon: 86.4998 },
  "Kendujhar": { lat: 21.6284, lon: 85.5816 },
  "Keonjhar": { lat: 21.6284, lon: 85.5816 },
  "Ganjam": { lat: 19.3867, lon: 84.9925 },
  "Khordha": { lat: 20.1824, lon: 85.6152 },
  "Nayagarh": { lat: 20.1281, lon: 85.0991 },
  "Dhenkanal": { lat: 20.6592, lon: 85.5980 },
  "Kalahandi": { lat: 19.9165, lon: 83.1685 },
  "Bolangir": { lat: 20.7153, lon: 83.4875 },
  "Sonepur": { lat: 20.8350, lon: 83.9165 },
  "Kalingatv": { lat: 20.9517, lon: 85.0985 },
  "Kalingatnagar": { lat: 21.4500, lon: 85.9500 },
  "Angul": { lat: 20.8400, lon: 85.1010 },
  "Barbil": { lat: 22.1031, lon: 85.3814 },
  "Paradip": { lat: 20.3168, lon: 86.6117 },
  "Bay of Bengal": { lat: 15.0000, lon: 88.0000 },

  // ── Kerala State, Districts, Towns & Disaster Hotspots ────────────────────
  "Kerala": { lat: 10.8505, lon: 76.2711 },
  "kerala": { lat: 10.8505, lon: 76.2711 },
  "Pathanamthitta": { lat: 9.2648, lon: 76.7870 },
  "pathanamthitta": { lat: 9.2648, lon: 76.7870 },
  "Wayanad": { lat: 11.6854, lon: 76.1320 },
  "wayanad": { lat: 11.6854, lon: 76.1320 },
  "Thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "Trivandrum": { lat: 8.5241, lon: 76.9366 },
  "trivandrum": { lat: 8.5241, lon: 76.9366 },
  "Kochi": { lat: 9.9312, lon: 76.2673 },
  "kochi": { lat: 9.9312, lon: 76.2673 },
  "Cochin": { lat: 9.9312, lon: 76.2673 },
  "cochin": { lat: 9.9312, lon: 76.2673 },
  "Ernakulam": { lat: 9.9816, lon: 76.2999 },
  "ernakulam": { lat: 9.9816, lon: 76.2999 },
  "Kozhikode": { lat: 11.2588, lon: 75.7804 },
  "kozhikode": { lat: 11.2588, lon: 75.7804 },
  "Calicut": { lat: 11.2588, lon: 75.7804 },
  "calicut": { lat: 11.2588, lon: 75.7804 },
  "Thrissur": { lat: 10.5276, lon: 76.2144 },
  "thrissur": { lat: 10.5276, lon: 76.2144 },
  "Trichur": { lat: 10.5276, lon: 76.2144 },
  "Palakkad": { lat: 10.7867, lon: 76.6548 },
  "palakkad": { lat: 10.7867, lon: 76.6548 },
  "Palghat": { lat: 10.7867, lon: 76.6548 },
  "Kollam": { lat: 8.8932, lon: 76.6141 },
  "kollam": { lat: 8.8932, lon: 76.6141 },
  "Quilon": { lat: 8.8932, lon: 76.6141 },
  "Alappuzha": { lat: 9.4981, lon: 76.3388 },
  "alappuzha": { lat: 9.4981, lon: 76.3388 },
  "Alleppey": { lat: 9.4981, lon: 76.3388 },
  "alleppey": { lat: 9.4981, lon: 76.3388 },
  "Idukki": { lat: 9.8497, lon: 76.9806 },
  "idukki": { lat: 9.8497, lon: 76.9806 },
  "Kottayam": { lat: 9.5916, lon: 76.5222 },
  "kottayam": { lat: 9.5916, lon: 76.5222 },
  "Malappuram": { lat: 11.0732, lon: 76.0740 },
  "malappuram": { lat: 11.0732, lon: 76.0740 },
  "Kannur": { lat: 11.8745, lon: 75.3704 },
  "kannur": { lat: 11.8745, lon: 75.3704 },
  "Kasaragod": { lat: 12.5102, lon: 74.9852 },
  "kasaragod": { lat: 12.5102, lon: 74.9852 },
  "Munnar": { lat: 10.0889, lon: 77.0595 },
  "munnar": { lat: 10.0889, lon: 77.0595 },
  "Sabarimala": { lat: 9.4344, lon: 77.0814 },
  "sabarimala": { lat: 9.4344, lon: 77.0814 },
  "Pamba": { lat: 9.4100, lon: 77.0700 },
  "pamba": { lat: 9.4100, lon: 77.0700 },
  "Vythiri": { lat: 11.5516, lon: 76.0384 },
  "vythiri": { lat: 11.5516, lon: 76.0384 },
  "Meppadi": { lat: 11.5516, lon: 76.1264 },
  "meppadi": { lat: 11.5516, lon: 76.1264 },
  "Chooralmala": { lat: 11.5175, lon: 76.1603 },
  "chooralmala": { lat: 11.5175, lon: 76.1603 },
  "Mundakkai": { lat: 11.5030, lon: 76.1730 },
  "mundakkai": { lat: 11.5030, lon: 76.1730 },
  "Kuttanad": { lat: 9.4200, lon: 76.4000 },
  "kuttanad": { lat: 9.4200, lon: 76.4000 },
  "Varkala": { lat: 8.7379, lon: 76.7163 },
  "varkala": { lat: 8.7379, lon: 76.7163 },
  "Guruvayur": { lat: 10.5946, lon: 76.0409 },
  "guruvayur": { lat: 10.5946, lon: 76.0409 },
  "Adoor": { lat: 9.1558, lon: 76.7327 },
  "adoor": { lat: 9.1558, lon: 76.7327 },
  "Tiruvalla": { lat: 9.3833, lon: 76.5750 },
  "Thiruvalla": { lat: 9.3833, lon: 76.5750 },
  "Ranni": { lat: 9.3800, lon: 76.8100 },
  "ranni": { lat: 9.3800, lon: 76.8100 },
  "Konni": { lat: 9.2439, lon: 76.8488 },
  "konni": { lat: 9.2439, lon: 76.8488 },
  "Pandalam": { lat: 9.2319, lon: 76.6789 },
  "pandalam": { lat: 9.2319, lon: 76.6789 },
  "Chengannur": { lat: 9.3175, lon: 76.6111 },
  "chengannur": { lat: 9.3175, lon: 76.6111 },
  "Changanassery": { lat: 9.4475, lon: 76.5372 },
  "changanassery": { lat: 9.4475, lon: 76.5372 },
  "Vaikom": { lat: 9.7497, lon: 76.3970 },
  "vaikom": { lat: 9.7497, lon: 76.3970 },
  "Pala": { lat: 9.7119, lon: 76.6844 },
  "pala": { lat: 9.7119, lon: 76.6844 },
  "Kanjirappally": { lat: 9.5578, lon: 76.7878 },
  "kanjirappally": { lat: 9.5578, lon: 76.7878 },
  "Peerumade": { lat: 9.5786, lon: 76.9692 },
  "Kumily": { lat: 9.6053, lon: 77.1658 },
  "kumily": { lat: 9.6053, lon: 77.1658 },
  "Devikulam": { lat: 10.0632, lon: 77.1060 },
  "Attingal": { lat: 8.6960, lon: 76.8143 },
  "Neyyattinkara": { lat: 8.4009, lon: 77.0862 },
  "Nedumangad": { lat: 8.6019, lon: 76.9961 },
  "Indonesia": { lat: -6.2088, lon: 106.8456 }, // Jakarta
  "Jakarta": { lat: -6.2088, lon: 106.8456 },
  "Bali": { lat: -8.3405, lon: 115.0919 },
  "Surabaya": { lat: -7.2575, lon: 112.7521 },
  "Bandung": { lat: -6.9147, lon: 107.6098 },
  "Papua": { lat: -4.2699, lon: 138.0804 },
  "Malaysia": { lat: 3.1390, lon: 101.6869 }, // Kuala Lumpur
  "Kuala Lumpur": { lat: 3.1390, lon: 101.6869 },
  "Thailand": { lat: 13.7563, lon: 100.5018 }, // Bangkok
  "Bangkok": { lat: 13.7563, lon: 100.5018 },
  "Vietnam": { lat: 21.0285, lon: 105.8542 }, // Hanoi
  "Hanoi": { lat: 21.0285, lon: 105.8542 },
  "Ho Chi Minh City": { lat: 10.8231, lon: 106.6297 },
  "Myanmar": { lat: 16.8661, lon: 96.1951 },
  "Cambodia": { lat: 11.5564, lon: 104.9282 },
  "Laos": { lat: 17.9757, lon: 102.6331 },
  "Singapore": { lat: 1.3521, lon: 103.8198 },
  "South Korea": { lat: 37.5665, lon: 126.9780 }, // Seoul
  "Seoul": { lat: 37.5665, lon: 126.9780 },
  "Busan": { lat: 35.1796, lon: 129.0756 },
  "North Korea": { lat: 39.0392, lon: 125.7625 },
  "Taiwan": { lat: 25.0330, lon: 121.5654 }, // Taipei
  "Taipei": { lat: 25.0330, lon: 121.5654 },
  "Hong Kong": { lat: 22.3193, lon: 114.1694 },
  "Pakistan": { lat: 33.6844, lon: 73.0479 }, // Islamabad
  "Islamabad": { lat: 33.6844, lon: 73.0479 },
  "Karachi": { lat: 24.8607, lon: 67.0011 },
  "Lahore": { lat: 31.5204, lon: 74.3587 },
  "Bangladesh": { lat: 23.8103, lon: 90.4125 }, // Dhaka
  "Dhaka": { lat: 23.8103, lon: 90.4125 },
  "Sri Lanka": { lat: 6.9271, lon: 79.8612 },
  "Nepal": { lat: 27.7172, lon: 85.3240 },
  "Afghanistan": { lat: 34.5553, lon: 69.2075 },
  "Australia": { lat: -33.8688, lon: 151.2093 }, // Sydney
  "Melbourne": { lat: -37.8136, lon: 144.9631 },
  "Brisbane": { lat: -27.4698, lon: 153.0251 },
  "Perth": { lat: -31.9505, lon: 115.8605 },
  "New Zealand": { lat: -36.8485, lon: 174.7633 },
  "Papua New Guinea": { lat: -9.4438, lon: 147.1803 },

  // ── Middle East ─────────────────────────────────────────────────────────────
  "Saudi Arabia": { lat: 24.7136, lon: 46.6753 }, // Riyadh
  "Riyadh": { lat: 24.7136, lon: 46.6753 },
  "UAE": { lat: 24.4539, lon: 54.3773 }, // Abu Dhabi
  "Dubai": { lat: 25.2048, lon: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lon: 54.3773 },
  "Qatar": { lat: 25.2854, lon: 51.5310 },
  "Kuwait": { lat: 29.3759, lon: 47.9774 },
  "Bahrain": { lat: 26.2235, lon: 50.5876 },
  "Oman": { lat: 23.5859, lon: 58.4059 },
  "Iran": { lat: 35.6892, lon: 51.3890 }, // Tehran
  "Tehran": { lat: 35.6892, lon: 51.3890 },
  "Iraq": { lat: 33.3152, lon: 44.3661 }, // Baghdad
  "Baghdad": { lat: 33.3152, lon: 44.3661 },
  "Syria": { lat: 33.5138, lon: 36.2765 },
  "Lebanon": { lat: 33.8938, lon: 35.5018 },
  "Israel": { lat: 31.7683, lon: 35.2137 },
  "Palestine": { lat: 31.9522, lon: 35.2332 },
  "Gaza": { lat: 31.5017, lon: 34.4674 },
  "West Bank": { lat: 31.9522, lon: 35.2332 },
  "Jordan": { lat: 31.9539, lon: 35.9106 },
  "Yemen": { lat: 15.3694, lon: 44.1910 },
  "Turkey": { lat: 39.9334, lon: 32.8597 }, // Ankara
  "Ankara": { lat: 39.9334, lon: 32.8597 },
  "Istanbul": { lat: 41.0082, lon: 28.9784 },

  // ── Africa ───────────────────────────────────────────────────────────────────
  "Nigeria": { lat: 9.0765, lon: 7.3986 }, // Abuja
  "Lagos": { lat: 6.5244, lon: 3.3792 },
  "South Africa": { lat: -25.7461, lon: 28.1881 }, // Pretoria
  "Johannesburg": { lat: -26.2041, lon: 28.0473 },
  "Kenya": { lat: -1.2921, lon: 36.8219 }, // Nairobi
  "Nairobi": { lat: -1.2921, lon: 36.8219 },
  "Ethiopia": { lat: 9.0320, lon: 38.7469 },
  "Egypt": { lat: 30.0444, lon: 31.2357 }, // Cairo
  "Cairo": { lat: 30.0444, lon: 31.2357 },
  "Morocco": { lat: 33.9716, lon: -6.8498 },
  "Tunisia": { lat: 36.8189, lon: 10.1658 },
  "Algeria": { lat: 36.7372, lon: 3.0865 },
  "Libya": { lat: 32.9044, lon: 13.1799 },
  "Sudan": { lat: 15.5007, lon: 32.5599 },
  "Ghana": { lat: 5.6037, lon: -0.1870 },
  "Tanzania": { lat: -6.7924, lon: 39.2083 },
  "Uganda": { lat: 0.3476, lon: 32.5825 },
  "Rwanda": { lat: -1.9441, lon: 30.0619 },
  "Zimbabwe": { lat: -17.8252, lon: 31.0335 },
  "Mozambique": { lat: -25.9655, lon: 32.5832 },
  "Congo": { lat: -4.3217, lon: 15.3222 },
  "DRC": { lat: -4.3217, lon: 15.3222 },
  "Somalia": { lat: 2.0469, lon: 45.3182 },
  "Mali": { lat: 12.6392, lon: -8.0029 },
  "Cameroon": { lat: 3.8480, lon: 11.5021 },
  "Senegal": { lat: 14.7167, lon: -17.4677 },

  // ── Europe ──────────────────────────────────────────────────────────────────
  "France": { lat: 48.8566, lon: 2.3522 }, // Paris
  "Paris": { lat: 48.8566, lon: 2.3522 },
  "Germany": { lat: 52.5200, lon: 13.4050 }, // Berlin
  "Berlin": { lat: 52.5200, lon: 13.4050 },
  "Munich": { lat: 48.1351, lon: 11.5820 },
  "Hamburg": { lat: 53.5753, lon: 10.0153 },
  "Italy": { lat: 41.9028, lon: 12.4964 }, // Rome
  "Rome": { lat: 41.9028, lon: 12.4964 },
  "Milan": { lat: 45.4642, lon: 9.1900 },
  "Spain": { lat: 40.4168, lon: -3.7038 }, // Madrid
  "Madrid": { lat: 40.4168, lon: -3.7038 },
  "Barcelona": { lat: 41.3851, lon: 2.1734 },
  "Netherlands": { lat: 52.3676, lon: 4.9041 },
  "Amsterdam": { lat: 52.3676, lon: 4.9041 },
  "Belgium": { lat: 50.8503, lon: 4.3517 },
  "Switzerland": { lat: 46.9481, lon: 7.4474 },
  "Austria": { lat: 48.2082, lon: 16.3738 },
  "Poland": { lat: 52.2297, lon: 21.0122 },
  "Ukraine": { lat: 50.4501, lon: 30.5234 }, // Kyiv
  "Kyiv": { lat: 50.4501, lon: 30.5234 },
  "Russia": { lat: 55.7558, lon: 37.6173 }, // Moscow
  "Moscow": { lat: 55.7558, lon: 37.6173 },
  "St Petersburg": { lat: 59.9311, lon: 30.3609 },
  "Sweden": { lat: 59.3293, lon: 18.0686 },
  "Norway": { lat: 59.9139, lon: 10.7522 },
  "Denmark": { lat: 55.6761, lon: 12.5683 },
  "Finland": { lat: 60.1699, lon: 24.9384 },
  "Portugal": { lat: 38.7169, lon: -9.1399 },
  "Greece": { lat: 37.9838, lon: 23.7275 },
  "Romania": { lat: 44.4268, lon: 26.1025 },
  "Hungary": { lat: 47.4979, lon: 19.0402 },
  "Czech Republic": { lat: 50.0755, lon: 14.4378 },
  "Slovakia": { lat: 48.1486, lon: 17.1077 },
  "Serbia": { lat: 44.7866, lon: 20.4489 },
  "Croatia": { lat: 45.8150, lon: 15.9819 },
  "Bosnia": { lat: 43.8476, lon: 18.3564 },
  "Albania": { lat: 41.3317, lon: 19.8319 },

  // ── Americas ────────────────────────────────────────────────────────────────
  "USA": { lat: 38.8951, lon: -77.0364 }, // Washington DC
  "United States": { lat: 38.8951, lon: -77.0364 },
  "Washington": { lat: 38.8951, lon: -77.0364 },
  "Los Angeles": { lat: 34.0522, lon: -118.2437 },
  "Chicago": { lat: 41.8781, lon: -87.6298 },
  "Miami": { lat: 25.7617, lon: -80.1918 },
  "Dallas": { lat: 32.7767, lon: -96.7970 },
  "Phoenix": { lat: 33.4484, lon: -112.0740 },
  "Philadelphia": { lat: 39.9526, lon: -75.1652 },
  "Seattle": { lat: 47.6062, lon: -122.3321 },
  "Denver": { lat: 39.7392, lon: -104.9903 },
  "Atlanta": { lat: 33.7490, lon: -84.3880 },
  "Mexico": { lat: 19.4326, lon: -99.1332 }, // Mexico City
  "Mexico City": { lat: 19.4326, lon: -99.1332 },
  "Canada": { lat: 45.4215, lon: -75.6919 }, // Ottawa
  "Toronto": { lat: 43.6532, lon: -79.3832 },
  "Vancouver": { lat: 49.2827, lon: -123.1207 },
  "Brazil": { lat: -15.8267, lon: -47.9218 }, // Brasilia
  "Sao Paulo": { lat: -23.5505, lon: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lon: -43.1729 },
  "Argentina": { lat: -34.6037, lon: -58.3816 }, // Buenos Aires
  "Chile": { lat: -33.4489, lon: -70.6693 },
  "Colombia": { lat: 4.7110, lon: -74.0721 },
  "Peru": { lat: -12.0464, lon: -77.0428 },
  "Venezuela": { lat: 10.4806, lon: -66.9036 },
  "Ecuador": { lat: -0.2295, lon: -78.5243 },
  "Bolivia": { lat: -16.5000, lon: -68.1500 },
  "Paraguay": { lat: -25.2867, lon: -57.6470 },
  "Uruguay": { lat: -34.9011, lon: -56.1645 },
  "Cuba": { lat: 23.1136, lon: -82.3666 },
  "Haiti": { lat: 18.5944, lon: -72.3074 },
  "Dominican Republic": { lat: 18.4861, lon: -69.9312 },
};

// --- MAP TILE STYLES CONFIG ---
const TILE_THEMES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  }
};

// --- GEODESIC DISTANCE (HAVERSINE) ---
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- HELPER FLY-TO MAP CONTROLLER ---
function MapFlyController({ flyToCoords }) {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo(flyToCoords.center, flyToCoords.zoom || 11, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [flyToCoords, map]);
  return null;
}

// --- INITIAL AUTO-CENTER CONTROLLER ---
function MapAutoCenter({ markers }) {
  const map = useMap();
  const centeredRef = useRef(false);

  useEffect(() => {
    // Only center on valid non-default-global markers to avoid skewing view to ocean
    const validMarkers = markers.filter(m => !m._isGlobal);
    if (validMarkers.length > 0 && !centeredRef.current) {
      const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lon]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 8 });
      centeredRef.current = true;
    } else if (markers.length > 0 && !centeredRef.current) {
      // Fallback center if only global threats exist
      map.setView([20, 0], 3);
      centeredRef.current = true;
    }
  }, [markers, map]);
  return null;
}

// --- DOUBLE-CLICK EVENT CONTROLLER FOR CUSTOM PLOTTING ---
function MapEventsController({ onMapDblClick }) {
  useMapEvents({
    dblclick(e) {
      onMapDblClick(e.latlng);
    }
  });
  return null;
}

// --- COMPONENT IMPLEMENTATION ---
export default function MapsPage({
  articles = [],
  expandedZones = [],
  geocodeCity,
  employees = [],
  pushedAlerts = new Set(),
  onPushAlert,
  dispatchedAlerts = {},
  pushToEmployee,
  handleExecute,
  loading: scanLoading = false,
  autoPilot = false,
  autoPilotInterval = 5,
  targetZone = '',
  radius = 0
}) {
  const [markers, setMarkers] = useState([]);
  const [employeeMarkers, setEmployeeMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocodingEmployees, setGeocodingEmployees] = useState(false);
  
  // Real-Time Simulator States
  const [liveDemoActive, setLiveDemoActive] = useState(false);
  const [liveDemoArticles, setLiveDemoArticles] = useState([]);
  const liveDemoTimerRef = useRef(null);
  
  // Sonar Ping Wave States
  const [sonarPings, setSonarPings] = useState([]);
  const prevMarkerIdsRef = useRef(new Set());

  // Interactive UI Panel States
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('threats'); // 'threats' | 'employees' | 'index' | 'settings'
  const [showChoropleth, setShowChoropleth] = useState(false);
  const [countryFilter, setCountryFilter] = useState(null); // null = show all
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'light' | 'satellite' | 'terrain'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlerts, setShowAlerts] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showEmployees, setShowEmployees] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [activePopup, setActivePopup] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [countdown, setCountdown] = useState(autoPilotInterval * 60);

  // Warning settings
  const [warnRadius, setWarnRadius] = useState(radius > 0 ? radius : 100);
  const [enableSound, setEnableSound] = useState(true);
  const [targetZoneMarker, setTargetZoneMarker] = useState(null);
  const [strictRadiusFilter, setStrictRadiusFilter] = useState(true);

  // Sync warnRadius when radius prop changes
  useEffect(() => {
    if (radius > 0) {
      setWarnRadius(radius);
    }
  }, [radius]);

  // Target Zone Geocoding & Map Fly-To Effect
  useEffect(() => {
    const rawZone = (targetZone || '').trim();
    if (!rawZone) {
      setTargetZoneMarker(null);
      return;
    }

    let isMounted = true;
    const resolveTargetZone = async () => {
      // 1. Check exact match in CITY_COORDINATES table
      let coords = CITY_COORDINATES[rawZone] || CITY_COORDINATES[rawZone.charAt(0).toUpperCase() + rawZone.slice(1)];

      // 2. If not found, try Nominatim search for raw target zone directly first
      if (!coords) {
        try {
          // Query target zone directly (e.g. "khadakwasla" or "khadakwasla dam")
          let res = await fetch(`/nominatim/search?q=${encodeURIComponent(rawZone)}&format=json&limit=1`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (res.ok) {
            let data = await res.json();
            if ((!data || !data.length) && articles.length > 0) {
              // Try contextual query only if raw query returns zero results
              const firstRegion = articles[0]?.ai?.region;
              if (firstRegion && !firstRegion.toLowerCase().includes(rawZone.toLowerCase())) {
                const ctxQuery = `${rawZone}, ${firstRegion}`;
                res = await fetch(`/nominatim/search?q=${encodeURIComponent(ctxQuery)}&format=json&limit=1`, {
                  headers: { 'Accept-Language': 'en' }
                });
                if (res.ok) data = await res.json();
              }
            }
            if (data && data.length > 0) {
              coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
          }
        } catch (e) {
          console.warn('[Maps] Failed to geocode target zone:', rawZone, e);
        }
      }

      if (isMounted && coords) {
        setTargetZoneMarker({ ...coords, label: rawZone });
        const effectiveR = radius > 0 ? radius : warnRadius;
        const zoomLvl = effectiveR <= 2 ? 14 : effectiveR <= 10 ? 12 : 10;
        setFlyToCoords({ center: [coords.lat, coords.lon], zoom: zoomLvl });
      }
    };

    resolveTargetZone();
    return () => { isMounted = false; };
  }, [targetZone, radius, warnRadius]);

  const activeRadius = radius > 0 ? radius : warnRadius;

  // Filter markers strictly within target zone radius when strict filter is enabled
  const displayMarkers = useMemo(() => {
    if (!targetZoneMarker || !strictRadiusFilter) return markers;
    return markers.filter(m => {
      if (m._isGlobal) return true;
      const dist = getHaversineDistance(m.lat, m.lon, targetZoneMarker.lat, targetZoneMarker.lon);
      return dist <= activeRadius;
    });
  }, [markers, targetZoneMarker, strictRadiusFilter, activeRadius]);

  const hiddenOuterCount = useMemo(() => {
    if (!targetZoneMarker || !strictRadiusFilter) return 0;
    return markers.length - displayMarkers.length;
  }, [markers, displayMarkers, targetZoneMarker, strictRadiusFilter]);

  // Manual Plot modal trigger state
  const [placementCoords, setPlacementCoords] = useState(null);
  const [customHazard, setCustomHazard] = useState('Wildfire');
  const [customClass, setCustomClass] = useState('ALERT');
  const [customTitle, setCustomTitle] = useState('');

  const geocodeCacheRef = useRef({});

  // 1. Unified Article & Demo processing
  const combinedArticles = useMemo(() => {
    return [...articles, ...liveDemoArticles];
  }, [articles, liveDemoArticles]);

  // 1b. Country Threat Level Scoring (RED / YELLOW / GREEN)
  const countryThreatLevels = useMemo(() => {
    const scores = {}; // countryName → 'RED' | 'YELLOW' | 'GREEN'
    for (const art of combinedArticles) {
      if (art.ai?.classification === 'IRRELEVANT') continue;
      const country = extractCountry(art.ai?.region || '');
      if (!country) continue;
      const urgency = (art.ai?.urgency || '').toUpperCase();
      const cls = art.ai?.classification;
      const cur = scores[country];

      if (cls === 'ALERT') {
        if (urgency === 'HIGH') {
          scores[country] = 'RED';
        } else {
          if (cur !== 'RED') {
            scores[country] = 'YELLOW';
          }
        }
      } else if (cls === 'INFORMATIVE') {
        if (!cur) {
          scores[country] = 'GREEN';
        }
      }
    }
    // Countries that appeared but have no alerts get GREEN
    for (const key of Object.keys(scores)) {
      if (!scores[key]) scores[key] = 'GREEN';
    }
    return scores;
  }, [combinedArticles]);

  // 1c. Build ranked index list for the Threat Index tab
  const countryIndexList = useMemo(() => {
    const ORDER = { RED: 0, YELLOW: 1, GREEN: 2 };
    const grouped = {};
    for (const art of combinedArticles) {
      if (art.ai?.classification === 'IRRELEVANT') continue;
      const country = extractCountry(art.ai?.region || '');
      if (!country) continue;
      if (!grouped[country]) grouped[country] = { articles: [], hazards: new Set() };
      grouped[country].articles.push(art);
      if (art.ai?.hazard) grouped[country].hazards.add(art.ai.hazard);
    }
    return Object.entries(grouped)
      .map(([country, info]) => ({
        country,
        level: countryThreatLevels[country] || 'GREEN',
        count: info.articles.length,
        hazards: [...info.hazards],
      }))
      .sort((a, b) => ORDER[a.level] - ORDER[b.level] || b.count - a.count);
  }, [combinedArticles, countryThreatLevels]);

  // 2. Geocode articles (cached & rate-limited)
  useEffect(() => {
    if (combinedArticles.length === 0) {
      setMarkers([]);
      return;
    }

    const processArticles = async () => {
      setLoading(true);
      const results = [];
      const cache = JSON.parse(localStorage.getItem('alertem_geo_cache') || '{}');

      const BROAD_GEO_TERMS = new Set([
        'india', 'united states', 'usa', 'us', 'uk', 'united kingdom', 'china',
        'japan', 'germany', 'france', 'russia', 'global', 'asia', 'europe',
        'africa', 'america', 'california', 'maharashtra', 'tamil nadu',
        'uttar pradesh', 'west bengal', 'rajasthan', 'gujarat', 'delhi'
      ]);

      // KEY DESIGN RULE: We NEVER scan article body text for city name keywords —
      // that causes false matches (e.g. an Odisha article mentioning Maharashtra gets
      // mapped to Maharashtra). Instead we trust the AI's structured region/exact_location
      // fields and let Nominatim resolve them precisely.
      const determinePinpointLocation = (art) => {
        // Priority 0: Active Target Zone match
        if (targetZone && targetZone.trim().length > 2) {
          const fullText = ((art.title || '') + ' ' + (art.ai?.reasoning || '') + ' ' + (art.body || '') + ' ' + (art.ai?.exact_location || '') + ' ' + (art.ai?.region || '')).toLowerCase();
          const rawZones = targetZone.split(',').map(z => z.trim().toLowerCase()).filter(Boolean);
          for (const zone of rawZones) {
            if (fullText.includes(zone)) {
              const matchedKey = Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === zone);
              if (matchedKey) return matchedKey;
              return zone.charAt(0).toUpperCase() + zone.slice(1);
            }
          }
        }

        // Priority 1: AI exact_location — use if specific and not a broad country/state name
        if (art.ai?.exact_location && art.ai.exact_location.trim().length > 2) {
          const loc = art.ai.exact_location.trim();
          if (!BROAD_GEO_TERMS.has(loc.toLowerCase())) return loc;
        }

        // Priority 2: AI region field passed directly to Nominatim for accurate geocoding.
        // We do NOT scan article body text for city keywords — that causes false matches
        // (e.g. an Odisha article mentioning Maharashtra gets mapped to Maharashtra).
        const region = (art.ai?.region || '').trim();
        if (region && region.toLowerCase() !== 'global' && region !== '') {
          return region;
        }

        return 'Global';
      };

      // Group articles by pinpoint target location
      const locationGroups = {};
      for (const art of combinedArticles) {
        if (art.ai?.classification === 'IRRELEVANT') continue;
        const targetLoc = determinePinpointLocation(art);
        if (!locationGroups[targetLoc]) locationGroups[targetLoc] = [];
        locationGroups[targetLoc].push(art);
      }

      for (const [targetLoc, arts] of Object.entries(locationGroups)) {
        let coords = null;
        const isGlobal = targetLoc.toLowerCase() === 'global' || targetLoc.toLowerCase() === 'none';

        if (isGlobal) {
          coords = { lat: 25.0, lon: -35.0 };
        } else {
          // 1. Check exact match in CITY_COORDINATES
          coords = CITY_COORDINATES[targetLoc] || CITY_COORDINATES[targetLoc.charAt(0).toUpperCase() + targetLoc.slice(1)];

          if (!coords) {
            const targetLower = targetLoc.toLowerCase();
            const matchedKey = Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === targetLower);
            if (matchedKey) coords = CITY_COORDINATES[matchedKey];
          }

          // 2. Try localStorage cache
          if (!coords && cache[targetLoc]) {
            coords = cache[targetLoc];
          }

          // 3. Query Nominatim API with smart query cleaning + progressive fallbacks.
          // Region strings from AI can be complex, e.g.:
          //   "SOUTH BENGAL, INDIA (JHARGRAM, SOUTH 24 PARGANAS, PASCHIM AND PURBA MEDINIPUR DISTRICTS)"
          // We strip parenthetical content and try simpler forms if the first query fails.
          if (!coords) {
            try {
              const LAND_TYPES = ['city', 'town', 'village', 'suburb', 'municipality',
                'administrative', 'county', 'state_district', 'province', 'quarter', 'state'];

              // Build a clean, progressively simpler query list from the region string
              const buildQueryVariants = (raw) => {
                // Step 1: Remove anything in parentheses (sub-district detail that confuses Nominatim)
                const stripped = raw.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
                // Step 2: Split by comma, take meaningful parts
                const parts = stripped.split(',').map(p => p.trim()).filter(Boolean);
                const variants = [
                  stripped,                          // "SOUTH BENGAL, INDIA"
                  parts.slice(0, 2).join(', '),      // "SOUTH BENGAL, INDIA" (first 2 parts)
                  parts[0],                          // "SOUTH BENGAL" (just the primary location)
                ];
                // Deduplicate while preserving order
                return [...new Set(variants.filter(v => v && v.length > 1))];
              };

              const queryVariants = buildQueryVariants(targetLoc);

              for (const query of queryVariants) {
                if (coords) break;
                const encoded = encodeURIComponent(query);
                const res = await fetch(
                  `/nominatim/search?q=${encoded}&format=json&limit=5&addressdetails=1`,
                  { headers: { 'Accept-Language': 'en' } }
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data && data.length > 0) {
                    const landResult = data.find(d =>
                      LAND_TYPES.some(t => (d.type || '').toLowerCase().includes(t) ||
                        (d.addresstype || '').toLowerCase().includes(t))
                    );
                    const chosen = landResult || data[0];
                    coords = { lat: parseFloat(chosen.lat), lon: parseFloat(chosen.lon) };
                    cache[targetLoc] = coords;
                    geocodeCacheRef.current[targetLoc] = coords;
                    localStorage.setItem('alertem_geo_cache', JSON.stringify(cache));
                    console.log(`[Maps] Geocoded "${targetLoc}" via query "${query}" →`, coords);
                  }
                }
                // Rate-limit: wait between Nominatim calls
                if (!coords) await new Promise(r => setTimeout(r, 1100));
              }
              if (!coords) await new Promise(r => setTimeout(r, 1100));
            } catch (e) {
              console.error('[Maps] Geocode failed for targetLoc:', targetLoc, e);
            }
          }

          // 4. Last-resort: substring match in CITY_COORDINATES (no text scanning, only the region key)
          if (!coords) {
            const locLower = targetLoc.toLowerCase();
            const sortedKeys = Object.keys(CITY_COORDINATES).sort((a, b) => b.length - a.length);
            const matchKey = sortedKeys.find(k =>
              !BROAD_GEO_TERMS.has(k.toLowerCase()) &&
              (locLower.includes(k.toLowerCase()) || k.toLowerCase().includes(locLower))
            );
            if (matchKey) coords = CITY_COORDINATES[matchKey];
          }
        }

        arts.forEach((art, idx) => {
          let finalCoords = coords;

          if (!finalCoords) {
            finalCoords = { lat: 25.0, lon: -35.0 };
          }

          const isActuallyGlobal = isGlobal || (finalCoords.lat === 25.0 && finalCoords.lon === -35.0);
          const angle = (idx / Math.max(arts.length, 1)) * 2 * Math.PI;
          const spread = arts.length > 1 ? 0.012 : 0;

          results.push({
            ...art,
            lat: finalCoords.lat + Math.sin(angle) * spread,
            lon: finalCoords.lon + Math.cos(angle) * spread,
            _baseLat: finalCoords.lat,
            _baseLon: finalCoords.lon,
            _isGlobal: isActuallyGlobal,
          });
        });
      }

      setMarkers(results);
      setLoading(false);
    };

    processArticles();
  }, [combinedArticles]);

  // 3. Geocode employees
  useEffect(() => {
    if (!employees || employees.length === 0) {
      setEmployeeMarkers([]);
      return;
    }

    const processEmployees = async () => {
      setGeocodingEmployees(true);
      const results = [];
      const cache = JSON.parse(localStorage.getItem('alertem_geo_cache') || '{}');

      for (const emp of employees) {
        const countryName = COUNTRIES.find(c => c.code === emp.country)?.name || emp.country;
        const locStr = [emp.state, countryName].filter(Boolean).join(', ');

        if (!locStr) continue;

        let coords = cache[locStr] || geocodeCacheRef.current[locStr];

        if (!coords && CITY_COORDINATES[emp.state]) {
          coords = CITY_COORDINATES[emp.state];
        }

        if (!coords) {
          try {
            const res = await geocodeCity(locStr);
            if (res) {
              coords = res;
            } else {
              const resCountry = await geocodeCity(countryName);
              if (resCountry) coords = resCountry;
            }

            if (coords) {
              cache[locStr] = coords;
              geocodeCacheRef.current[locStr] = coords;
              localStorage.setItem('alertem_geo_cache', JSON.stringify(cache));
            }
            await new Promise(r => setTimeout(r, 1100));
          } catch (e) {
            console.error('[Maps] Geocode failed for employee location:', locStr, e);
          }
        }

        if (coords) {
          const sameLocCount = results.filter(r => r._baseLoc === locStr).length;
          let lat = coords.lat;
          let lon = coords.lon;
          if (sameLocCount > 0) {
            const angle = (sameLocCount / 8) * 2 * Math.PI;
            const spread = 0.025;
            lat += Math.sin(angle) * spread;
            lon += Math.cos(angle) * spread;
          }

          results.push({
            ...emp,
            lat,
            lon,
            _baseLoc: locStr,
          });
        }
      }

      setEmployeeMarkers(results);
      setGeocodingEmployees(false);
    };

    processEmployees();
  }, [employees, geocodeCity]);

  // 4. Sonar Pings for new threat alerts (with toggleable audio chime)
  useEffect(() => {
    const newPings = [];
    markers.forEach(m => {
      if (!prevMarkerIdsRef.current.has(m.id || m.title)) {
        prevMarkerIdsRef.current.add(m.id || m.title);
        if (prevMarkerIdsRef.current.size > markers.length) {
          newPings.push({
            id: Date.now() + Math.random(),
            lat: m.lat,
            lon: m.lon,
            hazard: m.ai?.hazard || 'Alert'
          });
        }
      }
    });

    if (newPings.length > 0) {
      setSonarPings(prev => [...prev, ...newPings]);
      
      if (enableSound) {
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.frequency.setValueAtTime(880, context.currentTime);
          gain.gain.setValueAtTime(0.08, context.currentTime);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
          osc.stop(context.currentTime + 0.5);
        } catch (e) {
          // Blocked or unsupported
        }
      }

      setTimeout(() => {
        setSonarPings(prev => prev.filter(p => !newPings.includes(p)));
      }, 5000);
    }
  }, [markers, enableSound]);

  // 5. Live Simulator interval ticker
  const toggleLiveDemo = () => {
    if (liveDemoActive) {
      clearInterval(liveDemoTimerRef.current);
      setLiveDemoActive(false);
    } else {
      setLiveDemoActive(true);
      addMockAlert();
      liveDemoTimerRef.current = setInterval(addMockAlert, 20000);
    }
  };

  const addMockAlert = () => {
    const template = MOCK_LIVE_FEED_TEMPLATES[Math.floor(Math.random() * MOCK_LIVE_FEED_TEMPLATES.length)];
    const mockId = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAlert = {
      ...template,
      id: mockId,
      date: new Date().toISOString(),
      source: { title: "Live Command Stream", uri: "feed.alertem.ia" },
      sources: [
        {
          title: template.title,
          url: "#",
          date: new Date().toLocaleTimeString(),
          source: { title: "Global Security RSS" }
        }
      ]
    };
    setLiveDemoArticles(prev => [newAlert, ...prev].slice(0, 15));
  };

  useEffect(() => {
    return () => clearInterval(liveDemoTimerRef.current);
  }, []);

  // 6. Polling Timer for Auto-Pilot Countdown
  useEffect(() => {
    if (!autoPilot) return;
    setCountdown(autoPilotInterval * 60);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleExecute(true);
          return autoPilotInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoPilot, autoPilotInterval, handleExecute]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const forceManualScan = () => {
    handleExecute(false);
    setCountdown(autoPilotInterval * 60);
  };

  // 7. Country-based Alerts — employee is HIGH RISK if any active alert is in the SAME COUNTRY
  // (e.g. alert in Mumbai → employee in Bangalore → both are India → HIGH RISK)
  const activeAlerts = markers.filter(m => m.ai?.classification === 'ALERT' && !m._isGlobal);

  const employeesWithRisk = employeeMarkers.map(emp => {
    // Resolve employee's country name from their country code
    const empCountryName = (COUNTRIES.find(c => c.code === emp.country)?.name || emp.country || '').toLowerCase();

    // Find all alerts in the same country as the employee
    const countryAlerts = activeAlerts.filter(alert => {
      const alertCountry = (extractCountry(alert.ai?.region || '') || '').toLowerCase();
      return alertCountry && empCountryName && (
        alertCountry === empCountryName ||
        alertCountry.includes(empCountryName) ||
        empCountryName.includes(alertCountry)
      );
    });

    // Also compute the closest alert by distance (kept for display purposes)
    let closestAlert = null;
    let minDistance = Infinity;
    activeAlerts.forEach(alert => {
      if (emp.lat && emp.lon && alert.lat && alert.lon) {
        const dist = getHaversineDistance(emp.lat, emp.lon, alert.lat, alert.lon);
        if (dist < minDistance) { minDistance = dist; closestAlert = alert; }
      }
    });

    // If any alert is in the same country → HIGH RISK
    const isCountryRisk = countryAlerts.length > 0;
    // Use the first country-matching alert as the "closest" for notification purposes
    const primaryAlert = isCountryRisk ? countryAlerts[0] : closestAlert;

    return {
      ...emp,
      riskLevel: isCountryRisk ? 'HIGH' : 'NORMAL',
      closestAlert: primaryAlert,
      countryAlerts,             // all alerts in their country
      distanceToAlert: minDistance
    };
  });

  const highRiskEmployees = employeesWithRisk.filter(emp => emp.riskLevel === 'HIGH');
  const normalEmployees = employeesWithRisk.filter(emp => emp.riskLevel === 'NORMAL');

  // 8. Filters & Search queries
  const filteredThreats = markers.filter(m => {
    const matchesSearch =
      (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.ai?.hazard || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.ai?.region || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    // Country filter (from Threat Index tab clicks)
    if (countryFilter) {
      const artCountry = extractCountry(m.ai?.region || '');
      if (artCountry !== countryFilter) return false;
    }
    if (m.ai?.classification === 'ALERT') return showAlerts;
    if (m.ai?.classification === 'INFORMATIVE') return showReports;
    return true;
  });

  const filteredEmployees = employeesWithRisk.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || (emp.company || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 9. Interactive fly-to and popup triggers
  const handleSelectThreat = (threat) => {
    // If it's a global threat, zoom out to global view. Otherwise, zoom in close.
    const zoomLevel = threat._isGlobal ? 3 : 12;
    setFlyToCoords({ center: [threat.lat, threat.lon], zoom: zoomLevel });
    setActivePopup({
      position: [threat.lat, threat.lon],
      type: 'threat',
      title: threat.title,
      classification: threat.ai?.classification,
      hazard: threat.ai?.hazard,
      region: threat.ai?.region,
      urgency: threat.ai?.urgency,
      reasoning: threat.ai?.reasoning,
      mitigation: threat.ai?.mitigation,
      citizen_action: threat.ai?.citizen_action,
      sources: threat.sources,
      id: threat.id,
      _isGlobal: threat._isGlobal
    });
  };

  const handleSelectEmployee = (emp) => {
    setFlyToCoords({ center: [emp.lat, emp.lon], zoom: 12 });
    setActivePopup({
      position: [emp.lat, emp.lon],
      type: 'employee',
      firstName: emp.firstName,
      lastName: emp.lastName,
      company: emp.company,
      companyEmail: emp.companyEmail,
      phone: emp.phone,
      riskLevel: emp.riskLevel,
      distanceToAlert: emp.distanceToAlert,
      closestAlert: emp.closestAlert,
      id: emp.id
    });
  };


  // 10. Handler to deploy analyst-placed custom threats
  const handlePlotCustomThreat = () => {
    if (!placementCoords) return;
    const newThreat = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim() || `Tactical ${customHazard} Alert Reported`,
      date: new Date().toISOString(),
      lat: placementCoords.lat,
      lon: placementCoords.lng,
      ai: {
        classification: customClass,
        hazard: customHazard,
        region: `POS [${placementCoords.lat.toFixed(3)}, ${placementCoords.lng.toFixed(3)}]`,
        urgency: customClass === 'ALERT' ? 'HIGH' : 'LOW',
        reasoning: 'Tactical node plotted manually by operations desk.',
        mitigation: customClass === 'ALERT' ? 'Restrict transit through grid sector. Contact nearby employees.' : 'Monitor local alerts.',
        citizen_action: 'Follow local guidelines.'
      },
      sources: [
        {
          title: "Operations Console Plot",
          url: "#",
          date: new Date().toLocaleTimeString(),
          source: { title: "Internal Security Desk" }
        }
      ]
    };

    setLiveDemoArticles(prev => [newThreat, ...prev]);
    setPlacementCoords(null);
    setCustomTitle('');
  };

  // Custom DivIcon creators
  const createEmployeeIcon = (emp) => {
    const isHighRisk = emp.riskLevel === 'HIGH';
    return L.divIcon({
      className: 'emp-map-marker',
      html: `
        <div class="emp-marker-avatar ${isHighRisk ? 'emp-marker-avatar--danger' : ''}">
          ${emp.firstName[0]}${emp.lastName[0]}
        </div>
        <div class="emp-marker-ping ${isHighRisk ? 'emp-marker-ping--danger' : ''}"></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const createAlertIcon = (hazard) => {
    return L.divIcon({
      className: 'alert-map-marker',
      html: `
        <div class="alert-marker-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
        <div class="alert-marker-ping"></div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const createInfoIcon = () => {
    return L.divIcon({
      className: 'info-map-marker',
      html: `
        <div class="info-marker-icon"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Custom DivIcon for global/unmapped threat nodes (rendered in North Atlantic ocean)
  const createGlobalIcon = (classification) => {
    const isAlert = classification === 'ALERT';
    return L.divIcon({
      className: 'global-map-marker',
      html: `
        <div class="global-marker-icon ${isAlert ? 'red' : 'blue'}"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>
        ${isAlert ? '<div class="alert-marker-ping"></div>' : ''}
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const createSonarIcon = (hazard) => {
    return L.divIcon({
      className: 'sonar-ping-marker',
      html: `
        <div class="sonar-wave-1"></div>
        <div class="sonar-wave-2"></div>
        <div class="sonar-ping-label">${hazard.toUpperCase()} DETECTED</div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const alertCount = combinedArticles.filter(a => a.ai?.classification === 'ALERT').length;
  const reportCount = combinedArticles.filter(a => a.ai?.classification === 'INFORMATIVE').length;

  return (
    <div className={`maps-page maps-theme-${mapStyle}`}>
      {/* Header */}
      <div className="maps-header">
        <div className="maps-header-left">
          <span className="maps-header-dot maps-header-dot--alert" />
          <h1 className="maps-header-title">Live Tactical Operations Map</h1>
        </div>

        <div className="maps-header-stats">
          <span className={`maps-live-badge ${liveDemoActive || autoPilot ? 'maps-live-badge--active' : ''}`}>
            <span className="maps-live-dot" />
            {liveDemoActive ? 'FEED SIMULATION ACTIVE' : autoPilot ? 'LIVE AUTOMATIC MONITORING' : 'THREAT RADAR STANDBY'}
          </span>

          {autoPilot && (
            <span className="maps-countdown-timer">
              Auto-scan in: <strong>{formatCountdown(countdown)}</strong>
            </span>
          )}

          <button onClick={forceManualScan} disabled={scanLoading} className="maps-control-btn maps-control-btn--scan">
            {scanLoading ? 'Scanning Global Data...' : 'Scan Now'}
          </button>

          <span className="maps-stat maps-stat--alert">
            <span className="maps-stat-dot maps-stat-dot--red" />
            {alertCount} Alerts
          </span>
          <span className="maps-stat maps-stat--info">
            <span className="maps-stat-dot maps-stat-dot--blue" />
            {reportCount} Reports
          </span>

          {(loading || geocodingEmployees) && (
            <span className="maps-stat maps-stat--loading">
              <span className="maps-loading-spinner" />
              Plotting nodes...
            </span>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="maps-container">
        {/* Floating Toggle Button for Collapsed Panel */}
        {panelCollapsed && (
          <button onClick={() => setPanelCollapsed(false)} className="maps-panel-restore-btn" title="Open Operations Panel">
            <svg className="w-3.5 h-3.5 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            COMMAND PANEL
          </button>
        )}

        {/* Collapsible Operations Sidebar Panel */}
        <div className={`maps-overlay-panel ${panelCollapsed ? 'collapsed' : ''}`}>
          <div className="overlay-header">
            <div className="overlay-title-bar">
              <span className="panel-title-txt">Operations Control</span>
              <button onClick={() => setPanelCollapsed(true)} className="panel-collapse-btn" title="Collapse Panel">
                ◀
              </button>
            </div>
            <div className="overlay-tabs">
              <button onClick={() => setActiveTab('threats')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'threats' ? 'active' : ''}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Threats ({filteredThreats.length})
              </button>
              <button onClick={() => setActiveTab('employees')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'employees' ? 'active' : ''}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Team ({filteredEmployees.length})
              </button>
              <button onClick={() => { setActiveTab('index'); setCountryFilter(null); }} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'index' ? 'active' : ''}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11a2 2 0 012-2h1.065M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
                Index ({countryIndexList.length})
              </button>
              <button onClick={() => setActiveTab('settings')} className={`tab-btn flex items-center gap-1.5 ${activeTab === 'settings' ? 'active' : ''}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel
              </button>
            </div>
            <div className="overlay-search">
              <input
                type="text"
                placeholder={activeTab === 'threats' ? "Filter threats..." : "Search team directory..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overlay-body">
            {/* THREATS TAB */}
            {activeTab === 'threats' && (
              <div className="tab-panel flex-col">
                <div className="threats-filter-badges">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={showAlerts} onChange={e => setShowAlerts(e.target.checked)} />
                    <span className="checkbox-custom red" /> Alerts
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={showReports} onChange={e => setShowReports(e.target.checked)} />
                    <span className="checkbox-custom blue" /> Reports
                  </label>
                </div>

                <div className="scrollable-list">
                  {filteredThreats.length === 0 ? (
                    <div className="list-empty">No matching threat vectors plotted.</div>
                  ) : (
                    filteredThreats.map((threat, idx) => {
                      const isAlert = threat.ai?.classification === 'ALERT';
                      const isPushed = pushedAlerts.has(threat.id);
                      return (
                        <div
                          key={threat.id || idx}
                          onClick={() => handleSelectThreat(threat)}
                          className={`list-item list-item--threat ${isAlert ? 'border-left-red' : 'border-left-blue'} ${activePopup?.id === threat.id ? 'selected' : ''}`}
                        >
                          <div className="item-title-row">
                            <span className={`severity-badge ${isAlert ? 'red' : 'blue'}`}>
                              {threat.ai?.classification}
                            </span>
                            {isPushed && <span className="pushed-badge">PUSHED</span>}
                            {threat._isGlobal && <span className="pushed-badge" style={{ background: '#6b7280' }}>GLOBAL</span>}
                            <span className="item-time">{new Date(threat.date).toLocaleTimeString()}</span>
                          </div>
                          <h4 className="item-heading">{threat.title}</h4>
                          <div className="item-meta flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {threat.ai?.hazard}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {threat.ai?.region}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                              {(() => {
                              const sourceNames = [...new Set(threat.sources?.map(s => s.source?.title || s.source?.uri || 'Unknown Source'))];
                              return sourceNames.length > 1
                                ? `${sourceNames[0]} + ${sourceNames.length - 1} more`
                                : sourceNames[0] || 'Unknown Source';
                            })()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* THREAT INDEX TAB */}
            {activeTab === 'index' && (
              <div className="tab-panel flex-col">
                {countryFilter && (
                  <div style={{ padding: '6px 10px', background: 'rgba(234,179,8,0.12)', borderBottom: '1px solid rgba(234,179,8,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#ca8a04', display: 'flex', alignItems: 'center', gap: '3px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> FILTERED: {countryFilter}</span>
                    <button onClick={() => setCountryFilter(null)} style={{ fontSize: '9px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Clear</button>
                  </div>
                )}
                <div className="scrollable-list">
                  {countryIndexList.length === 0 ? (
                    <div className="list-empty">No country data yet. Run a scan first.</div>
                  ) : (
                    countryIndexList.map((entry, idx) => {
                      const cfg = THREAT_LEVEL[entry.level];
                      const isActive = countryFilter === entry.country;
                      return (
                        <div
                          key={entry.country}
                          onClick={() => {
                            setCountryFilter(isActive ? null : entry.country);
                            setActiveTab('threats');
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: isActive ? 'rgba(234,179,8,0.1)' : 'transparent',
                            borderLeft: `3px solid ${cfg.border}`,
                            transition: 'background 0.15s'
                          }}
                        >
                          <div style={{ width: '28px', textAlign: 'center', fontSize: '16px' }}>{cfg.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '800', fontSize: '11px', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.country}</div>
                            <div style={{ fontSize: '9px', color: cfg.border, fontWeight: '700', letterSpacing: '0.04em' }}>{cfg.label}</div>
                            <div style={{ fontSize: '8px', color: '#64748b', marginTop: '2px' }}>{entry.hazards.slice(0,3).join(' · ')}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: cfg.border }}>{entry.count}</div>
                            <div style={{ fontSize: '7px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>articles</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* EMPLOYEES TAB */}
            {activeTab === 'employees' && (
              <div className="tab-panel flex-col">
                <div className="scrollable-list">
                  {/* High Risk Section */}
                  {highRiskEmployees.length > 0 && (
                    <div className="list-section">
                      <div className="section-header danger" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> HIGH RISK WARNING ({highRiskEmployees.length})</div>
                      {highRiskEmployees.map((emp, idx) => (
                        <div
                          key={`high-emp-${idx}`}
                          onClick={() => handleSelectEmployee(emp)}
                          className={`list-item list-item--employee risk-high ${activePopup?.id === emp.id ? 'selected' : ''}`}
                        >
                          <div className="emp-avatar-row">
                            <div className="emp-avatar-circle danger">{emp.firstName[0]}{emp.lastName[0]}</div>
                            <div className="emp-name-info">
                              <span className="emp-fullname">{emp.firstName} {emp.lastName}</span>
                              <span className="emp-company-sub">{emp.company}</span>
                            </div>
                          </div>
                          <div className="emp-risk-desc">
                            Active <strong>{emp.closestAlert?.ai?.hazard || 'threat'} alert</strong> detected in <strong>{extractCountry(emp.closestAlert?.ai?.region || '') || 'your country'}</strong> — employee may be at risk.
                          </div>
                          <div className="emp-action-footer">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                pushToEmployee(emp.closestAlert.id, emp.id);
                                onPushAlert(emp.closestAlert.id);
                              }}
                              className="emp-push-btn"
                            >
                              Dispatch Alert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Normal Section */}
                  <div className="list-section">
                    <div className="section-header">NORMAL PROXIMITY DIRECTORY ({normalEmployees.length})</div>
                    {filteredEmployees.filter(e => e.riskLevel === 'NORMAL').length === 0 ? (
                      <div className="list-empty">No secure employees found or matches search.</div>
                    ) : (
                      filteredEmployees.filter(e => e.riskLevel === 'NORMAL').map((emp, idx) => (
                        <div
                          key={`normal-emp-${idx}`}
                          onClick={() => handleSelectEmployee(emp)}
                          className={`list-item list-item--employee ${activePopup?.id === emp.id ? 'selected' : ''}`}
                        >
                          <div className="emp-avatar-row">
                            <div className="emp-avatar-circle">{emp.firstName[0]}{emp.lastName[0]}</div>
                            <div className="emp-name-info">
                              <span className="emp-fullname">{emp.firstName} {emp.lastName}</span>
                              <span className="emp-company-sub">{emp.company}</span>
                            </div>
                          </div>
                          <div className="item-meta">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg> {emp.state}, {emp.country}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS / GENERAL PANEL TAB */}
            {activeTab === 'settings' && (
              <div className="tab-panel settings-panel">
                <div className="settings-section">
                  <h4 className="settings-title">Tactical Live Simulator</h4>
                  <p className="settings-desc">Simulate a live satellite threat stream to test warning logic & notifications.</p>
                  <button onClick={toggleLiveDemo} className={`simulator-toggle-btn ${liveDemoActive ? 'active' : ''}`}>
                    {liveDemoActive ? <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Stop Demo Stream</> : <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg> Start Live Demo Feed</>}
                  </button>
                  {liveDemoActive && (
                    <p className="simulator-pulse-note">Incoming threat events streaming every 20 seconds...</p>
                  )}
                </div>

                <div className="settings-section">
                  <h4 className="settings-title">Map Controls</h4>
                  
                  {/* Sound Effect Toggle */}
                  <label className="checkbox-label" style={{ marginBottom: '12px' }}>
                    <input type="checkbox" checked={enableSound} onChange={e => setEnableSound(e.target.checked)} />
                    <span className="checkbox-custom blue" /> Enable Radar Chime Sound
                  </label>
                </div>

                <div className="settings-section">
                  <h4 className="settings-title">Operational Map Themes</h4>
                  <div className="theme-grid">
                    {Object.keys(TILE_THEMES).map(themeKey => (
                      <button
                        key={themeKey}
                        onClick={() => setMapStyle(themeKey)}
                        className={`theme-select-btn ${mapStyle === themeKey ? 'active' : ''}`}
                      >
                        {themeKey.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <h4 className="settings-title">Map Layers Toggles</h4>
                  <div className="toggles-list">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showEmployees} onChange={e => setShowEmployees(e.target.checked)} />
                      <span className="checkbox-custom green" /> Show Employees
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showCorridors} onChange={e => setShowCorridors(e.target.checked)} />
                      <span className="checkbox-custom red" /> Threat Danger Corridors
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showChoropleth} onChange={e => setShowChoropleth(e.target.checked)} />
                      <span className="checkbox-custom" style={{ background: showChoropleth ? '#dc2626' : undefined }} /> <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> National Alert Levels
                    </label>
                  </div>
                </div>

                <div className="settings-section" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '8px', fontWeight: '900', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg> COMMAND PROTIP</span>
                  <p style={{ fontSize: '8px', color: '#9ca3af', lineHeight: '1.3' }}>Double-click anywhere on the map to manually plot coordinates and deploy custom threat alerts!</p>
                </div>
                <div className="settings-section" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '8px', fontWeight: '900', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg> GEOCODE CACHE</span>
                  <p style={{ fontSize: '8px', color: '#9ca3af', lineHeight: '1.3', marginBottom: '8px' }}>If markers appear in the sea, clear the cache to force fresh land-accurate location lookups.</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('alertem_geo_cache');
                      geocodeCacheRef.current = {};
                      setMarkers([]);
                      alert('Geocode cache cleared! Run the scan again to replot all threat markers on land.');
                    }}
                    style={{
                      width: '100%', padding: '6px 10px', background: '#fef3c7',
                      border: '1px solid #f59e0b', borderRadius: '6px',
                      fontSize: '8px', fontWeight: '900', color: '#92400e',
                      cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Clear Geocode Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal for double-clicking to plot a manual threat */}
        {placementCoords && (
          <div className="maps-placement-modal">
            <div className="modal-header">
              <span className="modal-title-text">Plot Custom Threat Node</span>
              <button onClick={() => setPlacementCoords(null)} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-coord-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg> LAT: {placementCoords.lat.toFixed(4)}, LON: {placementCoords.lng.toFixed(4)}
              </div>
              
              <div className="modal-field">
                <label>Classification</label>
                <select value={customClass} onChange={e => setCustomClass(e.target.value)}>
                  <option value="ALERT">⚠ ALERT (Critical threat)</option>
                  <option value="INFORMATIVE">↳ REPORT (Informational update)</option>
                </select>
              </div>

              <div className="modal-field">
                <label>Hazard Category</label>
                <select value={customHazard} onChange={e => setCustomHazard(e.target.value)}>
                  <option value="Wildfire">▲ Wildfire</option>
                  <option value="Earthquake">◈ Earthquake</option>
                  <option value="Flooding">≋ Flooding</option>
                  <option value="Cyberattack">⌨ Cyberattack</option>
                  <option value="Industrial Fire">◉ Industrial Fire</option>
                  <option value="Cyclone">↺ Cyclone</option>
                  <option value="Hazardous Spill">⊛ Hazardous Spill</option>
                </select>
              </div>

              <div className="modal-field">
                <label>Threat Description Title</label>
                <input 
                  type="text" 
                  value={customTitle} 
                  onChange={e => setCustomTitle(e.target.value)} 
                  placeholder="e.g. Chemical spill detected in industrial plant sector..."
                />
              </div>

              <button onClick={handlePlotCustomThreat} className="plot-btn">
                Plot coordinates
              </button>
            </div>
          </div>
        )}

        {/* Leaflet Map */}
        {combinedArticles.length === 0 && !scanLoading && employeeMarkers.length === 0 ? (
          <div className="maps-empty">
            <svg className="maps-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h2 className="maps-empty-title">No Command Nodes Active</h2>
            <p className="maps-empty-desc">Click "Scan Now" or toggle "Start Live Demo Feed" in settings to plot live threat data.</p>
          </div>
        ) : (
          <MapContainer
            center={[20, 0]}
            zoom={3}
            className="maps-leaflet"
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            doubleClickZoom={false}
          >
            {/* Position Zoom controls on topright instead of topleft */}
            <ZoomControl position="topright" />

            <TileLayer
              attribution={TILE_THEMES[mapStyle].attribution}
              url={TILE_THEMES[mapStyle].url}
              key={mapStyle}
            />
            
            {/* Auto center map to fit markers */}
            <MapAutoCenter markers={[...markers, ...employeeMarkers]} />
            <MapFlyController flyToCoords={flyToCoords} />

            {/* Double-click listener */}
            <MapEventsController onMapDblClick={setPlacementCoords} />

            {/* National Threat Alert Level Choropleth */}
            {showChoropleth && Object.keys(countryThreatLevels).length > 0 && (
              <ChoroplethLayer
                countryThreatLevels={countryThreatLevels}
                onCountryClick={(country) => {
                  setCountryFilter(prev => prev === country ? null : country);
                  setActiveTab('threats');
                }}
              />
            )}

            {/* Sonar Ping Wave Animations */}
            {sonarPings.map(ping => (
              <Marker
                key={ping.id}
                position={[ping.lat, ping.lon]}
                icon={createSonarIcon(ping.hazard)}
              />
            ))}

            {/* Threat Danger Corridors (lines linking at-risk employees to threats) */}
            {showCorridors && showEmployees && highRiskEmployees.map((emp, idx) => (
              <Polyline
                key={`line-${idx}`}
                positions={[[emp.lat, emp.lon], [emp.closestAlert.lat, emp.closestAlert.lon]]}
                pathOptions={{
                  color: '#ef4444',
                  weight: 2,
                  dashArray: '8, 12',
                  className: 'pulse-line-danger'
                }}
              >
                <Popup>
                  <div className="maps-popup-content">
                    <span className="maps-popup-badge maps-popup-badge--alert" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> CLOSE THREAT PROXIMITY</span>
                    <h4 className="font-bold text-red-600 mt-1">{emp.firstName} {emp.lastName} at Risk</h4>
                    <p className="text-xs text-gray-400 mt-1">Located {Math.round(emp.distanceToAlert)}km from <strong>{emp.closestAlert.ai?.hazard}</strong> in {emp.closestAlert.ai?.region}.</p>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Target Zone Radius Circle & Marker */}
            {targetZoneMarker && (
              <>
                <Circle
                  center={[targetZoneMarker.lat, targetZoneMarker.lon]}
                  radius={(radius > 0 ? radius : warnRadius) * 1000}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.25,
                    weight: 2.5,
                    dashArray: '6, 6',
                    className: 'pulse-zone-target'
                  }}
                />
                <Marker
                  position={[targetZoneMarker.lat, targetZoneMarker.lon]}
                  icon={L.divIcon({
                    className: 'target-zone-pin',
                    html: `
                      <div style="background: #2563eb; color: white; padding: 4px 10px; border-radius: 12px; font-weight: 900; font-size: 10px; border: 2px solid white; box-shadow: 0 4px 12px rgba(37,99,235,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                        ◎ TARGET: ${targetZoneMarker.label.toUpperCase()} (${radius > 0 ? radius : warnRadius}KM)
                      </div>
                    `,
                    iconSize: [140, 30],
                    iconAnchor: [70, 15]
                  })}
                >
                  <Popup>
                    <div className="maps-popup-content">
                      <span className="maps-popup-badge maps-popup-badge--info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> TARGET ZONE</span>
                      <h4 className="font-bold text-blue-600 mt-1">{targetZoneMarker.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">Search radius: <strong>{radius > 0 ? radius : warnRadius} km</strong></p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Target Zone Radial Control Banner */}
            {targetZoneMarker && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999,
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '16px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#ffffff',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
                maxWidth: '90%'
              }}>
                <span style={{ fontSize: '10px', fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> TARGET: {targetZoneMarker.label.toUpperCase()} ({activeRadius}KM RADIUS)
                </span>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: strictRadiusFilter ? '#38bdf8' : '#9ca3af' }}>
                  <input
                    type="checkbox"
                    checked={strictRadiusFilter}
                    onChange={e => setStrictRadiusFilter(e.target.checked)}
                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                  Strict {activeRadius}KM Radius Filter
                </label>

                {hiddenOuterCount > 0 ? (
                  <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: '8px' }}>
                    {hiddenOuterCount} outer metro alerts hidden
                  </span>
                ) : (
                  <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '8px' }}>
                    {displayMarkers.length} threats inside perimeter
                  </span>
                )}
              </div>
            )}

            {/* Threat Alert Zones (Circles for localized impact region) */}
            {showAlerts && displayMarkers.filter(m => m.ai?.classification === 'ALERT' && !m._isGlobal).map((art, idx) => {
              const isHigh = (art.ai?.urgency || '').toUpperCase() === 'HIGH';
              const color = isHigh ? '#dc2626' : '#ca8a04';
              return (
                <Circle
                  key={`alert-zone-${idx}`}
                  center={[art.lat, art.lon]}
                  radius={activeRadius * 1000} // radius in meters
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: isHigh ? 'none' : '4, 4',
                    className: isHigh ? 'pulse-zone-danger' : 'pulse-zone-warn'
                  }}
                />
              );
            })}

            {/* Threat Alerts (Red Markers) */}
            {showAlerts && displayMarkers.filter(m => m.ai?.classification === 'ALERT').map((art, idx) => (
              <Marker
                key={`alert-${idx}`}
                position={[art.lat, art.lon]}
                icon={art._isGlobal ? createGlobalIcon('ALERT') : createAlertIcon(art.ai?.hazard)}
                eventHandlers={{ click: () => handleSelectThreat(art) }}
              />
            ))}

            {/* Threat Reports (Blue Markers) */}
            {showReports && displayMarkers.filter(m => m.ai?.classification === 'INFORMATIVE').map((art, idx) => (
              <Marker
                key={`info-${idx}`}
                position={[art.lat, art.lon]}
                icon={art._isGlobal ? createGlobalIcon('INFORMATIVE') : createInfoIcon()}
                eventHandlers={{ click: () => handleSelectThreat(art) }}
              />
            ))}

            {/* Employees (Teal/Green Markers) */}
            {showEmployees && employeeMarkers.map((emp, idx) => (
              <Marker
                key={`emp-${idx}`}
                position={[emp.lat, emp.lon]}
                icon={createEmployeeIcon(emp)}
                eventHandlers={{ click: () => handleSelectEmployee(emp) }}
              />
            ))}

            {/* Single Unified Floating Popup */}
            {activePopup && (
              <Popup
                position={activePopup.position}
                onClose={() => setActivePopup(null)}
              >
                <div className="maps-popup-content">
                  {activePopup.type === 'threat' ? (
                    <>
                      <span className={`maps-popup-badge ${activePopup.classification === 'ALERT' ? 'maps-popup-badge--alert' : 'maps-popup-badge--info'}`}>
                        {activePopup.classification === 'ALERT' ? <><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>ALERT</> : <><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>REPORT</>}
                      </span>
                      {pushedAlerts.has(activePopup.id) && (
                        <span className="maps-popup-badge" style={{ background: '#10b981', color: 'white', marginLeft: '5px' }}>PUSHED</span>
                      )}
                      {activePopup._isGlobal && (
                        <span className="maps-popup-badge" style={{ background: '#6b7280', color: 'white', marginLeft: '5px' }}>GLOBAL</span>
                      )}
                      <h3 className="maps-popup-title">{activePopup.hazard || 'Hazard'}</h3>
                      <p className="maps-popup-region">{activePopup.region}</p>
                      {activePopup.classification === 'ALERT' && (
                        <p className="maps-popup-urgency">Urgency: <strong>{activePopup.urgency}</strong></p>
                      )}
                      <p className="maps-popup-text">{activePopup.title}</p>
                      {activePopup.reasoning && (
                        <p className="maps-popup-text" style={{ fontStyle: 'italic', color: '#6b7280', borderLeft: '2px solid #d1d5db', paddingLeft: '6px', marginTop: '6px' }}>
                          Reason: {activePopup.reasoning}
                        </p>
                      )}
                      {activePopup.mitigation && (
                        <div style={{ marginTop: '8px', background: '#fef2f2', padding: '6px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: '7px', fontWeight: '900', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mitigation Action</span>
                          <p style={{ fontSize: '9px', color: '#991b1b', margin: '2px 0 0' }}>{activePopup.mitigation}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className={`maps-popup-badge ${activePopup.riskLevel === 'HIGH' ? 'maps-popup-badge--alert' : 'maps-popup-badge--info'}`} style={{ background: activePopup.riskLevel === 'HIGH' ? '#ef4444' : '#10b981', color: 'white' }}>
                        {activePopup.riskLevel === 'HIGH' ? <><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>AT RISK</> : <><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ verticalAlign: '-1px', marginRight: '3px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>TEAM</>}
                      </span>
                      <h3 className="maps-popup-title">{activePopup.firstName} {activePopup.lastName}</h3>
                      <p className="maps-popup-region" style={{ textTransform: 'none', letterSpacing: 'normal' }}>{activePopup.company}</p>
                      <p className="maps-popup-text" style={{ fontSize: '9px', color: '#6b7280', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '3px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> {activePopup.companyEmail}</p>
                      <p className="maps-popup-text" style={{ fontSize: '9px', color: '#6b7280', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '3px' }}><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.82-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z"/></svg> {activePopup.phone}</p>
                      
                      {activePopup.riskLevel === 'HIGH' && (
                        <div style={{ marginTop: '8px', background: '#fff5f5', border: '1px solid #ffe3e3', padding: '6px', borderRadius: '4px' }}>
                          <p style={{ fontSize: '9px', color: '#c53030', margin: 0, fontWeight: '700' }}>
                            Proximity Warning: {Math.round(activePopup.distanceToAlert)}km from {activePopup.closestAlert.ai?.hazard || 'Threat'}
                          </p>
                          <button
                            onClick={() => {
                              pushToEmployee(activePopup.closestAlert.id, activePopup.id);
                              onPushAlert(activePopup.closestAlert.id);
                            }}
                            className="maps-popup-push-btn"
                            style={{ width: '100%', marginTop: '6px', background: '#e53e3e' }}
                          >
                            Send Urgent Ping
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            )}
          </MapContainer>
        )}

        {/* Threat Level Legend */}
        {showChoropleth && Object.keys(countryThreatLevels).length > 0 && (
          <div style={{
            position: 'absolute', bottom: '52px', right: '12px', zIndex: 1000,
            background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)', minWidth: '160px',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '900', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>National Alert Levels</div>
            {Object.entries(THREAT_LEVEL).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: cfg.color, border: `1.5px solid ${cfg.border}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '9px', fontWeight: '800', color: cfg.border, lineHeight: 1.2 }}>{key}</div>
                  <div style={{ fontSize: '7px', color: '#64748b', lineHeight: 1.2 }}>{cfg.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marquee Ticker */}
      <div className="maps-ticker-tape">
        <div className="maps-ticker-wrapper">
          <div className="maps-ticker-content">
            {combinedArticles.length === 0 ? (
              <span className="ticker-item" style={{ color: '#9ca3af', display: 'inline-flex', alignItems: 'center', gap: '5px' }}><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg> SYSTEM ONLINE: STANDBY FOR SCANS OR TOGGLE THE LIVE FEED SIMULATOR...</span>
            ) : (
              combinedArticles.slice(0, 10).map((art, idx) => {
                const isAlert = art.ai?.classification === 'ALERT';
                return (
                  <span key={art.id || idx} className={`ticker-item ${isAlert ? 'ticker-item--alert' : 'ticker-item--info'}`}>
                    <span className="ticker-dot" />
                    <strong>{isAlert ? 'CRITICAL ALERT' : 'FIELD REPORT'}:</strong> {art.ai?.hazard || 'Threat'} in {art.ai?.region || 'Unknown'} - {art.title}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
