import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

//  CITY_COORDINATES (abridged — key world cities for geocoding fallback) 
const CITY_COORDS = {
  'Dubai': [25.2048, 55.2708], 'Abu Dhabi': [24.4539, 54.3773],
  'Saudi Arabia': [24.7136, 46.6753], 'Riyadh': [24.7136, 46.6753],
  'UAE': [24.4539, 54.3773], 'Qatar': [25.2854, 51.5310],
  'Kuwait': [29.3759, 47.9774], 'Bahrain': [26.2235, 50.5876],
  'Oman': [23.5859, 58.4059], 'India': [28.6139, 77.2090],
  'Mumbai': [19.0760, 72.8777], 'Delhi': [28.6139, 77.2090],
  'New Delhi': [28.6139, 77.2090], 'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707], 'Hyderabad': [17.3850, 78.4867],
  'Kolkata': [22.5726, 88.3639], 'Pune': [18.5204, 73.8567],
  'China': [39.9042, 116.4074], 'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737], 'Shenzhen': [22.5431, 114.0579],
  'Guangzhou': [23.1291, 113.2644], 'Japan': [35.6762, 139.6503],
  'Tokyo': [35.6762, 139.6503], 'Osaka': [34.6937, 135.5023],
  'South Korea': [37.5665, 126.9780], 'Seoul': [37.5665, 126.9780],
  'Singapore': [1.3521, 103.8198], 'Malaysia': [3.1390, 101.6869],
  'Kuala Lumpur': [3.1390, 101.6869], 'Thailand': [13.7563, 100.5018],
  'Bangkok': [13.7563, 100.5018], 'Indonesia': [-6.2088, 106.8456],
  'Jakarta': [-6.2088, 106.8456], 'Vietnam': [21.0285, 105.8542], 'Northern Vietnam': [21.0285, 105.8542], 'Southern Vietnam': [10.8231, 106.6297],
  'Philippines': [14.5995, 120.9842], 'Manila': [14.5995, 120.9842],
  'Pakistan': [33.6844, 73.0479], 'Karachi': [24.8607, 67.0011],
  'Bangladesh': [23.8103, 90.4125], 'Sri Lanka': [6.9271, 79.8612],
  'Australia': [-33.8688, 151.2093], 'Sydney': [-33.8688, 151.2093],
  'Melbourne': [-37.8136, 144.9631], 'New Zealand': [-36.8485, 174.7633],
  'USA': [38.8951, -77.0364], 'United States': [38.8951, -77.0364],
  'New York': [40.7128, -74.0060], 'Los Angeles': [34.0522, -118.2437],
  'Chicago': [41.8781, -87.6298], 'Houston': [29.7604, -95.3698],
  'San Francisco': [37.7749, -122.4194], 'Seattle': [47.6062, -122.3321],
  'Canada': [45.4215, -75.6919], 'Toronto': [43.6532, -79.3832],
  'Vancouver': [49.2827, -123.1207], 'Mexico': [19.4326, -99.1332],
  'Brazil': [-15.8267, -47.9218], 'Sao Paulo': [-23.5505, -46.6333],
  'Argentina': [-34.6037, -58.3816], 'Colombia': [4.7110, -74.0721],
  'UK': [51.5074, -0.1278], 'London': [51.5074, -0.1278],
  'France': [48.8566, 2.3522], 'Paris': [48.8566, 2.3522],
  'Germany': [52.5200, 13.4050], 'Berlin': [52.5200, 13.4050],
  'Frankfurt': [50.1109, 8.6821], 'Munich': [48.1351, 11.5820],
  'Italy': [41.9028, 12.4964], 'Rome': [41.9028, 12.4964],
  'Milan': [45.4642, 9.1900], 'Spain': [40.4168, -3.7038],
  'Madrid': [40.4168, -3.7038], 'Netherlands': [52.3676, 4.9041],
  'Amsterdam': [52.3676, 4.9041], 'Switzerland': [46.9481, 7.4474],
  'Sweden': [59.3293, 18.0686], 'Norway': [59.9139, 10.7522],
  'Denmark': [55.6761, 12.5683], 'Finland': [60.1699, 24.9384],
  'Poland': [52.2297, 21.0122], 'Russia': [55.7558, 37.6173],
  'Moscow': [55.7558, 37.6173], 'Ukraine': [50.4501, 30.5234],
  'Turkey': [39.9334, 32.8597], 'Istanbul': [41.0082, 28.9784],
  'Israel': [31.7683, 35.2137], 'Iran': [35.6892, 51.3890],
  'Iraq': [33.3152, 44.3661], 'Egypt': [30.0444, 31.2357],
  'Cairo': [30.0444, 31.2357], 'Nigeria': [9.0765, 7.3986],
  'Lagos': [6.5244, 3.3792], 'South Africa': [-25.7461, 28.1881],
  'Johannesburg': [-26.2041, 28.0473], 'Kenya': [-1.2921, 36.8219],
  'Nairobi': [-1.2921, 36.8219], 'Ethiopia': [9.0320, 38.7469],
  'Morocco': [33.9716, -6.8498], 'Ghana': [5.6037, -0.1870],
  'Tanzania': [-6.7924, 39.2083], 'Cape Town': [-33.9249, 18.4241],
};

function resolveCoords(city, country) {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  if (country && CITY_COORDS[country]) return CITY_COORDS[country];
  // fuzzy
  const q = (city || country || '').toLowerCase();
  const key = Object.keys(CITY_COORDS).find(k => q.includes(k.toLowerCase()) || k.toLowerCase().includes(q));
  return key ? CITY_COORDS[key] : null;
}

function resolveThreatCoords(t) {
  const parts = (t.ai?.region || '').split(',').map(p => p.trim());
  for (const p of parts) {
    const coords = resolveCoords(p, p);
    if (coords) return coords;
  }
  return null;
}

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkThreatMatch(loc, threat) {
  const locCoords = resolveCoords(loc.city, loc.country);
  const threatCoords = resolveThreatCoords(threat);
  
  if (locCoords && threatCoords) {
    const dist = getHaversineDistance(locCoords[0], locCoords[1], threatCoords[0], threatCoords[1]);
    const radius = loc.radius !== undefined && loc.radius !== '' ? parseInt(loc.radius) : 100;
    return dist <= radius;
  }
  
  // Fallback to string matching
  const reg = (threat.ai?.region || '').toLowerCase();
  return (
    (loc.city && reg.includes(loc.city.toLowerCase())) ||
    (loc.country && reg.includes(loc.country.toLowerCase()))
  );
}

// Leaflet auto-fit bounds
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 6, animate: true });
    }
  }, [JSON.stringify(points)]);
  return null;
}

// Pulsing SVG icon factory
function makeIcon(color, size = 14, pulse = false) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size + (pulse ? 16 : 0)}' height='${size + (pulse ? 16 : 0)}' viewBox='0 0 ${size + (pulse ? 16 : 0)} ${size + (pulse ? 16 : 0)}'>
    ${pulse ? `<circle cx='${(size + 16)/2}' cy='${(size + 16)/2}' r='${(size + 16)/2}' fill='${color}' opacity='0.18'>
      <animate attributeName='r' values='${(size+4)/2};${(size+16)/2};${(size+4)/2}' dur='2s' repeatCount='indefinite'/>
      <animate attributeName='opacity' values='0.3;0.08;0.3' dur='2s' repeatCount='indefinite'/>
    </circle>` : ''}
    <circle cx='${(size + (pulse ? 16 : 0))/2}' cy='${(size + (pulse ? 16 : 0))/2}' r='${size/2}' fill='${color}' stroke='white' stroke-width='2'/>
  </svg>`;
  const half = (size + (pulse ? 16 : 0)) / 2;
  return L.divIcon({
    html: svg, className: '', iconSize: [size + (pulse ? 16 : 0), size + (pulse ? 16 : 0)], iconAnchor: [half, half],
  });
}

//  World Map Component 
// Geodesic arc: interpolate N points along great circle between two [lat,lon] coords
function geodesicArc(from, to, steps) {
  var pts = [];
  var lat1 = from[0] * Math.PI / 180;
  var lon1 = from[1] * Math.PI / 180;
  var lat2 = to[0] * Math.PI / 180;
  var lon2 = to[1] * Math.PI / 180;
  var d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
  ));
  if (d === 0) return [from, to];
  for (var i = 0; i <= steps; i++) {
    var f = i / steps;
    var A = Math.sin((1 - f) * d) / Math.sin(d);
    var B = Math.sin(f * d) / Math.sin(d);
    var x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    var y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    var lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
    var lon = Math.atan2(y, x) * 180 / Math.PI;
    pts.push([lat, lon]);
  }
  return pts;
}

function RiskWorldMap({ profile, locations, vendors, threats }) {
  const critColor = { High: '#ef4444', Medium: '#eab308', Low: '#22c55e' };
  const depColor  = { Critical: '#ef4444', Important: '#f97316', Supplementary: '#6b7280' };
  const threatRegions = (threats || []).map(t => (t.ai?.region || '').toLowerCase());

  const isThreatened = (city, country) =>
    threatRegions.some(r =>
      (city && r.includes(city.toLowerCase())) ||
      (country && r.includes(country.toLowerCase()))
    );

  const hqCoords = resolveCoords(profile.hq_city, profile.hq_country);

  const locPoints = (locations || []).map(loc => ({
    ...loc,
    coords: resolveCoords(loc.city, loc.country),
    threatened: (threats || []).some(t => checkThreatMatch(loc, t)),
  })).filter(l => l.coords);

  const vendPoints = (vendors || []).map(v => ({
    ...v,
    coords: resolveCoords(v.vendor_city, v.vendor_country),
    threatened: isThreatened(v.vendor_city, v.vendor_country),
  })).filter(v => v.coords);

  const threatPoints = (threats || []).map(t => {
    const parts = (t.ai?.region || '').split(',').map(p => p.trim());
    let coords = null;
    for (const p of parts) { coords = resolveCoords(p, p); if (coords) break; }
    return coords ? { ...t, coords } : null;
  }).filter(Boolean);

  const allPoints = [
    ...(hqCoords ? [hqCoords] : []),
    ...locPoints.map(l => l.coords),
    ...vendPoints.map(v => v.coords),
  ];
  const hasData = allPoints.length > 0;

  // Stable initial center — only computed once; FitBounds handles subsequent fit
  const initCenter = hqCoords || [20, 0];
  const initZoom = hqCoords ? 3 : 2;

  return (
    <div className="ra-worldmap-wrap">
      <div className="ra-worldmap-legend">
        <span className="ra-wm-legend-item"><span className="ra-wm-dot" style={{ background: '#6366f1' }} /> HQ</span>
        <span className="ra-wm-legend-item"><span className="ra-wm-dot" style={{ background: '#3b82f6' }} /> Locations</span>
        <span className="ra-wm-legend-item"><span className="ra-wm-dot" style={{ background: '#f97316' }} /> Vendors</span>
        <span className="ra-wm-legend-item"><span className="ra-wm-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} /> Active Threat</span>
        <span className="ra-wm-legend-item"><span className="ra-wm-dot" style={{ background: '#ffffff33', border: '1.5px dashed #6366f1' }} /> Arc connection</span>
        <span className="ra-wm-legend-item" style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 9 }}>OpenStreetMap / CARTO</span>
      </div>

      <div className="ra-worldmap-container">
        {!hasData && (
          <div className="ra-worldmap-empty">
            <span></span>
            <p>Add company HQ, locations, or vendors to plot on the map</p>
          </div>
        )}
        <MapContainer
          center={initCenter}
          zoom={initZoom}
          style={{ height: '100%', width: '100%', borderRadius: '0 0 0 0', background: '#0b1120' }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            // Esri World Dark Gray Canvas — free, no API key required
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />

          {hasData && <FitBounds points={allPoints} />}

          {/* Threat zones */}
          {threatPoints.map((t, i) => (
            <Circle key={'tz' + i} center={t.coords} radius={200000}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1.5, dashArray: '6 4' }}>
              <Popup>
                <div style={{ minWidth: 180, fontFamily: 'sans-serif' }}>
                  <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 11, marginBottom: 4 }}>THREAT: {t.ai?.hazard}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{t.ai?.region}</div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* HQ */}
          {hqCoords && (
            <Marker position={hqCoords} icon={makeIcon('#6366f1', 20, false)}>
              <Popup>
                <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                  <div style={{ fontWeight: 800, color: '#6366f1', fontSize: 12, marginBottom: 4 }}>Headquarters</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{profile.company_name || 'Company HQ'}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{[profile.hq_city, profile.hq_country].filter(Boolean).join(', ')}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Location arcs + markers */}
          {locPoints.map((loc, i) => {
            const col = loc.threatened ? '#ef4444' : (critColor[loc.criticality] || '#3b82f6');
            const arcPts = hqCoords ? geodesicArc(hqCoords, loc.coords, 48) : null;
            const rVal = loc.radius !== undefined && loc.radius !== '' ? parseInt(loc.radius) : 100;
            return (
              <React.Fragment key={'loc' + i}>
                {arcPts && (
                  <Polyline
                    positions={arcPts}
                    pathOptions={{ color: col, weight: loc.criticality === 'High' ? 2.2 : 1.6, opacity: 0.75, dashArray: loc.threatened ? '4 4' : undefined }}
                  />
                )}
                <Circle
                  center={loc.coords}
                  radius={rVal * 1000}
                  pathOptions={{
                    color: col,
                    fillColor: col,
                    fillOpacity: 0.04,
                    weight: 1,
                    dashArray: '3, 4'
                  }}
                />
                <Marker position={loc.coords} icon={makeIcon(col, 14, loc.threatened)}>
                  <Popup>
                    <div style={{ minWidth: 160, fontFamily: 'sans-serif' }}>
                      <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 4, color: loc.threatened ? '#ef4444' : '#1e293b' }}>
                        {loc.threatened ? 'THREAT DETECTED' : loc.location_type}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{loc.city || loc.country}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{loc.country}</div>
                      <div style={{ fontSize: 10, marginTop: 4 }}>
                        Criticality: <strong style={{ color: col }}>{loc.criticality}</strong>
                      </div>
                      {loc.notes && <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>{loc.notes}</div>}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Vendor arcs + markers */}
          {vendPoints.map((v, i) => {
            const col = v.threatened ? '#ef4444' : (depColor[v.dependency_level] || '#f97316');
            const arcPts = hqCoords ? geodesicArc(hqCoords, v.coords, 48) : null;
            const weight = v.dependency_level === 'Critical' ? 2.5 : v.dependency_level === 'Important' ? 2 : 1.4;
            return (
              <React.Fragment key={'vend' + i}>
                {arcPts && (
                  <Polyline
                    positions={arcPts}
                    pathOptions={{ color: col, weight: weight, opacity: 0.65, dashArray: v.single_source ? '4 5' : '10 6' }}
                  />
                )}
                <Marker position={v.coords} icon={makeIcon(col, 14, v.threatened)}>
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'sans-serif' }}>
                      <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 4, color: v.threatened ? '#ef4444' : '#1e293b' }}>
                        {v.threatened ? 'THREAT DETECTED' : 'Vendor / Supplier'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{v.vendor_name}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{[v.vendor_city, v.vendor_country].filter(Boolean).join(', ')}</div>
                      <div style={{ fontSize: 10, marginTop: 4 }}>
                        Dependency: <strong style={{ color: col }}>{v.dependency_level}</strong>
                      </div>
                      {v.single_source && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Single-source dependency</div>}
                      {(v.goods || []).length > 0 && <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>Goods: {v.goods.join(', ')}</div>}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="ra-worldmap-stats">
        <span className="ra-wm-stat">HQ {hqCoords ? '(mapped)' : '(enter HQ city)'}</span>
        <span className="ra-wm-stat">{locPoints.length}/{(locations||[]).length} locations mapped</span>
        <span className="ra-wm-stat">{vendPoints.length}/{(vendors||[]).length} vendors mapped</span>
        {threatPoints.length > 0 && <span className="ra-wm-stat ra-wm-stat--threat">{threatPoints.length} active threat zone{threatPoints.length > 1 ? 's' : ''}</span>}
      </div>
    </div>
  );
}


//  Constants 
const INDUSTRIES = [
  'Aerospace & Defence','Agriculture','Automotive','Banking & Finance',
  'Chemicals','Construction','Consumer Goods','Education','Energy & Utilities',
  'Food & Beverage','Government','Healthcare & Pharma','Hospitality & Tourism',
  'Insurance','Logistics & Transport','Manufacturing','Media & Entertainment',
  'Mining & Resources','Oil & Gas','Real Estate','Retail','Technology & IT',
  'Telecommunications','Textiles & Apparel','Other',
];

const LOCATION_TYPES = ['HQ','Branch','Warehouse','Port','Manufacturing','Partner','Data Center','Other'];
const CRITICALITY_LEVELS = ['Low','Medium','High'];
const DEPENDENCY_LEVELS = ['Critical','Important','Supplementary'];
const BACKUP_STRATEGIES = ['None','Local','Cloud','Both'];

const GOODS_PRESETS = [
  'Raw Materials','Electronics','Fuel','Logistics & Shipping','Cloud Services',
  'Pharmaceuticals','Food & Beverage','Financial Services','Software Licenses',
  'Machinery & Equipment','Textiles','Chemicals','Spare Parts','Data & Analytics',
  'Security Services','Consulting',
];
const CLOUD_PRESETS = ['AWS','Azure','Google Cloud','Oracle Cloud','IBM Cloud','Alibaba Cloud'];
const SYSTEM_PRESETS = ['SAP','Salesforce','Oracle ERP','Microsoft 365','ServiceNow','Workday','SAP S/4HANA','Jira','Tableau'];

const STEPS = [
  { id: 'profile',    label: 'Company Profile',       icon: '' },
  { id: 'locations',  label: 'Locations',              icon: '' },
  { id: 'vendors',    label: 'Vendors & Suppliers',    icon: '' },
  { id: 'it',         label: 'IT Dependencies',        icon: '' },
  { id: 'summary',    label: 'Risk Summary',           icon: '' },
];

const EMPTY_PROFILE = {
  company_name: '', industry: '', hq_country: '', hq_city: '',
  hq_address_line1: '', hq_address_line2: '', hq_area: '',
  hq_state: '', hq_pincode: '',
  hq_lat: '', hq_lng: '',
  num_employees: '', annual_revenue: '',
  critical_apps: '', key_systems: [], mfa_implemented: false,
  backup_strategy: 'None', cloud_providers: [],
};
const EMPTY_LOCATION = { country: '', city: '', location_type: 'Branch', headcount: '', radius: 100, criticality: 'Medium', notes: '' };
const EMPTY_VENDOR   = { vendor_name: '', vendor_country: '', vendor_city: '', goods: [], dependency_level: 'Important', single_source: false, notes: '' };

const STORAGE_KEY = 'alertem_risk_profiles';

const SAMPLE_RECORD = {
  id: 101,
  saved_at: new Date().toISOString(),
  risk_score: 58,
  profile: {
    company_name: 'Apex Energy & Tech Corp',
    industry: 'Energy & Utilities',
    hq_country: 'United Arab Emirates',
    hq_city: 'Dubai',
    hq_state: 'Dubai',
    hq_address_line1: 'Suite 401, Al Saada Tower',
    hq_address_line2: 'Business Bay Main Boulevard',
    hq_area: 'Business Bay',
    hq_pincode: '00000',
    hq_lat: '25.185',
    hq_lng: '55.275',
    num_employees: '4500',
    annual_revenue: '120000000',
    critical_apps: '18',
    backup_strategy: 'Daily Cloud',
    key_systems: ['SAP S/4HANA', 'Salesforce CRM', 'SCADA Energy Grid', 'Microsoft 365', 'CrowdStrike Falcon'],
    cloud_providers: ['AWS', 'Microsoft Azure'],
    mfa_implemented: true
  },
  locations: [
    { country: 'United Arab Emirates', city: 'Dubai', location_type: 'Data Center', headcount: '800', radius: 100, criticality: 'High', notes: 'Primary Regional Operation Center & Cloud Node' },
    { country: 'India', city: 'Mumbai', location_type: 'Regional Office', headcount: '1200', radius: 100, criticality: 'High', notes: 'Global Engineering & Support Hub' },
    { country: 'United States', city: 'Houston', location_type: 'Plant', headcount: '650', radius: 100, criticality: 'High', notes: 'Energy Refining & Distribution Center' },
    { country: 'Singapore', city: 'Singapore', location_type: 'Logistics Hub', headcount: '350', radius: 100, criticality: 'Medium', notes: 'APAC Supply Chain Gateway' }
  ],
  vendors: [
    { vendor_name: 'TSMC Silicon Foundry', vendor_country: 'Taiwan', vendor_city: 'Hsinchu', goods: ['Microchips', 'Semiconductors'], dependency_level: 'Critical', single_source: true, notes: 'Sole supplier for custom SCADA microchips' },
    { vendor_name: 'Reliance Energy Systems', vendor_country: 'India', vendor_city: 'Mumbai', goods: ['Power Grid Components'], dependency_level: 'Critical', single_source: false, notes: 'Primary transformer and substation supplier' },
    { vendor_name: 'Siemens Industrial Automation', vendor_country: 'Germany', vendor_city: 'Munich', goods: ['Turbines', 'Sensors'], dependency_level: 'Important', single_source: true, notes: 'Automated turbine control units' },
    { vendor_name: 'Straits Logistics Ltd', vendor_country: 'Singapore', vendor_city: 'Singapore', goods: ['Freight Shipping', 'Warehousing'], dependency_level: 'Standard', single_source: false, notes: 'Port shipping partner' }
  ]
};

//  Utility helpers 
function loadProfiles() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!list || list.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([SAMPLE_RECORD]));
      return [SAMPLE_RECORD];
    }
    return list;
  } catch {
    return [SAMPLE_RECORD];
  }
}
function saveProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

function computeRiskScore(profile, locations, vendors) {
  let score = 0;
  // single-source vendor dependencies (up to 40 pts)
  const singleSrc = vendors.filter(v => v.single_source).length;
  const criticalVendors = vendors.filter(v => v.dependency_level === 'Critical').length;
  score += Math.min(singleSrc * 10 + criticalVendors * 5, 40);
  // High-criticality locations (up to 20 pts)
  const highLocs = locations.filter(l => l.criticality === 'High').length;
  score += Math.min(highLocs * 6, 20);
  // Missing IT controls (up to 25 pts)
  if (!profile.mfa_implemented) score += 10;
  if (profile.backup_strategy === 'None') score += 10;
  if (!profile.critical_apps || parseInt(profile.critical_apps) === 0) score += 5;
  // Cloud concentration (up to 15 pts)
  if ((profile.cloud_providers || []).length === 1) score += 8;
  if ((profile.cloud_providers || []).length === 0) score += 15;
  return Math.min(score, 100);
}

function scoreColor(s) {
  if (s >= 70) return { text: '#ef4444', bg: '#fef2f2', label: 'CRITICAL RISK', stroke: '#ef4444' };
  if (s >= 45) return { text: '#f97316', bg: '#fff7ed', label: 'HIGH RISK',     stroke: '#f97316' };
  if (s >= 25) return { text: '#eab308', bg: '#fefce8', label: 'MODERATE RISK', stroke: '#eab308' };
  return        { text: '#22c55e', bg: '#f0fdf4', label: 'LOW RISK',       stroke: '#22c55e' };
}

function regionMatchesText(region, ...texts) {
  if (!region) return false;
  const r = region.toLowerCase();
  return texts.some(t => t && r.includes(t.toLowerCase().trim()));
}

//  Sub-components 

function TagInput({ label, tags = [], presets = [], onAdd, onRemove, placeholder = 'Type & Enter…' }) {
  const [input, setInput] = useState('');
  const suggestions = presets.filter(p => p.toLowerCase().includes(input.toLowerCase()) && !tags.includes(p));
  const add = (t) => { const v = t.trim(); if (v && !tags.includes(v)) onAdd(v); setInput(''); };
  return (
    <div className="ra-field">
      <label className="ra-label">{label}</label>
      <div className="ra-tag-box">
        {tags.map(t => (
          <span key={t} className="ra-tag">
            {t}
            <button onClick={() => onRemove(t)} className="ra-tag-remove">×</button>
          </span>
        ))}
        <div className="ra-tag-input-wrap">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
            placeholder={tags.length === 0 ? placeholder : 'Add more…'}
            className="ra-tag-input"
          />
          {input.trim() && suggestions.length > 0 && (
            <div className="ra-suggestions">
              {suggestions.slice(0, 6).map(s => (
                <button key={s} className="ra-suggestion-item" onClick={() => add(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange, description }) {
  return (
    <div className="ra-toggle-row">
      <div>
        <span className="ra-label">{label}</span>
        {description && <span className="ra-toggle-desc">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`ra-toggle-btn ${value ? 'ra-toggle-btn--on' : ''}`}
      >
        <span className="ra-toggle-thumb" />
      </button>
    </div>
  );
}

//  Dependency Graph (SVG) 
function DependencyGraph({ profile, locations, vendors, threats }) {
  const uid = useRef('dg' + Math.random().toString(36).slice(2, 8)).current;
  const W = 780, H = 480, CX = W / 2, CY = H / 2;
  const LOC_R = 175;

  const threatRegions = (threats || []).map(t => (t.ai?.region || '').toLowerCase());
  const isThreatened = (country, city) =>
    threatRegions.some(r =>
      (city && r.includes(city.toLowerCase())) ||
      (country && r.includes(country.toLowerCase()))
    );

  const nodes = [];
  nodes.push({
    id: 'company',
    label: (profile.company_name || 'Company').slice(0, 16),
    sublabel: (profile.industry || '').slice(0, 16),
    x: CX, y: CY, type: 'company', threatened: false,
  });

  const locs = locations || [];
  locs.forEach((loc, i) => {
    const total = locs.length;
    const arcStart = -Math.PI * 0.85, arcEnd = -Math.PI * 0.15;
    const angle = total === 1 ? -Math.PI * 0.5 : arcStart + (i / (total - 1)) * (arcEnd - arcStart);
    nodes.push({
      id: 'loc' + i,
      label: (loc.city || loc.country || '').slice(0, 12),
      sublabel: (loc.location_type || '').slice(0, 14),
      x: CX + Math.cos(angle) * LOC_R,
      y: CY + Math.sin(angle) * LOC_R,
      type: 'location', criticality: loc.criticality,
      threatened: isThreatened(loc.country, loc.city),
    });
  });

  const vends = vendors || [];
  vends.forEach((v, i) => {
    const total = vends.length;
    const arcStart = Math.PI * 0.15, arcEnd = Math.PI * 0.85;
    const angle = total === 1 ? Math.PI * 0.5 : arcStart + (i / (total - 1)) * (arcEnd - arcStart);
    nodes.push({
      id: 'vend' + i,
      label: (v.vendor_name || '').slice(0, 12),
      sublabel: (v.dependency_level || '').slice(0, 14),
      x: CX + Math.cos(angle) * LOC_R,
      y: CY + Math.sin(angle) * LOC_R,
      type: 'vendor', dependency: v.dependency_level, single: v.single_source,
      threatened: isThreatened(v.vendor_country, v.vendor_city),
    });
  });

  const nodeColor = n => {
    if (n.threatened) return '#ef4444';
    if (n.type === 'company') return '#818cf8';
    if (n.type === 'location')
      return n.criticality === 'High' ? '#f97316' : n.criticality === 'Medium' ? '#eab308' : '#22c55e';
    return n.dependency === 'Critical' ? '#ef4444' : n.dependency === 'Important' ? '#f97316' : '#6b7280';
  };

  const edgeColor = n => {
    if (n.threatened) return '#ef4444';
    if (n.type === 'location')
      return n.criticality === 'High' ? '#f97316' : n.criticality === 'Medium' ? '#eab308' : '#22c55e';
    return n.dependency === 'Critical' ? '#ef4444' : n.dependency === 'Important' ? '#f97316' : '#374151';
  };

  const edgeW = n => {
    if (n.type === 'vendor' && n.dependency === 'Critical') return 2.5;
    if (n.type === 'vendor' && n.dependency === 'Important') return 2;
    if (n.type === 'location' && n.criticality === 'High') return 2;
    return 1.2;
  };

  const co = nodes[0];

  return (
    <div className="ra-graph-wrap">
      <div className="ra-graph-legend">
        <span className="ra-legend-item"><span className="ra-legend-dot" style={{ background: '#ef4444' }} /> Critical / Threatened</span>
        <span className="ra-legend-item"><span className="ra-legend-dot" style={{ background: '#f97316' }} /> High / Important</span>
        <span className="ra-legend-item"><span className="ra-legend-dot" style={{ background: '#eab308' }} /> Medium</span>
        <span className="ra-legend-item"><span className="ra-legend-dot" style={{ background: '#22c55e' }} /> Low / Supp.</span>
        <span className="ra-legend-item"><span className="ra-legend-dot" style={{ background: '#818cf8' }} /> Company</span>
      </div>

      <svg viewBox={'0 0 ' + W + ' ' + H} className="ra-graph-svg" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={uid + 'bg'} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e2d45" />
            <stop offset="100%" stopColor="#0a0f1e" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill={'url(#' + uid + 'bg)'} rx="16" />
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={'vg' + i} x1={(i + 1) * W / 15} y1={0} x2={(i + 1) * W / 15} y2={H} stroke="rgba(255,255,255,0.03)" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={'hg' + i} x1={0} y1={(i + 1) * H / 9} x2={W} y2={(i + 1) * H / 9} stroke="rgba(255,255,255,0.03)" />
        ))}
        <circle cx={CX} cy={CY} r={LOC_R} fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" strokeDasharray="3 8" />

        {nodes.slice(1).map(n => (
          <g key={'edge' + n.id}>
            <line x1={co.x} y1={co.y} x2={n.x} y2={n.y}
              stroke={edgeColor(n)} strokeWidth={edgeW(n)}
              strokeDasharray={n.single ? '5 4' : n.type === 'vendor' ? '8 5' : '10 7'}
              opacity={n.threatened ? 0.9 : 0.5} />
            {n.single && (
              <text x={(co.x + n.x) / 2} y={(co.y + n.y) / 2 - 7}
                fill="#ef4444" fontSize="7" textAnchor="middle" fontWeight="800">SINGLE SOURCE</text>
            )}
          </g>
        ))}

        {nodes.map(n => {
          const R = n.type === 'company' ? 38 : 26;
          const col = nodeColor(n);
          const glowCss = n.threatened
            ? 'drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 18px #ef444455)'
            : n.type === 'company' ? 'drop-shadow(0 0 10px #818cf8aa)' : undefined;
          return (
            <g key={n.id} style={glowCss ? { filter: glowCss } : {}}>
              {n.threatened && (
                <circle cx={n.x} cy={n.y} r={R + 8} fill="rgba(239,68,68,0.12)">
                  <animate attributeName="r" values={(R + 5) + ';' + (R + 18) + ';' + (R + 5)} dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.55;0.08;0.55" dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={n.x} cy={n.y} r={R + 5} fill="none" stroke={col} strokeWidth="1" opacity="0.15" />
              <circle cx={n.x} cy={n.y} r={R} fill={col + '20'} stroke={col} strokeWidth={n.type === 'company' ? 2.5 : 1.8} />
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={n.type === 'company' ? 20 : 15}>
                {n.type === 'company' ? '\uD83C\uDFE2' : n.type === 'location' ? '\uD83D\uDCCD' : '\uD83D\uDD17'}
              </text>
              <text x={n.x} y={n.y + R + 14} textAnchor="middle" fontSize={n.type === 'company' ? 10 : 8.5} fill="#ffffff" fontWeight="700">
                {n.label}
              </text>
              {n.sublabel ? (
                <text x={n.x} y={n.y + R + 25} textAnchor="middle" fontSize="7" fill={col} fontWeight="600" opacity="0.75">
                  {n.sublabel}
                </text>
              ) : null}
              {n.threatened ? (
                <text x={n.x + R - 2} y={n.y - R + 5} textAnchor="middle" fontSize="13">{'\u26A0\uFE0F'}</text>
              ) : null}
            </g>
          );
        })}

        <text x="14" y="22" fill="rgba(255,255,255,0.2)" fontSize="9" fontWeight="700" letterSpacing="1">DEPENDENCY MAP</text>
        <text x={W - 14} y="22" textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8.5">Locations + Vendors</text>
        <text x={CX} y={H - 12} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="8">
          {locs.length} location{locs.length !== 1 ? 's' : ''} + {vends.length} vendor{vends.length !== 1 ? 's' : ''}
        </text>
      </svg>
    </div>
  );
}

function RiskScoreRing({ score }) {
  const c = scoreColor(score);
  const radius = 54, circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div className="ra-score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={c.stroke} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 8px ${c.stroke}88)` }}
        />
        <text x="70" y="64" textAnchor="middle" fill="white" fontSize="24" fontWeight="900">{score}</text>
        <text x="70" y="80" textAnchor="middle" fill={c.stroke} fontSize="8" fontWeight="800">/100</text>
      </svg>
      <div className="ra-score-label" style={{ color: c.text, background: c.bg }}>
        {c.label}
      </div>
    </div>
  );
}

//  Main Component 
export default function RiskAssessmentPage({ articles = [] }) {
  const [step, setStep] = useState('profile');
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE });
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showProfileList, setShowProfileList] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [editLocIdx, setEditLocIdx] = useState(null);
  const [editVendIdx, setEditVendIdx] = useState(null);
  const [locDraft, setLocDraft] = useState({ ...EMPTY_LOCATION });
  const [vendDraft, setVendDraft] = useState({ ...EMPTY_VENDOR });

  // Load profiles on mount
  useEffect(() => {
    const list = loadProfiles();
    setSavedProfiles(list);
    if (list.length > 0 && !profile.company_name) {
      handleLoad(list[0]);
    }
  }, []);

  const riskScore = computeRiskScore(profile, locations, vendors);

  const itDependencies = [
    ...(profile.key_systems || []),
    ...(profile.cloud_providers || [])
  ].filter(Boolean);

  const activeThreats = (articles || []).filter(a => {
    if (a.ai?.classification !== 'ALERT') return false;

    // 1. Physical location match
    const locMatch = locations.some(item => checkThreatMatch(item, a));

    // 2. Vendor match
    const vendMatch = vendors.some(item => regionMatchesText(a.ai?.region || '', item.vendor_city || '', item.vendor_country || ''));

    // 3. IT System / Cloud Provider match (e.g. Microsoft, Azure, AWS, SAP, Salesforce)
    const textToSearch = `${a.title || ''} ${a.ai?.hazard || ''} ${a.ai?.reasoning || ''} ${a.body || ''}`.toLowerCase();
    const itMatch = itDependencies.some(sys => {
      const name = sys.toLowerCase().trim();
      if (!name) return false;
      const words = name.split(' ').filter(w => w.length > 2);
      return words.some(w => textToSearch.includes(w));
    });

    return locMatch || vendMatch || itMatch;
  });

  //  Persistence helpers 
  const handleSave = () => {
    const profiles = loadProfiles();
    const record = {
      id: activeProfileId || Date.now(),
      profile, locations, vendors,
      risk_score: riskScore,
      saved_at: new Date().toISOString(),
    };
    const idx = profiles.findIndex(p => p.id === record.id);
    if (idx >= 0) profiles[idx] = record;
    else profiles.unshift(record);
    saveProfiles(profiles);
    setSavedProfiles(profiles);
    setActiveProfileId(record.id);
    setSaveStatus(' Saved');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleLoad = (rec) => {
    setProfile(rec.profile);
    setLocations(rec.locations || []);
    setVendors(rec.vendors || []);
    setActiveProfileId(rec.id);
    setShowProfileList(false);
    setStep('profile');
  };

  const handleDelete = (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this company risk profile? This action cannot be undone.")) {
      const profiles = loadProfiles().filter(p => p.id !== id);
      saveProfiles(profiles);
      setSavedProfiles(profiles);
      if (activeProfileId === id) {
        setProfile({ ...EMPTY_PROFILE }); setLocations([]); setVendors([]); setActiveProfileId(null);
      }
    }
  };

  const handleNew = () => {
    setProfile({ ...EMPTY_PROFILE }); setLocations([]); setVendors([]); setActiveProfileId(null);
    setStep('profile'); setShowProfileList(false);
  };

  //  Form field helpers 
  const setP = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  //  Location CRUD 
  const openAddLoc = () => { setLocDraft({ ...EMPTY_LOCATION }); setEditLocIdx(-1); };
  const openEditLoc = (i) => { setLocDraft({ ...locations[i] }); setEditLocIdx(i); };
  const saveLoc = () => {
    if (!locDraft.country.trim()) return;
    if (editLocIdx === -1) setLocations(l => [...l, { ...locDraft }]);
    else setLocations(l => l.map((x, i) => i === editLocIdx ? { ...locDraft } : x));
    setEditLocIdx(null);
  };

  //  Vendor CRUD 
  const openAddVend = () => { setVendDraft({ ...EMPTY_VENDOR }); setEditVendIdx(-1); };
  const openEditVend = (i) => { setVendDraft({ ...vendors[i] }); setEditVendIdx(i); };
  const saveVend = () => {
    if (!vendDraft.vendor_name.trim()) return;
    if (editVendIdx === -1) setVendors(v => [...v, { ...vendDraft }]);
    else setVendors(v => v.map((x, i) => i === editVendIdx ? { ...vendDraft } : x));
    setEditVendIdx(null);
  };

  //  Step renderer 
  const renderStep = () => {
    switch (step) {
      case 'profile': return <StepProfile profile={profile} setP={setP} activeProfileId={activeProfileId} handleDelete={handleDelete} />;
      case 'locations': return (
        <StepLocations
          locations={locations} setLocations={setLocations}
          locDraft={locDraft} setLocDraft={setLocDraft}
          editLocIdx={editLocIdx} setEditLocIdx={setEditLocIdx}
          openAddLoc={openAddLoc} openEditLoc={openEditLoc} saveLoc={saveLoc}
          activeThreats={activeThreats}
        />
      );
      case 'vendors': return (
        <StepVendors
          vendors={vendors} setVendors={setVendors}
          vendDraft={vendDraft} setVendDraft={setVendDraft}
          editVendIdx={editVendIdx} setEditVendIdx={setEditVendIdx}
          openAddVend={openAddVend} openEditVend={openEditVend} saveVend={saveVend}
          activeThreats={activeThreats}
        />
      );
      case 'it': return <StepIT profile={profile} setP={setP} activeThreats={activeThreats} />;
      case 'summary': return (
        <StepSummary
          profile={profile} locations={locations} vendors={vendors}
          riskScore={riskScore} activeThreats={activeThreats}
        />
      );
      default: return null;
    }
  };

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  return (
    <div className="ra-page">
      {/*  Header  */}
      <div className="ra-header">
        <div className="ra-header-left">
          <div className="ra-header-icon"></div>
          <div>
            <h1 className="ra-header-title">Risk Assessment</h1>
            <p className="ra-header-sub">
              {profile.company_name ? profile.company_name : 'New Company Profile'}
              {activeProfileId && <span className="ra-saved-badge"> Saved</span>}
            </p>
          </div>
        </div>
        <div className="ra-header-actions">
          {activeThreats.length > 0 && (
            <div className="ra-threat-alert-badge animate-pulse">
               {activeThreats.length} Active Threat{activeThreats.length > 1 ? 's' : ''} Detected
            </div>
          )}
          <button onClick={() => setShowProfileList(!showProfileList)} className="ra-btn ra-btn-ghost">
             Profiles ({savedProfiles.length})
          </button>
          {activeProfileId && (
            <button
              onClick={() => handleDelete(activeProfileId)}
              className="ra-btn"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
              title="Delete current active profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-1px', marginRight: '4px' }}>
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Delete Profile
            </button>
          )}
          <button onClick={handleSave} className="ra-btn ra-btn-primary">
            {saveStatus || ' Save Profile'}
          </button>
        </div>
      </div>

      {/*  Saved Profiles Dropdown  */}
      {showProfileList && (
        <div className="ra-profile-list">
          <div className="ra-profile-list-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span>Saved Profiles</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  const list = loadProfiles();
                  const exists = list.find(p => p.id === SAMPLE_RECORD.id);
                  if (!exists) {
                    const updated = [SAMPLE_RECORD, ...list];
                    saveProfiles(updated);
                    setSavedProfiles(updated);
                  }
                  handleLoad(SAMPLE_RECORD);
                }}
                className="ra-btn ra-btn-sm"
                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
              >
                ⚡ Load Sample Profile
              </button>
              <button onClick={handleNew} className="ra-btn ra-btn-sm">＋ New</button>
            </div>
          </div>
          {savedProfiles.length === 0 && <p className="ra-empty-state">No saved profiles yet.</p>}
          {savedProfiles.map(rec => {
            const sc = scoreColor(rec.risk_score || 0);
            return (
              <div key={rec.id} className="ra-profile-item">
                <div className="ra-profile-item-info" onClick={() => handleLoad(rec)}>
                  <span className="ra-profile-item-name">{rec.profile?.company_name || 'Unnamed'}</span>
                  <span className="ra-profile-item-meta">{rec.profile?.industry} · {rec.locations?.length} locations · {rec.vendors?.length} vendors</span>
                  <span className="ra-profile-item-date">{new Date(rec.saved_at).toLocaleDateString()}</span>
                </div>
                <span className="ra-profile-score-badge" style={{ color: sc.text, background: sc.bg }}>
                  {rec.risk_score}/100
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(rec.id);
                  }}
                  className="ra-btn-icon-del"
                  title="Delete Profile"
                  style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/*  Step Nav  */}
      <div className="ra-step-nav">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isDone = i < currentStepIdx;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`ra-step-btn ${isActive ? 'ra-step-btn--active' : ''} ${isDone ? 'ra-step-btn--done' : ''}`}
            >
              <span className="ra-step-icon">{isDone ? '' : s.icon}</span>
              <span className="ra-step-label">{s.label}</span>
              {isActive && <span className="ra-step-active-bar" />}
            </button>
          );
        })}
      </div>

      {/*  Step Content  */}
      <div className="ra-content">
        {renderStep()}
      </div>

      {/*  Bottom Nav  */}
      <div className="ra-footer-nav">
        {currentStepIdx > 0 && (
          <button onClick={() => setStep(STEPS[currentStepIdx - 1].id)} className="ra-btn ra-btn-ghost">
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        {currentStepIdx < STEPS.length - 1 && (
          <button onClick={() => setStep(STEPS[currentStepIdx + 1].id)} className="ra-btn ra-btn-primary">
            Next →
          </button>
        )}
        {currentStepIdx === STEPS.length - 1 && (
          <button onClick={handleSave} className="ra-btn ra-btn-primary">
            {saveStatus || ' Save Assessment'}
          </button>
        )}
      </div>
    </div>
  );
}

// 
// STEP 1 — Company Profile
// 
function StepProfile({ profile, setP, activeProfileId, handleDelete }) {
  return (
    <div className="ra-form-grid">
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Company Information</h2>
          <p className="ra-section-desc">Basic organizational details used to anchor your risk profile</p>
        </div>
        <div className="ra-fields-grid">
          <div className="ra-field ra-field--lg">
            <label className="ra-label">Company Name *</label>
            <input className="ra-input" value={profile.company_name} onChange={e => setP('company_name', e.target.value)} placeholder="e.g. Acme Corporation" />
          </div>
          <div className="ra-field">
            <label className="ra-label">Industry</label>
            <select className="ra-select" value={profile.industry} onChange={e => setP('industry', e.target.value)}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="ra-field">
            <label className="ra-label">HQ Country</label>
            <input className="ra-input" value={profile.hq_country} onChange={e => setP('hq_country', e.target.value)} placeholder="e.g. United Arab Emirates" />
          </div>
          <div className="ra-field">
            <label className="ra-label">HQ City</label>
            <input className="ra-input" value={profile.hq_city} onChange={e => setP('hq_city', e.target.value)} placeholder="e.g. Dubai" />
          </div>
          <div className="ra-field">
            <label className="ra-label">Number of Employees</label>
            <input className="ra-input" type="number" min="1" value={profile.num_employees} onChange={e => setP('num_employees', e.target.value)} placeholder="e.g. 5000" />
          </div>
          <div className="ra-field">
            <label className="ra-label">Annual Revenue (USD)</label>
            <input className="ra-input" type="number" min="0" value={profile.annual_revenue} onChange={e => setP('annual_revenue', e.target.value)} placeholder="e.g. 25000000" />
          </div>
        </div>

        {/* ── Registered Office / HQ Address ── */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>
            📍 Registered Office / HQ Address
          </p>
          <div className="ra-fields-grid">
            <div className="ra-field">
              <label className="ra-label">Flat / Unit / Building No.</label>
              <input
                className="ra-input"
                value={profile.hq_address_line1}
                onChange={e => setP('hq_address_line1', e.target.value)}
                placeholder="e.g. Unit 12, Tower B"
              />
            </div>
            <div className="ra-field ra-field--lg">
              <label className="ra-label">Street / Road Name</label>
              <input
                className="ra-input"
                value={profile.hq_address_line2}
                onChange={e => setP('hq_address_line2', e.target.value)}
                placeholder="e.g. Sheikh Zayed Road"
              />
            </div>
            <div className="ra-field">
              <label className="ra-label">Area / Locality / District</label>
              <input
                className="ra-input"
                value={profile.hq_area}
                onChange={e => setP('hq_area', e.target.value)}
                placeholder="e.g. Business Bay"
              />
            </div>
            <div className="ra-field">
              <label className="ra-label">State / Emirate / Province</label>
              <input
                className="ra-input"
                value={profile.hq_state}
                onChange={e => setP('hq_state', e.target.value)}
                placeholder="e.g. Maharashtra / Dubai"
              />
            </div>
            <div className="ra-field">
              <label className="ra-label">PIN Code / ZIP / PO Box</label>
              <input
                className="ra-input"
                value={profile.hq_pincode}
                onChange={e => setP('hq_pincode', e.target.value)}
                placeholder="e.g. 500001 or PO Box 12345"
                maxLength={12}
              />
            </div>
            <div className="ra-field">
              <label className="ra-label">Latitude</label>
              <input
                className="ra-input"
                type="number"
                step="any"
                value={profile.hq_lat}
                onChange={e => setP('hq_lat', e.target.value)}
                placeholder="e.g. 25.2048"
              />
            </div>
            <div className="ra-field">
              <label className="ra-label">Longitude</label>
              <input
                className="ra-input"
                type="number"
                step="any"
                value={profile.hq_lng}
                onChange={e => setP('hq_lng', e.target.value)}
                placeholder="e.g. 55.2708"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Danger Zone: Delete Profile ── */}
      <div className="ra-section-card ra-section-card--full" style={{ border: '1px solid #fecaca', background: '#fff5f5' }}>
        <div className="ra-section-header">
          <span className="ra-section-icon" style={{ background: '#ef4444' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </span>
          <h2 className="ra-section-title" style={{ color: '#991b1b' }}>Danger Zone</h2>
          <p className="ra-section-desc" style={{ color: '#b91c1c' }}>Permanently remove this company profile or reset data</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
          <div>
            <strong style={{ fontSize: 12, color: '#7f1d1d' }}>
              {activeProfileId ? `Delete "${profile.company_name || 'Current Profile'}"` : 'Clear Profile Form Draft'}
            </strong>
            <p style={{ fontSize: 11, color: '#991b1b', margin: '2px 0 0' }}>
              {activeProfileId
                ? 'This will permanently remove this company profile, locations, vendors, and IT controls from local storage.'
                : 'Resets all fields in the current company profile draft to empty.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (activeProfileId) {
                handleDelete(activeProfileId);
              } else {
                if (window.confirm("Are you sure you want to reset all fields in this profile draft?")) {
                  setP('company_name', ''); setP('industry', ''); setP('hq_country', ''); setP('hq_city', ''); setP('num_employees', ''); setP('annual_revenue', ''); setP('hq_address_line1', ''); setP('hq_address_line2', ''); setP('hq_area', ''); setP('hq_state', ''); setP('hq_pincode', ''); setP('hq_lat', ''); setP('hq_lng', '');
                }
              }
            }}
            style={{
              background: '#dc2626', color: '#ffffff', border: 'none', padding: '9px 18px', borderRadius: 8,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(220,38,38,0.25)', transition: 'background 0.2s'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            {activeProfileId ? 'Delete Saved Profile' : 'Reset Form Draft'}
          </button>
        </div>
      </div>

      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Why This Matters</h2>
        </div>
        <div className="ra-info-pills">
          <div className="ra-info-pill">
            <span className="ra-info-pill-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <div>
              <strong>Threat Correlation</strong>
              <p>Your company's locations and vendor cities are cross-matched against live threat intelligence to surface relevant alerts.</p>
            </div>
          </div>
          <div className="ra-info-pill">
            <span className="ra-info-pill-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </span>
            <div>
              <strong>Dependency Mapping</strong>
              <p>Visualize how supply chain disruptions, vendor outages, or regional threats cascade across your operations.</p>
            </div>
          </div>
          <div className="ra-info-pill">
            <span className="ra-info-pill-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </span>
            <div>
              <strong>Risk Scoring</strong>
              <p>A 0–100 risk score is computed from your dependency concentration, IT controls, and geographic exposure.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 
// STEP 2 — Operational Locations
// 
function StepLocations({ locations, setLocations, locDraft, setLocDraft, editLocIdx, setEditLocIdx, openAddLoc, openEditLoc, saveLoc, activeThreats }) {
  const setLD = (k, v) => setLocDraft(d => ({ ...d, [k]: v }));
  const isLocThreatened = (loc) =>
    activeThreats.some(t => checkThreatMatch(loc, t));

  return (
    <div className="ra-form-grid">
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Operational Locations & Tie-Ups</h2>
          <p className="ra-section-desc">Add every geographic location your company operates in — HQs, branches, warehouses, ports, manufacturing plants, and partner sites</p>
          <button onClick={openAddLoc} className="ra-btn ra-btn-primary ra-btn-sm" style={{ marginLeft: 'auto' }}>＋ Add Location</button>
        </div>

        {/* Location form drawer */}
        {editLocIdx !== null && (
          <div className="ra-drawer">
            <div className="ra-drawer-title">{editLocIdx === -1 ? 'Add Location' : 'Edit Location'}</div>
            <div className="ra-fields-grid">
              <div className="ra-field">
                <label className="ra-label">Country *</label>
                <input className="ra-input" value={locDraft.country} onChange={e => setLD('country', e.target.value)} placeholder="e.g. Saudi Arabia" />
              </div>
              <div className="ra-field">
                <label className="ra-label">City / Region</label>
                <input className="ra-input" value={locDraft.city} onChange={e => setLD('city', e.target.value)} placeholder="e.g. Riyadh" />
              </div>
              <div className="ra-field">
                <label className="ra-label">Type of Operation</label>
                <select className="ra-select" value={locDraft.location_type} onChange={e => setLD('location_type', e.target.value)}>
                  {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="ra-field">
                <label className="ra-label">Headcount</label>
                <input className="ra-input" type="number" min="0" value={locDraft.headcount || ''} onChange={e => setLD('headcount', e.target.value)} placeholder="e.g. 150" />
              </div>
              <div className="ra-field">
                <label className="ra-label">Warning Radius (km)</label>
                <input className="ra-input" type="number" min="1" value={locDraft.radius || ''} onChange={e => setLD('radius', e.target.value)} placeholder="e.g. 100" />
              </div>
              <div className="ra-field">
                <label className="ra-label">Criticality</label>
                <div className="ra-criticality-btns">
                  {CRITICALITY_LEVELS.map(c => (
                    <button key={c} onClick={() => setLD('criticality', c)}
                      className={`ra-crit-btn ra-crit-btn--${c.toLowerCase()} ${locDraft.criticality === c ? 'ra-crit-btn--active' : ''}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ra-field ra-field--full">
                <label className="ra-label">Notes</label>
                <input className="ra-input" value={locDraft.notes} onChange={e => setLD('notes', e.target.value)} placeholder="Optional context…" />
              </div>
            </div>
            <div className="ra-drawer-actions">
              <button onClick={() => setEditLocIdx(null)} className="ra-btn ra-btn-ghost">Cancel</button>
              <button onClick={saveLoc} className="ra-btn ra-btn-primary">
                {editLocIdx === -1 ? 'Add Location' : 'Update Location'}
              </button>
            </div>
          </div>
        )}

        {/* Locations table */}
        {locations.length === 0 ? (
          <div className="ra-empty-card">
            <span style={{ fontSize: 36 }}></span>
            <p>No locations added yet</p>
            <p style={{ fontSize: 12, opacity: 0.5 }}>Add all sites your company operates in to enable threat correlation</p>
          </div>
        ) : (
          <div className="ra-table-wrap">
            <table className="ra-table">
              <thead>
                <tr>
                  <th>Country</th><th>City</th><th>Type</th><th>Headcount</th><th>Radius</th><th>Criticality</th><th>Threats</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc, i) => {
                  const threatened = isLocThreatened(loc);
                  return (
                    <tr key={i} className={threatened ? 'ra-table-row--threat' : ''}>
                      <td>{loc.country}</td>
                      <td>{loc.city || '—'}</td>
                      <td><span className="ra-type-badge">{loc.location_type}</span></td>
                      <td>{loc.headcount !== undefined && loc.headcount !== '' ? Number(loc.headcount).toLocaleString() : '—'}</td>
                      <td>{loc.radius !== undefined && loc.radius !== '' ? `${loc.radius} km` : '100 km'}</td>
                      <td><span className={`ra-crit-badge ra-crit-badge--${loc.criticality.toLowerCase()}`}>{loc.criticality}</span></td>
                      <td>
                        {threatened
                          ? <span className="ra-threat-cell animate-pulse"> ACTIVE THREAT</span>
                          : <span className="ra-safe-cell"> Clear</span>}
                      </td>
                      <td className="ra-notes-cell">{loc.notes || '—'}</td>
                      <td>
                        <div className="ra-row-actions">
                          <button onClick={() => openEditLoc(i)} className="ra-btn-icon"></button>
                          <button onClick={() => setLocations(l => l.filter((_, j) => j !== i))} className="ra-btn-icon"></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Location summary stats */}
        {locations.length > 0 && (
          <div className="ra-stats-row">
            {['High','Medium','Low'].map(c => (
              <div key={c} className={`ra-stat-pill ra-stat-pill--${c.toLowerCase()}`}>
                <span>{locations.filter(l => l.criticality === c).length}</span>
                <span>{c} Criticality</span>
              </div>
            ))}
            {LOCATION_TYPES.filter(t => locations.some(l => l.location_type === t)).map(t => (
              <div key={t} className="ra-stat-pill ra-stat-pill--neutral">
                <span>{locations.filter(l => l.location_type === t).length}</span>
                <span>{t}s</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 
// STEP 3 — Vendors & Suppliers
// 
function StepVendors({ vendors, setVendors, vendDraft, setVendDraft, editVendIdx, setEditVendIdx, openAddVend, openEditVend, saveVend, activeThreats }) {
  const setVD = (k, v) => setVendDraft(d => ({ ...d, [k]: v }));
  const threatRegions = activeThreats.map(t => (t.ai?.region || '').toLowerCase());
  const isVendThreatened = (v) =>
    threatRegions.some(r => (v.vendor_city && r.includes(v.vendor_city.toLowerCase())) || (v.vendor_country && r.includes(v.vendor_country.toLowerCase())));

  return (
    <div className="ra-form-grid">
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Third-Party Vendors & Suppliers</h2>
          <p className="ra-section-desc">Register all third-party vendors, suppliers, and partners your company depends on — including the goods or services they provide</p>
          <button onClick={openAddVend} className="ra-btn ra-btn-primary ra-btn-sm" style={{ marginLeft: 'auto' }}>＋ Add Vendor</button>
        </div>

        {/* Vendor form drawer */}
        {editVendIdx !== null && (
          <div className="ra-drawer">
            <div className="ra-drawer-title">{editVendIdx === -1 ? 'Add Vendor / Supplier' : 'Edit Vendor'}</div>
            <div className="ra-fields-grid">
              <div className="ra-field ra-field--lg">
                <label className="ra-label">Vendor / Supplier Name *</label>
                <input className="ra-input" value={vendDraft.vendor_name} onChange={e => setVD('vendor_name', e.target.value)} placeholder="e.g. Aramco Trading" />
              </div>
              <div className="ra-field">
                <label className="ra-label">Country</label>
                <input className="ra-input" value={vendDraft.vendor_country} onChange={e => setVD('vendor_country', e.target.value)} placeholder="e.g. Saudi Arabia" />
              </div>
              <div className="ra-field">
                <label className="ra-label">City</label>
                <input className="ra-input" value={vendDraft.vendor_city} onChange={e => setVD('vendor_city', e.target.value)} placeholder="e.g. Riyadh" />
              </div>
              <div className="ra-field">
                <label className="ra-label">Dependency Level</label>
                <div className="ra-criticality-btns">
                  {DEPENDENCY_LEVELS.map(d => (
                    <button key={d} onClick={() => setVD('dependency_level', d)}
                      className={`ra-crit-btn ra-crit-btn--${d === 'Critical' ? 'high' : d === 'Important' ? 'medium' : 'low'} ${vendDraft.dependency_level === d ? 'ra-crit-btn--active' : ''}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ra-field ra-field--full">
                <TagInput
                  label="Goods / Services Provided"
                  tags={vendDraft.goods}
                  presets={GOODS_PRESETS}
                  onAdd={g => setVD('goods', [...(vendDraft.goods || []), g])}
                  onRemove={g => setVD('goods', (vendDraft.goods || []).filter(x => x !== g))}
                  placeholder="e.g. Fuel, Electronics…"
                />
              </div>
              <div className="ra-field ra-field--full">
                <div className="ra-toggle-row">
                  <div>
                    <span className="ra-label">Single-Source Dependency</span>
                    <span className="ra-toggle-desc">No alternative supplier exists for this vendor's goods/services</span>
                  </div>
                  <button onClick={() => setVD('single_source', !vendDraft.single_source)}
                    className={`ra-toggle-btn ${vendDraft.single_source ? 'ra-toggle-btn--on' : ''}`}>
                    <span className="ra-toggle-thumb" />
                  </button>
                </div>
              </div>
              <div className="ra-field ra-field--full">
                <label className="ra-label">Notes</label>
                <input className="ra-input" value={vendDraft.notes} onChange={e => setVD('notes', e.target.value)} placeholder="Optional context…" />
              </div>
            </div>
            <div className="ra-drawer-actions">
              <button onClick={() => setEditVendIdx(null)} className="ra-btn ra-btn-ghost">Cancel</button>
              <button onClick={saveVend} className="ra-btn ra-btn-primary">
                {editVendIdx === -1 ? 'Add Vendor' : 'Update Vendor'}
              </button>
            </div>
          </div>
        )}

        {vendors.length === 0 ? (
          <div className="ra-empty-card">
            <span style={{ fontSize: 36 }}></span>
            <p>No vendors added yet</p>
            <p style={{ fontSize: 12, opacity: 0.5 }}>Add suppliers to map your supply chain dependencies</p>
          </div>
        ) : (
          <div className="ra-table-wrap">
            <table className="ra-table">
              <thead>
                <tr>
                  <th>Vendor</th><th>Location</th><th>Goods / Services</th><th>Dependency</th><th>Single Source</th><th>Threats</th><th></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => {
                  const threatened = isVendThreatened(v);
                  return (
                    <tr key={i} className={threatened ? 'ra-table-row--threat' : ''}>
                      <td><strong>{v.vendor_name}</strong></td>
                      <td>{[v.vendor_city, v.vendor_country].filter(Boolean).join(', ') || '—'}</td>
                      <td>
                        <div className="ra-goods-pills">
                          {(v.goods || []).slice(0, 3).map(g => <span key={g} className="ra-goods-pill">{g}</span>)}
                          {(v.goods || []).length > 3 && <span className="ra-goods-pill ra-goods-pill--more">+{v.goods.length - 3}</span>}
                          {(!v.goods || v.goods.length === 0) && <span style={{ opacity: 0.4 }}>—</span>}
                        </div>
                      </td>
                      <td><span className={`ra-crit-badge ra-crit-badge--${v.dependency_level === 'Critical' ? 'high' : v.dependency_level === 'Important' ? 'medium' : 'low'}`}>{v.dependency_level}</span></td>
                      <td>{v.single_source ? <span className="ra-threat-cell"> Single</span> : <span className="ra-safe-cell">Multi</span>}</td>
                      <td>{threatened ? <span className="ra-threat-cell animate-pulse"> THREAT</span> : <span className="ra-safe-cell"> Clear</span>}</td>
                      <td>
                        <div className="ra-row-actions">
                          <button onClick={() => openEditVend(i)} className="ra-btn-icon"></button>
                          <button onClick={() => setVendors(v2 => v2.filter((_, j) => j !== i))} className="ra-btn-icon"></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {vendors.length > 0 && (
          <div className="ra-stats-row">
            <div className="ra-stat-pill ra-stat-pill--high">
              <span>{vendors.filter(v => v.single_source).length}</span>
              <span>Single-Source</span>
            </div>
            {DEPENDENCY_LEVELS.map(d => (
              <div key={d} className={`ra-stat-pill ra-stat-pill--${d === 'Critical' ? 'high' : d === 'Important' ? 'medium' : 'low'}`}>
                <span>{vendors.filter(v => v.dependency_level === d).length}</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 
// STEP 4 — IT Dependencies
// 
function StepIT({ profile, setP, activeThreats = [] }) {
  const itSystems = [
    ...(profile.key_systems || []),
    ...(profile.cloud_providers || [])
  ].filter(Boolean);

  const threatenedIT = itSystems.filter(sys => {
    const words = sys.toLowerCase().split(' ').filter(w => w.length > 2);
    return activeThreats.some(a => {
      const text = `${a.title || ''} ${a.ai?.hazard || ''} ${a.ai?.reasoning || ''} ${a.body || ''}`.toLowerCase();
      return words.some(w => text.includes(w));
    });
  });

  return (
    <div className="ra-form-grid">
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Internal IT Dependencies</h2>
          <p className="ra-section-desc">Document critical applications, security controls, and cloud infrastructure</p>
        </div>

        {threatenedIT.length > 0 && (
          <div style={{ marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div>
              <strong style={{ fontSize: 11, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active IT Threat Warning ({threatenedIT.length})
              </strong>
              <p style={{ fontSize: 11, color: '#b91c1c', margin: '2px 0 0' }}>
                Live intel feed detected active alerts targeting your registered IT systems / Cloud Providers: <strong>{threatenedIT.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="ra-fields-grid">
          <div className="ra-field">
            <label className="ra-label">Number of Critical Applications</label>
            <input className="ra-input" type="number" min="0" value={profile.critical_apps} onChange={e => setP('critical_apps', e.target.value)} placeholder="e.g. 12" />
          </div>
          <div className="ra-field">
            <label className="ra-label">Backup Strategy</label>
            <select className="ra-select" value={profile.backup_strategy} onChange={e => setP('backup_strategy', e.target.value)}>
              {BACKUP_STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="ra-field ra-field--full">
            <TagInput
              label="Key IT Systems"
              tags={profile.key_systems || []}
              presets={SYSTEM_PRESETS}
              onAdd={s => setP('key_systems', [...(profile.key_systems || []), s])}
              onRemove={s => setP('key_systems', (profile.key_systems || []).filter(x => x !== s))}
              placeholder="e.g. SAP, Salesforce…"
            />
          </div>
          <div className="ra-field ra-field--full">
            <TagInput
              label="Cloud Providers"
              tags={profile.cloud_providers || []}
              presets={CLOUD_PRESETS}
              onAdd={s => setP('cloud_providers', [...(profile.cloud_providers || []), s])}
              onRemove={s => setP('cloud_providers', (profile.cloud_providers || []).filter(x => x !== s))}
              placeholder="e.g. AWS, Azure…"
            />
          </div>
        </div>
        <div className="ra-fields-grid" style={{ marginTop: 8 }}>
          <div className="ra-field ra-field--full">
            <Toggle
              label="MFA Implemented"
              value={profile.mfa_implemented}
              onChange={v => setP('mfa_implemented', v)}
              description="Multi-factor authentication enforced across all critical systems"
            />
          </div>
        </div>
        <div className="ra-it-controls-legend">
          <div className={`ra-control-pill ${profile.mfa_implemented ? 'ra-control-pill--green' : 'ra-control-pill--red'}`}>
            {profile.mfa_implemented ? '' : ''} MFA
          </div>
          <div className={`ra-control-pill ${profile.backup_strategy !== 'None' ? 'ra-control-pill--green' : 'ra-control-pill--red'}`}>
            {profile.backup_strategy !== 'None' ? '' : ''} Backups ({profile.backup_strategy})
          </div>
          <div className={`ra-control-pill ${(profile.cloud_providers || []).length > 1 ? 'ra-control-pill--green' : (profile.cloud_providers || []).length === 1 ? 'ra-control-pill--yellow' : 'ra-control-pill--red'}`}>
             {(profile.cloud_providers || []).length === 0 ? 'No Cloud' : (profile.cloud_providers || []).length === 1 ? 'Single Cloud (risk)' : 'Multi-Cloud '}
          </div>
        </div>
      </div>
    </div>
  );
}

// 
// STEP 5 — Risk Summary
// 
function StepSummary({ profile, locations, vendors, riskScore, activeThreats }) {
  const c = scoreColor(riskScore);

  // Location Risk Matrix — rows=locations, find matching threats
  const locationMatrix = locations.map(loc => {
    const threats = activeThreats.filter(a =>
      checkThreatMatch(loc, a)
    );
    return { ...loc, threats };
  });

  // Vendor Threats
  const vendorThreats = vendors.map(v => {
    const threats = activeThreats.filter(a =>
      regionMatchesText(a.ai?.region, v.vendor_city, v.vendor_country)
    );
    return { ...v, threats };
  });

  return (
    <div className="ra-form-grid">
      {/* Risk Score */}
      <div className="ra-section-card ra-score-card">
        <div className="ra-score-header">
          <h2 className="ra-section-title">Overall Risk Score</h2>
          <p className="ra-section-desc">Computed from supply chain exposure, IT controls, and geographic risk factors</p>
        </div>
        <div className="ra-score-body">
          <RiskScoreRing score={riskScore} />
          
          {/* Risk Reference Ranges */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '11px',
            minWidth: '170px',
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '9px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Risk Ranges</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#ef4444' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                Critical
              </span>
              <span style={{ color: '#64748b', fontWeight: '700' }}>70 – 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#f97316' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316' }} />
                High
              </span>
              <span style={{ color: '#64748b', fontWeight: '700' }}>45 – 69</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#eab308' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }} />
                Moderate
              </span>
              <span style={{ color: '#64748b', fontWeight: '700' }}>25 – 44</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#22c55e' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                Low
              </span>
              <span style={{ color: '#64748b', fontWeight: '700' }}>0 – 24</span>
            </div>
          </div>

          <div className="ra-score-breakdown">
            <div className="ra-breakdown-item">
              <span>Single-source vendors</span>
              <span className="ra-breakdown-val" style={{ color: vendors.filter(v=>v.single_source).length > 0 ? '#ef4444' : '#22c55e' }}>
                {vendors.filter(v=>v.single_source).length}
              </span>
            </div>
            <div className="ra-breakdown-item">
              <span>Critical vendors</span>
              <span className="ra-breakdown-val">{vendors.filter(v=>v.dependency_level==='Critical').length}</span>
            </div>
            <div className="ra-breakdown-item">
              <span>High-criticality locations</span>
              <span className="ra-breakdown-val" style={{ color: locations.filter(l=>l.criticality==='High').length > 0 ? '#f97316' : '#22c55e' }}>
                {locations.filter(l=>l.criticality==='High').length}
              </span>
            </div>
            <div className="ra-breakdown-item">
              <span>MFA Implemented</span>
              <span className="ra-breakdown-val" style={{ color: profile.mfa_implemented ? '#22c55e' : '#ef4444' }}>
                {profile.mfa_implemented ? ' Yes' : ' No'}
              </span>
            </div>
            <div className="ra-breakdown-item">
              <span>Backup Strategy</span>
              <span className="ra-breakdown-val" style={{ color: profile.backup_strategy !== 'None' ? '#22c55e' : '#ef4444' }}>
                {profile.backup_strategy}
              </span>
            </div>
            <div className="ra-breakdown-item">
              <span>Cloud Providers</span>
              <span className="ra-breakdown-val">{(profile.cloud_providers||[]).join(', ') || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Threat Correlations */}
      <div className="ra-section-card">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Active Threat Correlations</h2>
          <p className="ra-section-desc">Live alerts from the Dashboard matched against your registered locations and vendors</p>
        </div>
        {activeThreats.length === 0 ? (
          <div className="ra-empty-card">
            <span style={{ fontSize: 28 }}></span>
            <p>No active threats detected in your registered zones</p>
          </div>
        ) : (
          <div className="ra-threat-list">
            {activeThreats.map((a, i) => (
              <div key={i} className="ra-threat-card">
                <div className="ra-threat-card-header">
                  <span className="ra-threat-hazard">{a.ai?.hazard || 'Threat'}</span>
                  <span className={`ra-threat-urgency ra-threat-urgency--${(a.ai?.urgency||'LOW').toLowerCase()}`}>{a.ai?.urgency}</span>
                </div>
                <p className="ra-threat-title">{a.title}</p>
                <div className="ra-threat-meta">
                  <span> {a.ai?.region}</span>
                  <span>· Confidence: {a.ai?.confidence}%</span>
                </div>
                {a.ai?.reasoning && <p className="ra-threat-reason">"{a.ai.reasoning}"</p>}
                {/* Which assets are affected */}
                <div className="ra-threat-affected">
                  {locationMatrix.filter(l => l.threats.some(t => t === a)).map((l, j) => (
                    <span key={j} className="ra-affected-loc"> {l.city || l.country} ({l.location_type})</span>
                  ))}
                  {vendorThreats.filter(v => v.threats.some(t => t === a)).map((v, j) => (
                    <span key={j} className="ra-affected-vend"> {v.vendor_name}</span>
                  ))}
                  {itDependencies.filter(sys => {
                    const words = sys.toLowerCase().split(' ').filter(w => w.length > 2);
                    const text = `${a.title || ''} ${a.ai?.hazard || ''} ${a.ai?.reasoning || ''} ${a.body || ''}`.toLowerCase();
                    return words.some(w => text.includes(w));
                  }).map((sys, j) => (
                    <span key={`it-${j}`} className="ra-affected-vend" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                      💻 IT System: {sys}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* World Map */}
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Real-Time World Map</h2>
          <p className="ra-section-desc">Live map of your company's global footprint — HQ, operational locations, vendors, and active threat zones</p>
        </div>
        <RiskWorldMap profile={profile} locations={locations} vendors={vendors} threats={activeThreats} />
      </div>

      {/* Dependency Graph */}
      <div className="ra-section-card ra-section-card--full">
        <div className="ra-section-header">
          <span className="ra-section-icon"></span>
          <h2 className="ra-section-title">Dependency Map</h2>
          <p className="ra-section-desc">Visual network of your company's operational locations and vendor dependencies</p>
        </div>
        {locations.length === 0 && vendors.length === 0 ? (
          <div className="ra-empty-card">
            <span style={{ fontSize: 28 }}></span>
            <p>Add locations and vendors to generate the dependency map</p>
          </div>
        ) : (
          <DependencyGraph profile={profile} locations={locations} vendors={vendors} threats={activeThreats} />
        )}
      </div>

      {/* Location Risk Matrix */}
      {locations.length > 0 && (
        <div className="ra-section-card ra-section-card--full">
          <div className="ra-section-header">
          <span className="ra-section-icon"></span>
            <h2 className="ra-section-title">Location Risk Matrix</h2>
            <p className="ra-section-desc">Cross-reference of all registered locations against active threat categories</p>
          </div>
          <div className="ra-matrix-wrap">
            <table className="ra-table ra-matrix-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Headcount</th>
                  <th>Criticality</th>
                  <th>Active Threats</th>
                  <th>Hazard Types</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {locationMatrix.map((loc, i) => {
                  const hasHigh = loc.threats.some(t => t.ai?.urgency === 'HIGH');
                  const hasMed = loc.threats.some(t => t.ai?.urgency === 'MED');
                  const hazards = [...new Set(loc.threats.map(t => t.ai?.hazard).filter(Boolean))];
                  const rowRisk = loc.threats.length > 0 ? (hasHigh ? 'CRITICAL' : hasMed ? 'ELEVATED' : 'MONITORED') : (loc.criticality === 'High' ? 'WATCH' : 'CLEAR');
                  const riskStyle = {
                    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                    ELEVATED: { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
                    MONITORED: { color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
                    WATCH:    { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
                    CLEAR:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                  }[rowRisk];
                  return (
                    <tr key={i} style={{ background: loc.threats.length > 0 ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td><strong>{loc.city || '—'}</strong><br/><span style={{ fontSize: 11, opacity: 0.5 }}>{loc.country}</span></td>
                      <td><span className="ra-type-badge">{loc.location_type}</span></td>
                      <td>{loc.headcount !== undefined && loc.headcount !== '' ? Number(loc.headcount).toLocaleString() : '—'}</td>
                      <td><span className={`ra-crit-badge ra-crit-badge--${loc.criticality.toLowerCase()}`}>{loc.criticality}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        {loc.threats.length > 0
                          ? <span style={{ color: '#ef4444', fontWeight: 700 }}>{loc.threats.length}</span>
                          : <span style={{ opacity: 0.3 }}>0</span>}
                      </td>
                      <td>
                        <div className="ra-goods-pills">
                          {hazards.slice(0, 3).map(h => <span key={h} className="ra-goods-pill" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{h}</span>)}
                          {hazards.length === 0 && <span style={{ opacity: 0.3 }}>None</span>}
                        </div>
                      </td>
                      <td>
                        <span className="ra-risk-level-badge" style={{ color: riskStyle.color, background: riskStyle.bg }}>
                          {rowRisk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
