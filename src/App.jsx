import React, { useState, useEffect, useRef } from 'react';
import { COUNTRIES } from './data/countries';
import { regionsByCountry } from './data/regions';
import { citiesByState } from './data/cities';
import { CURATED_CATEGORIES } from './data/categories';
import { CURATED_CONCEPTS, CONCEPT_GROUPS } from './data/concepts';
import { geocodeCity, getCitiesInRadius } from './services/geoRadius';
import Sidebar from './Sidebar';
import MapsPage from './MapsPage';
import EmployeesPage from './EmployeesPage';
import RiskAssessmentPage from './RiskAssessmentPage';
import EarthquakeResponsePage from './EarthquakeResponsePage';
import SystemLogsPage from './SystemLogsPage';

import { TOP_SOURCES } from './data/sources';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import { supabase } from './lib/supabase';

//  Operational Constants 
const TACTICAL_LIBRARY = [
  'Natural Disaster', 'Wildfire', 'Flood', 'Earthquake', 'Hurricane', 'Tornado', 'Heatwave',
  'Tsunami', 'Landslide', 'Drought', 'Blizzard', 'Avalanche', 'Volcanic Eruption',
  'Cyber Attack', 'Data Breach', 'Explosion', 'Chemical Spill', 'Power Outage',
  'Terrorism', 'Aviation Accident', 'Train Derailment', 'Industrial Accident',
  'Dubai', 'Saudi Arabia', 'UAE', 'India', 'USA',
  'Rain', 'Heavy Rain', 'Storm', 'Monsoon', 'Cyclone', 'Typhoon', 'Thunderstorm',
  'Lightning', 'Snowstorm', 'Hail', 'Mudslide', 'Sinkhole', 'Pandemic', 'Epidemic',
  'Outbreak', 'Oil Spill', 'Gas Leak', 'Radiation Leak', 'Nuclear Incident',
  'Building Collapse', 'Dam Failure', 'War', 'Airstrike', 'Civil Unrest', 'Riot',
  'Protest', 'Active Shooter', 'Kidnapping', 'Assassination'
];

const HAZARD_CONCEPT_URIS = {
  'natural disaster': 'http://en.wikipedia.org/wiki/Natural_disaster',
  'wildfire': 'http://en.wikipedia.org/wiki/Wildfire',
  'flood': 'http://en.wikipedia.org/wiki/Flood',
  'earthquake': 'http://en.wikipedia.org/wiki/Earthquake',
  'hurricane': 'http://en.wikipedia.org/wiki/Tropical_cyclone',
  'tornado': 'http://en.wikipedia.org/wiki/Tornado',
  'heatwave': 'http://en.wikipedia.org/wiki/Heat_wave',
  'tsunami': 'http://en.wikipedia.org/wiki/Tsunami',
  'landslide': 'http://en.wikipedia.org/wiki/Landslide',
  'drought': 'http://en.wikipedia.org/wiki/Drought',
  'blizzard': 'http://en.wikipedia.org/wiki/Blizzard',
  'avalanche': 'http://en.wikipedia.org/wiki/Avalanche',
  'volcanic eruption': 'http://en.wikipedia.org/wiki/Volcanic_eruption',
  'cyber attack': 'http://en.wikipedia.org/wiki/Cyberattack',
  'data breach': 'http://en.wikipedia.org/wiki/Data_breach',
  'explosion': 'http://en.wikipedia.org/wiki/Explosion',
  'chemical spill': 'http://en.wikipedia.org/wiki/Chemical_spill',
  'power outage': 'http://en.wikipedia.org/wiki/Power_outage',
  'terrorism': 'http://en.wikipedia.org/wiki/Terrorism',
  'aviation accident': 'http://en.wikipedia.org/wiki/Aviation_accidents_and_incidents',
  'train derailment': 'http://en.wikipedia.org/wiki/Train_derailment',
  'industrial accident': 'http://en.wikipedia.org/wiki/Industrial_accident',
  'rain': 'http://en.wikipedia.org/wiki/Rain',
  'heavy rain': 'http://en.wikipedia.org/wiki/Rain',
  'storm': 'http://en.wikipedia.org/wiki/Storm',
  'monsoon': 'http://en.wikipedia.org/wiki/Monsoon',
  'cyclone': 'http://en.wikipedia.org/wiki/Tropical_cyclone',
  'typhoon': 'http://en.wikipedia.org/wiki/Typhoon',
  'thunderstorm': 'http://en.wikipedia.org/wiki/Thunderstorm',
  'lightning': 'http://en.wikipedia.org/wiki/Lightning',
  'snowstorm': 'http://en.wikipedia.org/wiki/Winter_storm',
  'hail': 'http://en.wikipedia.org/wiki/Hail',
  'mudslide': 'http://en.wikipedia.org/wiki/Mudflow',
  'sinkhole': 'http://en.wikipedia.org/wiki/Sinkhole',
  'pandemic': 'http://en.wikipedia.org/wiki/Pandemic',
  'epidemic': 'http://en.wikipedia.org/wiki/Epidemic',
  'outbreak': 'http://en.wikipedia.org/wiki/Outbreak',
  'oil spill': 'http://en.wikipedia.org/wiki/Oil_spill',
  'gas leak': 'http://en.wikipedia.org/wiki/Gas_leak',
  'radiation leak': 'http://en.wikipedia.org/wiki/Nuclear_and_radiation_accidents_and_incidents',
  'nuclear incident': 'http://en.wikipedia.org/wiki/Nuclear_and_radiation_accidents_and_incidents',
  'building collapse': 'http://en.wikipedia.org/wiki/Building_collapse',
  'dam failure': 'http://en.wikipedia.org/wiki/Dam_failure',
  'war': 'http://en.wikipedia.org/wiki/War',
  'airstrike': 'http://en.wikipedia.org/wiki/Airstrike',
  'civil unrest': 'http://en.wikipedia.org/wiki/Civil_unrest',
  'riot': 'http://en.wikipedia.org/wiki/Riot',
  'protest': 'http://en.wikipedia.org/wiki/Protest',
  'active shooter': 'http://en.wikipedia.org/wiki/Active_shooter',
  'kidnapping': 'http://en.wikipedia.org/wiki/Kidnapping',
  'assassination': 'http://en.wikipedia.org/wiki/Assassination',
};

const CONCEPT_EXPANSIONS = {
  // Natural Disaster
  'http://en.wikipedia.org/wiki/Natural_disaster': [
    'http://en.wikipedia.org/wiki/Natural_disaster',
    'http://en.wikipedia.org/wiki/Earthquake',
    'http://en.wikipedia.org/wiki/Tsunami',
    'http://en.wikipedia.org/wiki/Tropical_cyclone',
    'http://en.wikipedia.org/wiki/Hurricane',
    'http://en.wikipedia.org/wiki/Tornado',
    'http://en.wikipedia.org/wiki/Wildfire',
    'http://en.wikipedia.org/wiki/Flood',
    'http://en.wikipedia.org/wiki/Flash_flood',
    'http://en.wikipedia.org/wiki/Landslide',
    'http://en.wikipedia.org/wiki/Volcanic_eruption',
    'http://en.wikipedia.org/wiki/Avalanche',
    'http://en.wikipedia.org/wiki/Drought',
    'http://en.wikipedia.org/wiki/Heat_wave',
    'http://en.wikipedia.org/wiki/Blizzard',
    'http://en.wikipedia.org/wiki/Dust_storm',
    'http://en.wikipedia.org/wiki/Sinkhole'
  ],
  // Monsoon / Rain / Flood / Storm expansions
  'http://en.wikipedia.org/wiki/Monsoon': [
    'http://en.wikipedia.org/wiki/Monsoon'
  ],
  'http://en.wikipedia.org/wiki/Flood': [
    'http://en.wikipedia.org/wiki/Flood',
    'http://en.wikipedia.org/wiki/Flash_flood'
  ],
  'http://en.wikipedia.org/wiki/Rain': [
    'http://en.wikipedia.org/wiki/Rain'
  ],
  'http://en.wikipedia.org/wiki/Storm': [
    'http://en.wikipedia.org/wiki/Storm',
    'http://en.wikipedia.org/wiki/Thunderstorm'
  ],
  'http://en.wikipedia.org/wiki/Tropical_cyclone': [
    'http://en.wikipedia.org/wiki/Tropical_cyclone',
    'http://en.wikipedia.org/wiki/Typhoon',
    'http://en.wikipedia.org/wiki/Hurricane'
  ],
  // Cyberattack
  'http://en.wikipedia.org/wiki/Cyberattack': [
    'http://en.wikipedia.org/wiki/Cyberattack',
    'http://en.wikipedia.org/wiki/Cybercrime',
    'http://en.wikipedia.org/wiki/Data_breach',
    'http://en.wikipedia.org/wiki/Ransomware',
    'http://en.wikipedia.org/wiki/Malware',
    'http://en.wikipedia.org/wiki/Phishing',
    'http://en.wikipedia.org/wiki/Hacker'
  ],
  // Infectious disease
  'http://en.wikipedia.org/wiki/Infectious_disease': [
    'http://en.wikipedia.org/wiki/Infectious_disease',
    'http://en.wikipedia.org/wiki/Pandemic',
    'http://en.wikipedia.org/wiki/Epidemic',
    'http://en.wikipedia.org/wiki/Outbreak',
    'http://en.wikipedia.org/wiki/COVID-19',
    'http://en.wikipedia.org/wiki/Ebola_virus_disease',
    'http://en.wikipedia.org/wiki/Mpox',
    'http://en.wikipedia.org/wiki/Tuberculosis',
    'http://en.wikipedia.org/wiki/Cholera'
  ],
  // Climate change
  'http://en.wikipedia.org/wiki/Climate_change': [
    'http://en.wikipedia.org/wiki/Climate_change',
    'http://en.wikipedia.org/wiki/Global_warming',
    'http://en.wikipedia.org/wiki/Air_pollution',
    'http://en.wikipedia.org/wiki/Water_pollution',
    'http://en.wikipedia.org/wiki/Oil_spill',
    'http://en.wikipedia.org/wiki/Deforestation'
  ],
  // War / Armed Conflict
  'http://en.wikipedia.org/wiki/War': [
    'http://en.wikipedia.org/wiki/War',
    'http://en.wikipedia.org/wiki/Armed_conflict',
    'http://en.wikipedia.org/wiki/Civil_war',
    'http://en.wikipedia.org/wiki/Terrorism',
    'http://en.wikipedia.org/wiki/Terrorist_attack',
    'http://en.wikipedia.org/wiki/Insurgency',
    'http://en.wikipedia.org/wiki/Genocide',
    'http://en.wikipedia.org/wiki/Military_operation',
    'http://en.wikipedia.org/wiki/Airstrike',
    'http://en.wikipedia.org/wiki/Drone_strike'
  ],
  'http://en.wikipedia.org/wiki/Armed_conflict': [
    'http://en.wikipedia.org/wiki/Armed_conflict',
    'http://en.wikipedia.org/wiki/War',
    'http://en.wikipedia.org/wiki/Civil_war',
    'http://en.wikipedia.org/wiki/Terrorism',
    'http://en.wikipedia.org/wiki/Terrorist_attack',
    'http://en.wikipedia.org/wiki/Insurgency',
    'http://en.wikipedia.org/wiki/Genocide',
    'http://en.wikipedia.org/wiki/Military_operation',
    'http://en.wikipedia.org/wiki/Airstrike',
    'http://en.wikipedia.org/wiki/Drone_strike'
  ],
  // Terrorism
  'http://en.wikipedia.org/wiki/Terrorism': [
    'http://en.wikipedia.org/wiki/Terrorism',
    'http://en.wikipedia.org/wiki/Terrorist_attack',
    'http://en.wikipedia.org/wiki/Hostage',
    'http://en.wikipedia.org/wiki/Assassination',
    'http://en.wikipedia.org/wiki/Kidnapping'
  ],
  // Industrial accident
  'http://en.wikipedia.org/wiki/Industrial_accident': [
    'http://en.wikipedia.org/wiki/Industrial_accident',
    'http://en.wikipedia.org/wiki/Explosion',
    'http://en.wikipedia.org/wiki/Nuclear_and_radiation_accidents_and_incidents',
    'http://en.wikipedia.org/wiki/Chemical_spill',
    'http://en.wikipedia.org/wiki/Building_collapse',
    'http://en.wikipedia.org/wiki/Mining_accident',
    'http://en.wikipedia.org/wiki/Gas_leak',
    'http://en.wikipedia.org/wiki/Shipwreck',
    'http://en.wikipedia.org/wiki/Train_wreck',
    'http://en.wikipedia.org/wiki/Aviation_accidents_and_incidents',
    'http://en.wikipedia.org/wiki/Traffic_collision'
  ]
};


//  TACTICAL EOC NEURAL PROMPT (V12 - EOC REASONING ENGINE & ZERO FALSE-NEGATIVE BIAS)
const BATCH_CLASSIFY_PROMPT = (topic, location, expandedZones = []) => {
  const zoneList = expandedZones.length > 1
    ? `"${location}" and surrounding zone (${expandedZones.slice(0, 8).join(', ')})`
    : `"${location}"`;
  const currentDate = new Date().toISOString().split('T')[0];

  return `[ROLE: EOC PRINCIPAL THREAT INTELLIGENCE ANALYST]
PRIMARY OPERATIONAL DIRECTIVE: MINIMIZE FALSE NEGATIVES. A missed meteorological warning, government alert, or upcoming hazard forecast is a CRITICAL SYSTEM FAILURE. When uncertain between ALERT and INFORMATIVE, ALWAYS DEFAULT TO ALERT.

CURRENT DATE: ${currentDate}
TARGET ZONE: ${zoneList} | MONITORING TOPICS: "${topic}"

=== EOC ANALYST 10-STEP INTERNAL REASONING ENGINE ===
Before generating JSON, evaluate each article through this 10-step operational decision hierarchy:
1. OPERATIONAL THREAT: Is there an active hazard, developing event, or expected physical/cyber threat?
2. OFFICIAL AUTHORITY: Is the report issued by or citing official bodies (e.g., IMD, NDMA, NDRF, USGS, NOAA, NWS, SDMA, Met Dept, Hydrology, Forest Dept, Police, Fire, Military, Coast Guard, WHO, Ministries, Port/Airport Authorities)?
3. FORECAST & PREDICTIVE SIGNALS: Does the text contain advisory/predictive terms (warning, watch, advisory, forecast, predicted, expected, likely, anticipated, risk, danger, monitoring, tracking, forming, developing, intensifying, red/orange/yellow alert, heavy rainfall, flash flood, cyclone, heatwave, landslide risk, river overflow, reservoir release, evacuation, preparedness, stay indoors, travel advisories, closures)?
4. PREDICTIVE TIMELINE: Is an event expected within hours or days, even if zero damage has occurred yet?
5. PREPAREDNESS & STAGING: Are authorities or communities mobilizing, issuing advisories, or pre-positioning assets?
6. TARGET ZONE RELEVANCE: Does the event or forecast directly affect, border, or approach ${zoneList}?
7. INFRASTRUCTURE RISK: Could transit, power, telecom, water, logistics, or public facilities be impacted?
8. POPULATION RISK: Does the scenario present potential risk to life, personnel mobility, or employee safety?
9. SEVERITY & URGENCY EVALUATION: Calculate risk severity and determine urgency (HIGH, MED, LOW).
10. FINAL CLASSIFICATION:
    - ALERT: Active disaster OR official warning/watch/advisory/forecast OR predictive hazard language OR official preparedness notice for the target zone.
    - INFORMATIVE: Historical analysis, policy updates, or post-disaster retrospective with ZERO active or forecasted risk.
    - IRRELEVANT: Geographically unrelated to ${zoneList} with no direct threat implication.

=== CLASSIFICATION OPERATIONAL MANDATES ===
- OFFICIAL FORECASTS = ALERT ALWAYS: Any watch, warning, advisory, or forecast issued by a meteorological or emergency authority for today or upcoming days is ALWAYS ALERT, never INFORMATIVE.
- PREPAREDNESS & TRACKING = ALERT ALWAYS: Reports of authorities tracking storms, managing reservoir releases, or issuing precautionary notices = ALERT.
- OLD / PAST THREATS = INFORMATIVE: Each article includes an "article_date" field. Compare it against CURRENT DATE (${currentDate}). If the article_date is more than 7 days old AND the article describes a completed/resolved event (e.g. an earthquake that already happened, a storm that already passed, a flood that already receded), classify it as INFORMATIVE. If the threat is ongoing, recurring, or the article is a warning/advisory, still classify as ALERT.
- PRE-INCIDENT MITIGATION FOCUS: "mitigation" and "citizen_action" MUST focus strictly on PRE-INCIDENT PREPAREDNESS & PREVENTATIVE ACTIONS (actions to take BEFORE impact to reduce harm). Never output "N/A", "Unknown", or vague text.

=== OUTPUT SCHEMA ===
Return ONLY a valid JSON array matching the exact input order, including the input "id" for each object. Do not include markdown code fences or conversational text outside the JSON array.

[
  {
    "id": 0,
    "classification": "ALERT|INFORMATIVE|IRRELEVANT",
    "hazard": "Specific Hazard Type (e.g. Heavy Rain Warning, Cyclone Watch, Flash Flood Risk)",
    "region": "Specific City, State, Country",
    "exact_location": "Extract the specific city, town, district, province, or landmark mentioned anywhere in the world (e.g. Shinjuku Tokyo, Frankfurt, Manhattan New York, Houston, Sydney, Pathanamthitta, Dadar Mumbai, Munich, Osaka). Do not output generic country names if a specific city/town is mentioned.",
    "reasoning": "1-2 sentence EOC operational rationale citing official authority, timeline, and threat level",
    "mitigation": "Actionable pre-incident operational protocols for emergency response teams & organizations",
    "citizen_action": "Actionable pre-hazard safety measures for citizens and employees",
    "confidence": 0-100,
    "urgency": "HIGH|MED|LOW"
  }
]`;
};



const DURATIONS = [
  { label: '1H', value: '1h', days: 0.04 },
  { label: '24H', value: '24h', days: 1 },
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 }
];
const PROVIDERS = [
  { id: 'groq-20b', label: 'GROQ 20B FAST', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'openai/gpt-oss-20b' },
  { id: 'groq-120b', label: 'GROQ 120B', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'openai/gpt-oss-120b' },
  { id: 'groq-compound', label: 'GROQ COMPOUND', endpoint: 'https://api.groq.com/openai/v1/chat/completions', model: 'groq/compound' },
  { id: 'openrouter', label: 'OPENROUTER', endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.3-70b-instruct:free' },
  { id: 'deepseek', label: 'DEEPSEEK', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' }
];

const ENHANCED_COUNTRIES = [
  ...COUNTRIES,
  { name: 'United Arab Emirates', code: 'AE' }
].filter((c, i, a) => a.findIndex(t => t.code === c.code) === i);

// Country name extractor helper (same as MapsPage.jsx)
function extractCountry(region) {
  if (!region || region.toLowerCase() === 'global') return null;
  const parts = region.split(',').map(p => p.trim()).reverse(); // Last token first
  for (const part of parts) {
    const match = ENHANCED_COUNTRIES.find(c =>
      c.name.toLowerCase() === part.toLowerCase() ||
      (c.name.toLowerCase().includes(part.toLowerCase()) && part.length > 4)
    );
    if (match) return match.name;
  }
  // Fallback: check if any country name is contained anywhere in the region string
  const regionLower = region.toLowerCase();
  const fuzzy = ENHANCED_COUNTRIES.find(c => regionLower.includes(c.name.toLowerCase()) && c.name.length > 3);
  return fuzzy ? fuzzy.name : null;
}

const ENHANCED_REGIONS = {
  ...regionsByCountry,
  'AE': [
    { label: 'Dubai', uri: 'http://en.wikipedia.org/wiki/Dubai' },
    { label: 'Abu Dhabi', uri: 'http://en.wikipedia.org/wiki/Abu_Dhabi' },
    { label: 'Sharjah', uri: 'http://en.wikipedia.org/wiki/Sharjah' }
  ]
};

//  Branding 
const Logo = ({ className = "h-16" }) => (
  <img
    src="/alertem-logo.png"
    alt="AlertEm Logo"
    className={`${className} object-contain`}
  />
);

//  Components 

function MultiSelect({ label, options = [], selected = [], onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = (options || []).filter(o =>
    (o.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.code || '').toLowerCase() === search.toLowerCase()
  );
  return (
    <div className={`relative flex-1 min-w-[140px] ${disabled ? 'opacity-40' : ''}`}>
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">{label} {selected.length > 0 && <span className="text-red-600">({selected.length})</span>}</label>
      <div onClick={() => !disabled && setOpen(!open)} className="h-10 w-full bg-white border border-gray-100 rounded-xl px-3 flex items-center justify-between cursor-pointer hover:border-red-500/20 transition-all shadow-sm overflow-hidden text-[10px] font-bold">
        <div className="flex gap-1 overflow-hidden">
          {!selected.length ? <span className="text-gray-300">{placeholder}</span> :
            selected.map(s => <span key={s.uri || s.label} className="bg-red-50 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">{s.label}</span>)}
        </div>
        <svg className={`w-3 h-3 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
      </div>
      {open && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full p-2 text-[10px] border-b border-gray-50 outline-none mb-1" onClick={e => e.stopPropagation()} />
          {filtered.map(opt => (
            <button key={opt.uri || opt.label} onClick={() => {
              const exists = selected.find(s => (s.uri || s.label) === (opt.uri || opt.label));
              onChange(exists ? selected.filter(s => (s.uri || s.label) !== (opt.uri || opt.label)) : [...selected, opt]);
            }} className={`w-full text-left px-3 py-2 text-[10px] rounded-lg hover:bg-gray-50 transition-colors ${selected.find(s => (s.uri || s.label) === (opt.uri || opt.label)) ? 'text-red-600 font-bold bg-red-50' : 'text-gray-600'}`}>{opt.label}</button>
          ))}
        </div>
      )}
      {open && <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />}
    </div>
  );
}

function TagInput({ label, tags = [], onAdd, onRemove, suggestionsLibrary = [] }) {
  const [input, setInput] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestions = suggestionsLibrary.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));
  const addTag = (t) => { if (t && !tags.includes(t)) onAdd(t); setInput(''); setShowSuggest(false); };
  return (
    <div className="flex-1 min-w-[200px] relative">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">{label} ({tags.length})</label>
      <div className="min-h-[40px] w-full bg-white border border-gray-100 rounded-xl px-2 py-1 flex flex-wrap gap-1 items-center shadow-sm focus-within:border-red-500/20 transition-all">
        {tags.map(t => (
          <span key={t} className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
            {t} <button onClick={() => onRemove(t)} className="hover:text-red-200">×</button>
          </span>
        ))}
        <input
          type="text" value={input} onChange={e => { setInput(e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(input.trim()); }}
          placeholder="Type & Enter..." className="flex-1 bg-transparent border-none text-[10px] font-bold outline-none min-w-[60px] p-1"
        />
      </div>
      {showSuggest && input.trim() && suggestions.length > 0 && (
        <div className="absolute z-[110] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl p-1 max-h-40 overflow-y-auto">
          {suggestions.map(s => (
            <button key={s} onClick={() => addTag(s)} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">{s}</button>
          ))}
        </div>
      )}
      {showSuggest && <div className="fixed inset-0 z-[100]" onClick={() => setShowSuggest(false)} />}
    </div>
  );
}

//  Source domain helpers (module-level so JSX renders can always use them) 
const normalizeDomain = (uri) => {
  if (!uri) return '';
  return uri.toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .split('/')[0]
    .replace(/\.$/, '');
};
const domainMatch = (apiUri, storedUri) => {
  const a = normalizeDomain(apiUri);
  const b = normalizeDomain(storedUri);
  if (!a || !b) return false;
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
};

const isGovernmentSource = (sourceObj) => {
  if (!sourceObj) return false;
  const uri = sourceObj.uri || '';
  if (!uri) return false;
  const domain = normalizeDomain(uri);
  // Standard government domains
  if (/\.gov(\.[a-z]{2})?$/.test(domain)) return true;
  // Known non-.gov international bodies or government entities
  const govDomains = ['who.int', 'gdacs.org'];
  return govDomains.some(gd => domainMatch(domain, gd));
};

const isNationalGovernmentSource = (sourceObj, selectedCountries = []) => {
  if (!isGovernmentSource(sourceObj)) return false;
  const uri = sourceObj.uri || '';
  const domain = normalizeDomain(uri);

  if (selectedCountries && selectedCountries.length > 0) {
    return selectedCountries.some(country => {
      const code = (country.code || '').toLowerCase();
      // Standard government suffix check
      if (code && domain.endsWith(`.gov.${code}`)) return true;
      // US special case
      if (code === 'us' && (domain.endsWith('.gov') || domain === 'weather.gov' || domain === 'fema.gov' || domain === 'usgs.gov')) return true;
      return false;
    });
  }
  // Default fallback (e.g. treat India as local default)
  return domain.endsWith('.gov.in') || domain === 'ndma.gov.in' || domain === 'imd.gov.in';
};

const repairJSONNewlines = (str) => {
  if (!str) return '';
  let insideString = false;
  let escaped = false;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      insideString = !insideString;
    }

    if (insideString && char === '\n') {
      result += '\\n';
    } else if (insideString && char === '\r') {
      result += '\\r';
    } else {
      result += char;
    }

    if (char === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }
  return result;
};



function ConceptInput({ label, concepts = [], onChange }) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter all groups based on search term
  const filteredGroups = input.trim()
    ? CONCEPT_GROUPS
      .map(g => ({
        ...g,
        concepts: g.concepts.filter(
          c => c.label.toLowerCase().includes(input.toLowerCase()) &&
            !concepts.find(x => x.uri === c.uri)
        )
      }))
      .filter(g => g.concepts.length > 0)
    : CONCEPT_GROUPS.map(g => ({
      ...g,
      concepts: g.concepts.filter(c => !concepts.find(x => x.uri === c.uri))
    })).filter(g => g.concepts.length > 0);

  const addConcept = (concept) => {
    if (!concepts.find(x => x.uri === concept.uri)) {
      onChange([...concepts, concept]);
    }
    setInput('')
    // keep dropdown open so user can add more
  };

  const addCustom = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const known = CURATED_CONCEPTS.find(
      c => c.label.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() ===
        trimmed.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
    );
    const concept = known || {
      label: trimmed,
      uri: `http://en.wikipedia.org/wiki/${trimmed.replace(/ /g, '_')}`
    };
    addConcept(concept);
  };

  const removeConcept = (uri) => onChange(concepts.filter(c => c.uri !== uri));

  return (
    <div className="relative" style={{ minWidth: 260 }}>
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
        {label} {concepts.length > 0 && <span className="text-purple-600">({concepts.length})</span>}
      </label>

      {/* Selected concept chips */}
      <div
        className="min-h-[40px] w-full bg-white border border-gray-100 rounded-xl px-2 py-1 flex flex-wrap gap-1 items-center shadow-sm focus-within:border-purple-300 transition-all cursor-text"
        onClick={() => setShowDropdown(true)}
      >
        {concepts.map(c => (
          <span
            key={c.uri}
            className="bg-purple-50 border border-purple-200 text-purple-700 text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap"
          >
            <span className="text-purple-400"></span> {c.label}
            <button
              onClick={e => { e.stopPropagation(); removeConcept(c.uri); }}
              className="ml-0.5 text-purple-400 hover:text-purple-700 leading-none"
            >×</button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') addCustom();
            if (e.key === 'Escape') setShowDropdown(false);
          }}
          placeholder={concepts.length === 0 ? 'Search concepts...' : 'Add more...'}
          className="flex-1 bg-transparent border-none text-[10px] font-bold outline-none min-w-[110px] p-1 placeholder-gray-300"
        />
      </div>

      {/* Grouped dropdown */}
      {showDropdown && (
        <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: 380, overflowY: 'auto', minWidth: 320 }}>
          {/* Header */}
          <div className="sticky top-0 bg-purple-600 px-3 py-2 flex items-center justify-between z-10">
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              {input.trim() ? `Results for "${input}"` : `All Concepts (${CURATED_CONCEPTS.length})`}
            </span>
            <button onClick={() => setShowDropdown(false)} className="text-purple-200 hover:text-white text-sm leading-none">×</button>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="p-4">
              <button
                onClick={addCustom}
                className="w-full text-left px-3 py-2 text-[10px] rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
              >
                <span className="text-purple-400 text-[8px]"></span>
                <div>
                  <span className="font-black text-purple-700">{input.trim()}</span>
                  <span className="text-[8px] text-gray-400 ml-2">(add as custom concept)</span>
                </div>
              </button>
            </div>
          ) : (
            filteredGroups.map(g => (
              <div key={g.group}>
                {/* Group header */}
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky" style={{ top: 33 }}>
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{g.group}</span>
                </div>
                {/* Concepts in this group */}
                <div className="py-1">
                  {g.concepts.map(c => (
                    <button
                      key={c.uri}
                      onClick={() => addConcept(c)}
                      className="w-full text-left px-4 py-2 text-[10px] hover:bg-purple-50 transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-purple-300 group-hover:text-purple-500 text-[8px] shrink-0"></span>
                      <span className="font-semibold text-gray-700 group-hover:text-purple-700">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {showDropdown && <div className="fixed inset-0 z-[100]" onClick={() => setShowDropdown(false)} />}
    </div>
  );
}

//  Search Query Bar (visual display of active filters) 
function SearchQueryBar({ keywords, concepts, locs, states, cities, cats }) {
  const allTokens = [];

  keywords.forEach(kw => allTokens.push({ type: 'keyword', label: kw }));
  concepts.forEach(c => allTokens.push({ type: 'concept', label: c.label }));
  [...cities, ...states, ...locs].forEach(l => allTokens.push({ type: 'location', label: l.label }));
  cats.forEach(c => allTokens.push({ type: 'category', label: c.label }));

  if (allTokens.length === 0) return null;

  const colorMap = {
    keyword: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '' },
    concept: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '' },
    location: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '' },
    category: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '' },
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Your search query</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {allTokens.map((tok, i) => {
          const c = colorMap[tok.type];
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[8px] font-black text-gray-400 uppercase">AND</span>}
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black ${c.bg} ${c.border} ${c.text} whitespace-nowrap`}>
                <span className="opacity-60">{c.icon}</span> {tok.label}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {concepts.length > 0 && <span className="text-[8px] text-purple-500 font-bold"> Concepts match ALL articles tagged with those Wikipedia topics</span>}
        {keywords.length > 0 && <span className="text-[8px] text-orange-500 font-bold"> Keywords match article text</span>}
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ALERTEM_UI_CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white text-center font-sans space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-lg font-black uppercase tracking-widest text-red-400">Operational Dashboard Exception</h2>
            <p className="text-xs font-mono text-slate-300 bg-slate-800 p-4 rounded-xl border border-slate-700 text-left overflow-auto max-h-36 break-words">
              {this.state.error?.toString() || 'Unknown UI Error'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
          >
            Reload Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

//  Main Application 

function AppMain() {
  const { user, session, organization, member, loading: authLoading, signOut } = useAuth();
  const [configExpanded, setConfigExpanded] = useState(true);
  const [newsKey, setNewsKey] = useState(() => import.meta.env.VITE_NEWSAPI_KEY || '');
  const [aiKey, setAiKey] = useState('');
  const [provider, setProvider] = useState('groq-120b');
  const [keywords, setKeywords] = useState(['wildfire']);
  const [zonesInput, setZonesInput] = useState('');
  const [params, setParams] = useState({ cats: [], locs: [], states: [], cities: [], dur: '30d', prefSrc: [], concepts: [] });
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [rawArticles, setRawArticles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [error, setErrorState] = useState('');
  const [systemLogs, setSystemLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alertem_system_logs') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('alertem_system_logs', JSON.stringify(systemLogs.slice(0, 300))); } catch (e) { console.error(e); }
  }, [systemLogs]);

  const addLog = async (type, title, message, details = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      type, // 'AUTH', 'ANALYSIS', 'CONFIG', 'ERROR', 'INFO'
      title: title || type,
      message,
      details
    };
    setSystemLogs(prev => [logEntry, ...prev]);

    if (organization?.id) {
      try {
        await supabase.from('system_logs').insert([{
          org_id: organization.id,
          user_id: user?.id,
          log_type: type,
          title: title || type,
          message: message,
          details: details
        }]);
      } catch (e) {
        console.warn('Silent log sync warning:', e);
      }
    }
  };

  const setError = (msg) => {
    setErrorState(msg);
    if (msg && typeof msg === 'string' && msg.trim()) {
      const isProgress = msg.includes('Analyzing batch') || msg.includes('Expanding radius') || msg.includes('geocoding');
      if (!isProgress) {
        const isStatusInfo = msg.startsWith(' Finding') || msg.startsWith(' Could not') || msg.startsWith(' Expanding');
        addLog(isStatusInfo ? 'INFO' : 'ERROR', isStatusInfo ? 'System Status' : 'System Error', msg);
      }
    }
  };
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState(5);
  const [pushedAlerts, setPushedAlerts] = useState(new Set());
  const [radius, setRadius] = useState(0);
  const [expandedZones, setExpandedZones] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [govExpanded, setGovExpanded] = useState(true);
  const [preferredExpanded, setPreferredExpanded] = useState(true);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const [govArticles, setGovArticles] = useState([]); // standalone gov-source articles fetched in parallel
  const [employees, setEmployees] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alertem_employees') || '[]'); } catch { return []; }
  });
  const [dispatchedAlerts, setDispatchedAlerts] = useState({});
  const [emailDraft, setEmailDraft] = useState(null);

  const pushToEmployee = (articleId, employeeId) => {
    setDispatchedAlerts(prev => ({
      ...prev,
      [`${articleId}-${employeeId}`]: true
    }));
  };

  useEffect(() => {
    localStorage.setItem('alertem_employees', JSON.stringify(employees));
  }, [employees]);

  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  // Load saved profiles from localStorage on mount & page changes
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('alertem_risk_profiles') || '[]');
      setSavedProfiles(stored);
      if (stored.length > 0 && !selectedProfileId) {
        setSelectedProfileId(String(stored[0].id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [activePage]);

  // Populates values from selected profile
  const populateFromProfile = (targetProfile) => {
    if (!targetProfile) return;
    const { profile, locations = [], vendors = [] } = targetProfile;

    // 1. Unique Countries
    const countries = new Set();
    if (profile.hq_country) countries.add(profile.hq_country.trim().toLowerCase());
    locations.forEach(l => { if (l.country) countries.add(l.country.trim().toLowerCase()); });
    vendors.forEach(v => { if (v.vendor_country) countries.add(v.vendor_country.trim().toLowerCase()); });

    const matchedLocs = [];
    countries.forEach(cName => {
      const match = ENHANCED_COUNTRIES.find(c => c.name.toLowerCase() === cName);
      if (match) {
        const cleanWikiName = match.wikiName || match.name.split(' (')[0].trim();
        matchedLocs.push({ label: match.name, code: match.code, uri: match.uri || `http://en.wikipedia.org/wiki/${cleanWikiName.replace(/ /g, '_')}` });
      }
    });

    // 2. Unique Cities/Locations for Target Zones
    const cities = new Set();
    if (profile.hq_city) cities.add(profile.hq_city.trim());
    locations.forEach(l => { if (l.city) cities.add(l.city.trim()); });
    vendors.forEach(v => { if (v.vendor_city) cities.add(v.vendor_city.trim()); });

    const zonesStr = Array.from(cities).filter(Boolean).join(', ');

    setParams(prev => ({
      ...prev,
      locs: matchedLocs
    }));
    setZonesInput(zonesStr);
    addLog('CONFIG', 'Risk Profile Loaded', `Loaded company location configuration for "${targetProfile.profile?.company_name || 'Selected Profile'}"`, {
      company: targetProfile.profile?.company_name,
      matchedCountries: matchedLocs.map(l => l.label),
      zonesCount: cities.size
    });
  };

  // Sync state if activePage changes or profile changes
  useEffect(() => {
    if (activePage !== 'dashboard') return;
    if (selectedProfileId === 'none') {
      setParams(prev => ({ ...prev, locs: [] }));
      setZonesInput('');
      return;
    }
    if (savedProfiles.length > 0) {
      const current = savedProfiles.find(p => String(p.id) === String(selectedProfileId)) || savedProfiles[0];
      if (current) {
        populateFromProfile(current);
        if (selectedProfileId !== String(current.id)) {
          setSelectedProfileId(String(current.id));
        }
      }
    }
  }, [activePage, selectedProfileId, savedProfiles]);

  const handleSelectProfile = (profileId) => {
    setSelectedProfileId(profileId);
  };


  const masterProcessedRef = useRef([]);
  const seenTitlesRef = useRef(new Set());

  const countryList = (ENHANCED_COUNTRIES || []).map(c => {
    const cleanWikiName = c.wikiName || c.name.split(' (')[0].trim();
    return {
      label: c.name,
      code: c.code,
      uri: c.uri || `http://en.wikipedia.org/wiki/${cleanWikiName.replace(/ /g, '_')}`
    };
  });
  const stateList = (params.locs || []).reduce((acc, c) => [...acc, ...(ENHANCED_REGIONS[c.code] || [])], []);
  const cityList = (params.states || []).reduce((acc, s) => {
    const cities = citiesByState[s.label] || [];
    return [...acc, ...cities.map(city => ({ label: city, keyword: city, uri: `http://en.wikipedia.org/wiki/${city.replace(/ /g, '_')}` }))];
  }, []);

  const activeArticle = (selectedIdx !== null && articles[selectedIdx]) ? articles[selectedIdx] : null;

  const alertsCount = articles.filter(a => a?.ai?.classification === 'ALERT').length;
  const reportsCount = articles.filter(a => a?.ai?.classification === 'INFORMATIVE').length;

  useEffect(() => {
    if (!autoPilot || !user) return;
    const interval = setInterval(() => {
      handleExecute(true);
    }, autoPilotInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoPilot, autoPilotInterval, user, newsKey, aiKey, keywords, params, zonesInput, provider]);

  const handleExecute = async (isAuto = false) => {
    if (!newsKey || !aiKey) return setError('Configuration Incomplete');
    if (!keywords.length && !params.concepts.length && !params.locs.length && !params.cats.length) return setError('Add at least one keyword, concept, or location');
    
    const activeProviderObj = PROVIDERS.find(p => p.id === provider);
    const querySummary = {
      hazards: [...(keywords || [])],
      concepts: (params.concepts || []).map(c => c?.label || c || ''),
      country: (params.locs || []).map(l => l?.label || l || '').filter(Boolean).join(', ') || 'Global',
      state: (params.states || []).map(s => s?.label || s || '').filter(Boolean).join(', ') || 'All Regions',
      city: (params.cities || []).map(c => c?.label || c || '').filter(Boolean).join(', ') || 'All Cities',
      duration: params.dur,
      sortBy: sortBy,
      radius: radius > 0 ? `${radius} km` : 'Disabled',
      targetZones: zonesInput || 'None',
      provider: activeProviderObj?.label || provider,
      isAuto: isAuto
    };

    addLog('ANALYSIS', isAuto ? 'Auto-Pilot Scan Launched' : 'Manual Analysis Launched', `Initiated scanning with ${activeProviderObj?.label || provider} for ${keywords.join(', ') || 'concepts'} in ${querySummary.country}`, querySummary);

    setLoading(true);
    setError('');
    if (!isAuto) {
      setArticles([]);
      setGovArticles([]);
      setSelectedIdx(null);
      masterProcessedRef.current = [];
      seenTitlesRef.current = new Set();
    }

    const activeZones = zonesInput.split(',').map(z => z.trim()).filter(Boolean);

    //  RADIUS EXPANSION 
    let expandedZoneKeywords = [...activeZones];
    // Determine the best available location name for geocoding:
    // Priority: Target Zones input > City dropdown > State dropdown > Country dropdown
    const geocodeTarget = activeZones[0]
      || params.cities[0]?.label
      || params.states[0]?.label
      || params.locs[0]?.label
      || null;

    if (radius > 0 && geocodeTarget) {
      setError(' Expanding radius zone — geocoding...');
      const geo = await geocodeCity(geocodeTarget);
      if (geo) {
        setError(` Finding cities within ${radius}km of ${geocodeTarget}...`);
        const nearbyCities = await getCitiesInRadius(geo.lat, geo.lon, radius);
        expandedZoneKeywords = [...new Set([...activeZones, ...nearbyCities])];
        setExpandedZones(expandedZoneKeywords);
      } else {
        setError(` Could not geocode "${geocodeTarget}" — using exact name only.`);
        await new Promise(r => setTimeout(r, 1500));
      }
    } else {
      setExpandedZones([]);
    }
    setError('');

    try {
      const dateStart = new Date(Date.now() - (DURATIONS.find(d => d.value === params.dur)?.days || 1) * 86400000).toISOString().split('T')[0];
      const dateEnd = new Date().toISOString().split('T')[0];

      // 1. Bounded Date Filter
      const queryParts = [{ "dateStart": dateStart, "dateEnd": dateEnd }];

      // 2. Concepts filter (broad umbrella topics from dropdown)
      if (params.concepts.length > 0) {
        const conceptUris = [...new Set(params.concepts.flatMap(c => CONCEPT_EXPANSIONS[c.uri] || [c.uri]))];
        const conceptParts = conceptUris.map(uri => ({ "conceptUri": uri }));
        if (conceptParts.length === 1) {
          queryParts.push(conceptParts[0]);
        } else {
          queryParts.push({ "$or": conceptParts });
        }
      }

      // 3. Keywords / Hazards mapping to conceptUri where available, fallback to keyword
      if (keywords.length > 0) {
        const keywordParts = [];
        const seenUris = new Set();
        keywords.forEach(kw => {
          const normalized = kw.toLowerCase().trim();
          const conceptUri = HAZARD_CONCEPT_URIS[normalized];
          if (conceptUri) {
            const expanded = CONCEPT_EXPANSIONS[conceptUri] || [conceptUri];
            expanded.forEach(uri => {
              if (!seenUris.has(uri)) {
                seenUris.add(uri);
                keywordParts.push({ "conceptUri": uri });
              }
            });
          }
          // Always include literal keyword text so body matches aren't missed
          keywordParts.push({ "keyword": kw });
        });
        if (keywordParts.length === 1) {
          queryParts.push(keywordParts[0]);
        } else {
          queryParts.push({ "$or": keywordParts });
        }
      }

      // 3. Locations mapping using conceptUri
      if (params.cities.length) {
        queryParts.push({ "$or": params.cities.map(c => ({ "conceptUri": c.uri })) });
      } else if (params.states.length) {
        queryParts.push({ "$or": params.states.map(s => ({ "conceptUri": s.uri })) });
      } else if (params.locs.length) {
        queryParts.push({ "$or": params.locs.map(l => ({ "conceptUri": l.uri })) });
      }

      // 3b. Local Target Zones filter (e.g. Dadar)
      if (activeZones.length > 0) {
        const zoneParts = activeZones.map(z => ({ "keyword": z }));
        queryParts.push({ "$or": zoneParts });
      }

      // 4. Categories mapping
      if (params.cats.length) {
        queryParts.push({ "$or": params.cats.map(c => ({ "categoryUri": c.uri })) });
      }

      // 5. Add expanded radius zone cities as conceptUri conditions
      if (expandedZoneKeywords.length > activeZones.length) {
        const radiusCities = expandedZoneKeywords.filter(z => !activeZones.includes(z));
        if (radiusCities.length > 0) {
          queryParts.push({ "$or": radiusCities.map(city => ({ "conceptUri": `http://en.wikipedia.org/wiki/${city.replace(/ /g, '_')}` })) });
        }
      }



      // TACTICAL DUAL FETCH LOGIC
      const fetchNews = async (qParts, count) => {
        let res;
        for (let attempts = 0; attempts < 2; attempts++) {
          try {
            // lang MUST be inside $query.$and — $filter does NOT support lang in EventRegistry AQL
            const allConditions = [{ "lang": "eng" }, ...qParts];

            const queryBlock = {
              "$query": allConditions.length === 1
                ? allConditions[0]
                : { "$and": allConditions }
            };

            const body = {
              apiKey: newsKey,
              action: "getArticles",
              articlesCount: count,
              articlesSortBy: sortBy,
              resultType: "articles",
              dataType: ["news"],
              articleBodyLen: 1000,
              keywordSearchMode: "simple",
              query: queryBlock
            };
            console.log("AlertEm NewsAPI Request:", JSON.stringify(body, null, 2));
            res = await fetch(`/news-proxy`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            if (res.ok) {
              const data = await res.json();
              // Client-side safety net: strip any non-English articles that slip through
              if (data?.articles?.results) {
                data.articles.results = data.articles.results.filter(
                  a => !a.lang || a.lang === 'eng'
                );
              }
              return data;
            } else {
              let errDetail = `HTTP ${res.status}`;
              try {
                const errBody = await res.json();
                if (errBody?.error) errDetail = errBody.error;
              } catch (_) {}
              throw new Error(errDetail);
            }
          } catch (e) {
            console.warn(`[NewsAPI Attempt ${attempts + 1} Failed]:`, e.message);
            if (attempts === 1) throw new Error(e.message || `Unable to reach News API. Please check network connection.`);
            await new Promise(r => setTimeout(r, 1500));
          }
        }
        throw new Error(`Unable to fetch articles from News API.`);
      };

      let raw = [];
      if (params.prefSrc && params.prefSrc.length > 0) {
        //  sourceUri inside $query/$or is the correct EventRegistry syntax for POST requests
        const srcFilter = { "$or": params.prefSrc.map(s => ({ "sourceUri": s.uri })) };
        const prefParts = [...queryParts, srcFilter];
        // genRes EXCLUDES preferred sources with $not — ensures Other Sources always has articles
        const excludeFilter = { "$not": { "$or": params.prefSrc.map(s => ({ "sourceUri": s.uri })) } };
        const genParts = [...queryParts, excludeFilter];
        const [prefRes, genRes] = await Promise.all([
          fetchNews(prefParts, 100).catch(e => { console.warn("Pref Source Error", e); return null; }),
          fetchNews(genParts, 100).catch(e => { console.warn("Gen Source Error", e); return null; })
        ]);
        const prefArticles = prefRes?.articles?.results || [];
        const genArticles = genRes?.articles?.results || [];
        console.log(` Preferred: ${prefArticles.length} | Other sources: ${genArticles.length}`);
        if (prefArticles.length > 0) {
          console.log('Preferred source URIs sample:', prefArticles.slice(0, 3).map(a => a.source?.uri));
          console.log('Other source URIs sample:', genArticles.slice(0, 3).map(a => a.source?.uri));
        }
        if (prefArticles.length === 0) {
          setError(` No articles from ${params.prefSrc.map(s => s.label || s.uri).join(', ')} for this query. Showing all sources.`);
          await new Promise(r => setTimeout(r, 2500));
          setError('');
          raw = genArticles;
        } else {
          // preferred articles come first → Authentic Resources; genArticles → Other Sources
          raw = [...prefArticles, ...genArticles];
        }
      } else {
        const genRes = await fetchNews(queryParts, 100).catch(e => { throw e; });
        raw = genRes?.articles?.results || [];
      }

      // If strict Target Zone search returned 0 articles, retry query without strict zone keyword condition
      if (!raw.length && activeZones.length > 0) {
        console.log('[News Fetch] Strict Target Zone query returned 0 articles. Falling back to broader State/Country query...');
        const broaderParts = queryParts.filter(p => !p['$or'] || !p['$or'].some(item => item.keyword && activeZones.includes(item.keyword)));
        try {
          const fallbackRes = await fetchNews(broaderParts, 100);
          raw = fallbackRes?.articles?.results || [];
        } catch (_) {}
      }

      if (!raw.length) throw new Error('NO ARTICLES FOUND');

      // ── PARALLEL GOVERNMENT NEWS FETCH ───────────────────────────────────────
      // Fetch from who.int (only indexed gov source in sandbox) using same keywords.
      // We do this regardless of preferred source selection so gov panel is always populated.
      (() => {
        const GOV_SOURCES_INDEXED = ['who.int'];
        // Also include any user-selected gov sources that might have articles
        const userGovSrcs = (params.prefSrc || []).filter(s => isGovernmentSource(s));
        const allGovUris = [...new Set([...GOV_SOURCES_INDEXED, ...userGovSrcs.map(s => s.uri)])];

        // Build keyword-based query for gov fetch (no conceptUri — broader match)
        const govKeywordParts = [
          ...keywords.map(kw => ({ keyword: kw })),
          ...params.concepts.map(c => ({ conceptUri: c.uri }))
        ];
        const govQueryParts = [
          { dateStart: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0], dateEnd: new Date().toISOString().split('T')[0] },
          { '$or': allGovUris.map(uri => ({ sourceUri: uri })) }
        ];
        // If we have keywords, add them as OR filter
        if (govKeywordParts.length > 0) {
          govQueryParts.push({ '$or': govKeywordParts });
        }

        fetchNews(govQueryParts, 20)
          .then(govRes => {
            const govRaw = (govRes?.articles?.results || []).filter(a => !a.lang || a.lang === 'eng');
            console.log(`[Gov Fetch] who.int + selected gov sources → ${govRaw.length} articles`);
            if (govRaw.length > 0) {
              setGovArticles(govRaw);
            }
          })
          .catch(e => console.warn('[Gov Fetch] silent fail:', e.message));
      })();
      // ─────────────────────────────────────────────────────────────────────────

      const seen = new Set();
      let uniqueRaw = raw.filter(art => {
        const key = art.title.toLowerCase().trim();
        if (seen.has(key) || seenTitlesRef.current.has(key)) return false;
        seen.add(key);
        seenTitlesRef.current.add(key);
        return true;
      });

      // (Removed strict client-side keyword filter to rely on NewsAPI's deeper body search)

      if (!uniqueRaw.length) {
        setLoading(false);
        return;
      }

      // Limit max raw articles for fast AI response (top 70 articles)
      const targetRaw = uniqueRaw.slice(0, 70);

      const processed = [];
      const activeProvider = PROVIDERS.find(p => p.id === provider);
      const locationContext = [...params.cities, ...params.states, ...params.locs].map(l => l.label).join(', ') || 'Global';

      // Neural Batch Processing with Token-Guard & Live Progress
      const chunkSize = 7;
      const totalBatches = Math.ceil(targetRaw.length / chunkSize);

      for (let i = 0; i < targetRaw.length; i += chunkSize) {
        const chunk = targetRaw.slice(i, i + chunkSize);

        try {
          await new Promise(r => setTimeout(r, 500)); // Smooth throttle

          const payload = chunk.map((a, idx) => ({ id: idx, title: a.title, body: (a.body || '').slice(0, 1000), article_date: a.dateTime || a.date || '' }));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);
          let aiRes;

          try {
            aiRes = await fetch(activeProvider.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
              signal: controller.signal,
              body: JSON.stringify({
                model: activeProvider.model,
                temperature: 0.1,
                messages: [
                  { role: 'system', content: BATCH_CLASSIFY_PROMPT([...keywords, ...params.concepts.map(c => c.label)].join(', '), locationContext, expandedZoneKeywords) },
                  { role: 'user', content: JSON.stringify(payload) }
                ]
              })
            });
          } finally {
            clearTimeout(timeoutId);
          }

          if (!aiRes.ok) {
            const errData = await aiRes.json().catch(() => ({}));
            const msg = errData.error?.message || aiRes.statusText;
            if (aiRes.status === 429) {
              setError("DAILY AI LIMIT REACHED. SWITCH PROVIDER OR WAIT 24H.");
              break;
            }
            console.warn(`Batch ${currentBatch} AI error: ${msg}. Using defaults.`);
          }

          const aiData = aiRes.ok ? await aiRes.json() : null;
          const rawContent = aiData?.choices?.[0]?.message?.content || '';

          // ── Stage 1: Strip reasoning <think> blocks & markdown fences ──────────
          let strippedContent = rawContent
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim();

          // ── Stage 2: Extract JSON array [...]  ───────────────────────────────
          let jsonStr = null;
          const firstBracket = strippedContent.indexOf('[');
          const lastBracket = strippedContent.lastIndexOf(']');

          if (firstBracket !== -1 && lastBracket > firstBracket) {
            jsonStr = strippedContent.slice(firstBracket, lastBracket + 1);
          }

          // ── Stage 3: Collect individual {...} objects as array fallback ────────
          // Handles: single object, truncated arrays, or objects without wrapping []
          if (!jsonStr) {
            const objectMatches = [];
            let depth = 0, start = -1;
            for (let i = 0; i < strippedContent.length; i++) {
              if (strippedContent[i] === '{') {
                if (depth === 0) start = i;
                depth++;
              } else if (strippedContent[i] === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                  objectMatches.push(strippedContent.slice(start, i + 1));
                  start = -1;
                }
              }
            }
            if (objectMatches.length > 0) {
              jsonStr = `[${objectMatches.join(',')}]`;
            }
          }

          // ── Stage 4: Parse with progressive repair, fallback to defaults ─────
          let aiJsonArray;
          if (!jsonStr) {
            // Nothing extractable — use defaults for every article in this chunk
            console.warn("AI returned no parseable JSON. Using defaults for chunk. Raw:", rawContent.slice(0, 400));
            aiJsonArray = [];
          } else {
            // Repair raw newlines inside string values
            jsonStr = repairJSONNewlines(jsonStr);
            // Remove trailing commas before ] or }
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

            try {
              aiJsonArray = JSON.parse(jsonStr);
            } catch (parseErr) {
              try {
                // Strip any residual markdown tags inside the block
                const cleaned = jsonStr.replace(/```json|```/g, '').trim();
                aiJsonArray = JSON.parse(cleaned);
              } catch (secondErr) {
                // Last resort: extract objects one-by-one
                console.warn("Full JSON parse failed, falling back to object extraction.", parseErr.message);
                const objectMatches = [];
                let depth = 0, start = -1;
                for (let i = 0; i < jsonStr.length; i++) {
                  if (jsonStr[i] === '{') {
                    if (depth === 0) start = i;
                    depth++;
                  } else if (jsonStr[i] === '}') {
                    depth--;
                    if (depth === 0 && start !== -1) {
                      try { objectMatches.push(JSON.parse(jsonStr.slice(start, i + 1))); } catch (_) { }
                      start = -1;
                    }
                  }
                }
                if (objectMatches.length > 0) {
                  aiJsonArray = objectMatches;
                } else {
                  console.error("All JSON parsing strategies failed. Raw Output:", rawContent.slice(0, 400));
                  aiJsonArray = []; // use defaults for chunk
                }
              }
            }
          }

          chunk.forEach((art, idx) => {
            const aiJson = (Array.isArray(aiJsonArray) ? aiJsonArray.find(item => item && (item.id === idx || Number(item.id) === idx)) : null)
              || (aiJsonArray && aiJsonArray[idx])
              || { classification: 'INFORMATIVE', reasoning: 'Missing from batch', mitigation: 'Monitor status', citizen_action: 'Stay alert', urgency: 'LOW', hazard: 'General', region: locationContext };

            // REGION GUARD: Verify geographical relevance without falsely marking specific city/town articles as IRRELEVANT
            if (aiJson.classification !== 'IRRELEVANT' && locationContext !== 'Global') {
              const fullText = ((art.title || '') + ' ' + (art.body || '') + ' ' + (aiJson.region || '') + ' ' + (aiJson.exact_location || '') + ' ' + (aiJson.reasoning || '')).toLowerCase();
              const targetTokens = locationContext.toLowerCase().split(/[\s,]+/).filter(t => t.length > 2);

              // Include active target zones (e.g. Pathanamthitta) in valid target tokens
              activeZones.forEach(z => {
                if (z.length > 2) targetTokens.push(z.toLowerCase());
              });

              // Include known cities/districts of the target state (e.g. Kerala cities)
              if (locationContext.toLowerCase().includes('kerala')) {
                const KERALA_TOWNS = ['kerala', 'pathanamthitta', 'wayanad', 'kochi', 'cochin', 'trivandrum', 'thiruvananthapuram', 'kozhikode', 'calicut', 'thrissur', 'palakkad', 'kollam', 'alappuzha', 'alleppey', 'idukki', 'kottayam', 'malappuram', 'kannur', 'kasaragod', 'munnar', 'sabarimala', 'pamba', 'vythiri', 'meppadi', 'chooralmala', 'mundakkai', 'kuttanad', 'varkala', 'guruvayur'];
                targetTokens.push(...KERALA_TOWNS);
              }

              const isRelevant = targetTokens.some(token => fullText.includes(token));
              if (!isRelevant) {
                aiJson.classification = 'IRRELEVANT';
                aiJson.reasoning = `Region Mismatch: Intel focuses on another region rather than "${locationContext}".`;
              }
            }

            masterProcessedRef.current.push({ ...art, ai: aiJson });
          });
        } catch (e) {
          console.warn(`Batch processing exception: ${e.message}. Utilizing fallback defaults.`);
          chunk.forEach((art) => {
            masterProcessedRef.current.push({
              ...art,
              ai: { classification: 'INFORMATIVE', reasoning: 'AI batch processing fallback', mitigation: 'Monitor status', citizen_action: 'Stay alert', urgency: 'LOW', hazard: 'General', region: locationContext }
            });
          });
        }
      }

      // Consolidation Logic
      const groupedEvents = {};

      for (const art of masterProcessedRef.current) {
        const cls = art.ai.classification || 'INFORMATIVE';
        const hazard = (art.ai.hazard || 'General').toLowerCase().trim();
        const region = (art.ai.region || 'Global').toLowerCase().trim();
        const groupKey = `${cls}_${hazard}_${region}`;

        if (!groupedEvents[groupKey]) {
          groupedEvents[groupKey] = {
            id: groupKey,
            title: art.title,
            date: art.date,
            source: art.source,
            sources: [],
            isTargetZone: false,
            ai: {
              classification: cls,
              hazard: art.ai.hazard || 'General',
              region: art.ai.region || 'Global',
              urgency: art.ai.urgency || 'LOW',
              confidence: art.ai.confidence || 0,
              reasoning: art.ai.reasoning,
              mitigation: art.ai.mitigation,
              citizen_action: art.ai.citizen_action
            }
          };
        }

        if (activeZones.length > 0 && activeZones.some(z => (art.title + ' ' + (art.body || '')).toLowerCase().includes(z.toLowerCase()))) {
          groupedEvents[groupKey].isTargetZone = true;
        }

        const isValidText = (t) => t && typeof t === 'string' && t.trim().length > 3 && !['unknown', 'n/a', 'none', 'na'].includes(t.trim().toLowerCase());

        if (art.ai.urgency === 'HIGH') groupedEvents[groupKey].ai.urgency = 'HIGH';

        const artConfidence = art.ai.confidence || 0;
        const groupConfidence = groupedEvents[groupKey].ai.confidence || 0;
        const artHasMitigation = isValidText(art.ai.mitigation);
        const groupHasMitigation = isValidText(groupedEvents[groupKey].ai.mitigation);

        // Update if: higher confidence, OR current group has no valid mitigation but this article does
        if (artConfidence > groupConfidence || (!groupHasMitigation && artHasMitigation)) {
          groupedEvents[groupKey].ai.confidence = Math.max(artConfidence, groupConfidence);
          if (artHasMitigation) groupedEvents[groupKey].ai.mitigation = art.ai.mitigation;
          if (isValidText(art.ai.citizen_action)) groupedEvents[groupKey].ai.citizen_action = art.ai.citizen_action;
          if (isValidText(art.ai.reasoning)) groupedEvents[groupKey].ai.reasoning = art.ai.reasoning;
          groupedEvents[groupKey].source = art.source;
          groupedEvents[groupKey].title = art.title;
        }

        groupedEvents[groupKey].sources.push(art);
      }

      setRawArticles([...masterProcessedRef.current]);

      let finalEvents = Object.values(groupedEvents)
        .filter(a => a.ai.classification !== 'IRRELEVANT')
        .sort((a, b) => {
          if (sortBy === 'rel') return 0; // keep API relevance order
          if (sortBy === 'socialScore') {
            const scoreA = a.sources.reduce((sum, s) => sum + (s.shares?.facebook || 0), 0);
            const scoreB = b.sources.reduce((sum, s) => sum + (s.shares?.facebook || 0), 0);
            return scoreB - scoreA;
          }
          return new Date(b.date) - new Date(a.date); // default: date
        });
      setArticles(finalEvents);

      // AUTO-SELECT the highest priority alert for the Right-Side Solution Panel
      if (!isAuto) {
        const firstAlertIdx = finalEvents.findIndex(a => a.ai.classification === 'ALERT');
        setSelectedIdx(firstAlertIdx !== -1 ? firstAlertIdx : (finalEvents.length > 0 ? 0 : null));
      }

      const totalAnalyzed = masterProcessedRef.current.length;
      const alertsNum = masterProcessedRef.current.filter(a => a.ai?.classification === 'ALERT').length;
      const infoNum = masterProcessedRef.current.filter(a => a.ai?.classification === 'INFORMATIVE').length;
      const irrelevantNum = masterProcessedRef.current.filter(a => a.ai?.classification === 'IRRELEVANT').length;

      addLog('ANALYSIS', `Analysis Complete: ${alertsNum} Alerts Found`, `Analyzed ${totalAnalyzed} articles with ${activeProviderObj?.label || provider}: ${alertsNum} Alerts, ${infoNum} Info, ${irrelevantNum} Irrelevant`, {
        ...querySummary,
        totalRaw: raw.length,
        totalAnalyzed: totalAnalyzed,
        alertsCount: alertsNum,
        infoCount: infoNum,
        irrelevantCount: irrelevantNum
      });
    } catch (e) {
      console.error("ANALYSIS_CRASH:", e);
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Initializing AlertEm SaaS Session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderLedgerItem = (art) => {
    const i = art.originalIdx;
    return (
      <div key={i} onClick={() => setSelectedIdx(i)} className={`p-6 cursor-pointer transition-all hover:bg-gray-50 relative ${selectedIdx === i ? 'bg-red-50/30' : ''}`}>
        {selectedIdx === i && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600" />}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2 items-center">
            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${art.ai.classification === 'ALERT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{art.ai.classification}</span>
            {pushedAlerts.has(art.id) && <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase bg-green-500 text-white">PUSHED</span>}
          </div>
          <span className="text-[8px] font-bold text-gray-300">{new Date(art.date).toLocaleDateString()}</span>
        </div>
        <h3 className={`text-[11px] font-black leading-tight mb-2 ${art.ai.classification === 'ALERT' ? 'text-red-600' : 'text-gray-900'}`}>{art.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-gray-400 uppercase truncate block">
            {art.sources && art.sources.length > 1 ? `${art.sources.length} SOURCES` : (art.source?.title || 'Unknown Source')}
          </span>
          {art.ai.urgency === 'HIGH' && <span className="text-[7px] font-black text-red-600 animate-pulse">URGENT</span>}
        </div>
        <p className="mt-2 text-[8px] text-gray-500 italic line-clamp-2 leading-relaxed">Reason: {art.ai.reasoning}</p>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden text-gray-900">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        errorCount={systemLogs.filter(l => l.type === 'ERROR').length}
      />
      <div className="flex-1 flex flex-col overflow-hidden">

        {activePage === 'maps' && (
          <MapsPage
            articles={articles}
            expandedZones={expandedZones}
            geocodeCity={geocodeCity}
            employees={employees}
            pushedAlerts={pushedAlerts}
            onPushAlert={(articleId) => setPushedAlerts(prev => new Set([...prev, articleId]))}
            dispatchedAlerts={dispatchedAlerts}
            pushToEmployee={pushToEmployee}
            handleExecute={handleExecute}
            loading={loading}
            autoPilot={autoPilot}
            autoPilotInterval={autoPilotInterval}
            targetZone={zonesInput}
            radius={radius}
          />
        )}
        {activePage === 'employees' && <EmployeesPage employees={employees} setEmployees={setEmployees} />}
        {activePage === 'risk-assessment' && <RiskAssessmentPage articles={articles} />}
        {activePage === 'earthquake-response' && <EarthquakeResponsePage activeArticle={activeArticle} onNavigate={setActivePage} />}
        {activePage === 'system-logs' && (
          <SystemLogsPage
            logs={systemLogs}
            onClearLogs={() => {
              setSystemLogs([]);
              try { localStorage.removeItem('alertem_system_logs'); } catch (_) {}
            }}
          />
        )}
        {activePage === 'dashboard' && <>
          <header className="px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
              <Logo className="h-16" />
              {organization && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-wider">{organization.name}</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">{organization.plan || 'Free'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-gray-900 leading-none">{user?.email}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{member?.role || 'Analyst'}</p>
              </div>
              <button onClick={() => { addLog('AUTH', 'User Signed Out', 'Operational analyst session ended'); signOut(); }} className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest px-3 py-1.5 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 rounded-xl transition-all">Sign Out</button>
            </div>
          </header>

          <div className="p-4 pb-1 shrink-0">
            <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-xl shadow-gray-200/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                  <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Analysis Configuration</h2>
                  <button
                    onClick={() => setConfigExpanded(!configExpanded)}
                    className="ml-3 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                  >
                    {configExpanded ? 'Collapse Config ' : 'Expand Config '}
                  </button>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2 bg-red-50/50 border border-red-100 rounded-lg p-1 px-2.5">
                    <span className="text-[9px] font-black uppercase text-red-600">Company Profile ({savedProfiles.length}):</span>
                    <select
                      value={selectedProfileId}
                      onChange={e => handleSelectProfile(e.target.value)}
                      className="bg-transparent text-[10px] font-black text-red-700 outline-none cursor-pointer max-w-[170px] truncate"
                      disabled={savedProfiles.length === 0}
                    >
                      {savedProfiles.length === 0 ? (
                        <option value="" className="text-gray-400 font-semibold text-[10px]">
                          No profiles saved
                        </option>
                      ) : (
                        <>
                          <option value="none" className="text-gray-400 font-semibold text-[10px]">
                            None
                          </option>
                          {savedProfiles.map(p => (
                            <option key={p.id} value={p.id} className="text-gray-700 font-semibold text-[10px]">
                              {p.profile?.company_name || 'Unnamed'} ({p.risk_score || 0}/100)
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1 px-2">
                    <span className="text-[9px] font-black uppercase text-gray-400">Scan Every:</span>
                    <input
                      type="number"
                      value={autoPilotInterval}
                      onChange={e => setAutoPilotInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 bg-transparent text-[10px] font-bold text-center outline-none border-b border-gray-200"
                      min="1"
                    />
                    <span className="text-[9px] font-black uppercase text-gray-400">Min</span>
                  </div>
                  <button onClick={() => { const next = !autoPilot; setAutoPilot(next); addLog('CONFIG', `Auto-Pilot ${next ? 'Enabled' : 'Disabled'}`, `Scanning scheduled every ${autoPilotInterval} minutes`); }} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${autoPilot ? 'bg-red-600 text-white border-red-600 animate-pulse shadow-lg shadow-red-200' : 'text-gray-400 border-gray-200 hover:text-red-600 hover:border-red-600'}`}>
                    {autoPilot ? `Auto-Pilot: ON (${autoPilotInterval}m)` : 'Enable Auto-Pilot'}
                  </button>
                  <button onClick={() => { setKeywords(['wildfire']); setZonesInput(''); setParams({ cats: [], locs: [], states: [], cities: [], dur: '30d', prefSrc: [], concepts: [] }); addLog('CONFIG', 'Analysis Reset', 'Restored query inputs to baseline default parameters'); }} className="text-[9px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest">Reset Analysis</button>
                </div>
              </div>

              {configExpanded && (
                <>
                  <div className="flex items-start gap-4 flex-wrap">
                    <TagInput label="Target Hazards" tags={keywords} onAdd={t => setKeywords([...new Set([...keywords, t])])} onRemove={t => setKeywords(keywords.filter(k => k !== t))} suggestionsLibrary={TACTICAL_LIBRARY} />
                    <ConceptInput label=" Concepts" concepts={params.concepts} onChange={v => setParams(p => ({ ...p, concepts: v }))} />
                    <MultiSelect label="Source" options={TOP_SOURCES} selected={params.prefSrc} onChange={v => setParams(p => ({ ...p, prefSrc: v }))} placeholder="Any Source" />
                    <MultiSelect label="Categories" options={CURATED_CATEGORIES} selected={params.cats} onChange={v => setParams(p => ({ ...p, cats: v }))} placeholder="All Sectors" />
                    <MultiSelect label="Country" options={countryList} selected={params.locs} onChange={v => setParams(p => ({ ...p, locs: v }))} placeholder="Global" />
                    <MultiSelect label="State / Region" options={stateList} selected={params.states} onChange={v => setParams(p => ({ ...p, states: v }))} placeholder="All Regions" disabled={!params.locs.length} />
                    <MultiSelect label="City" options={cityList} selected={params.cities} onChange={v => setParams(p => ({ ...p, cities: v }))} placeholder="All Cities" disabled={!params.states.length} />
                    <div className="w-32">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Duration</label>
                      <select value={params.dur} onChange={e => setParams(p => ({ ...p, dur: e.target.value }))} className="h-10 w-full bg-white border border-gray-100 text-[10px] font-black rounded-xl px-3 outline-none cursor-pointer">
                        {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="w-40">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Sort Results By</label>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="h-10 w-full bg-white border border-gray-100 text-[10px] font-black rounded-xl px-3 outline-none cursor-pointer"
                      >
                        <option value="date"> Date</option>
                        <option value="rel"> Relevance</option>
                        <option value="socialScore"> Social Shares</option>
                      </select>
                    </div>
                    <div className="w-56">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Target Zones (Local)</label>
                      <input type="text" value={zonesInput} onChange={e => setZonesInput(e.target.value)} placeholder="e.g. Bangalore" className="h-10 w-full bg-white border border-gray-100 text-[10px] font-bold rounded-xl px-3 outline-none" />
                    </div>
                    <div className="w-36">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
                        Search Radius (km) {radius > 0 && <span className="text-red-600"> {radius}km</span>}
                      </label>
                      <input
                        id="radius-input"
                        type="number"
                        value={radius}
                        onChange={e => setRadius(Math.min(500, Math.max(0, Number(e.target.value))))}
                        placeholder="0 = disabled"
                        min="0" max="500" step="25"
                        className={`h-10 w-full bg-white border text-[10px] font-bold rounded-xl px-3 outline-none transition-all ${radius > 0 ? 'border-red-400 text-red-600' : 'border-gray-100'
                          }`}
                      />
                      {expandedZones.length > 1 && (
                        <p className="text-[7px] font-bold text-green-600 mt-1 ml-1">{expandedZones.length} zones active</p>
                      )}
                    </div>
                    <button onClick={() => handleExecute(false)} disabled={loading} className="h-10 px-8 mt-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 min-w-[150px] justify-center">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Analyzing...
                        </span>
                      ) : (
                        <>Run Analysis <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                      )}
                    </button>
                  </div>

                  <SearchQueryBar
                    keywords={keywords}
                    concepts={params.concepts}
                    locs={params.locs}
                    states={params.states}
                    cities={params.cities}
                    cats={params.cats}
                  />

                  <div className="flex items-center gap-4 pt-2 border-t border-gray-50 overflow-x-auto pb-1">
                    <input type="password" value={newsKey} onChange={e => setNewsKey(e.target.value)} placeholder="NewsAPI Token" className="min-w-[150px] flex-1 h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[10px] font-mono outline-none" />
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
                      {PROVIDERS.map(p => (
                        <button key={p.id} onClick={() => setProvider(p.id)} className={`px-4 h-8 text-[8px] font-black uppercase rounded-lg transition-all ${provider === p.id ? 'bg-white text-red-600 shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}>{p.label}</button>
                      ))}
                    </div>
                    <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder={`${PROVIDERS.find(p => p.id === provider)?.label} API Key`} className="min-w-[150px] flex-[1.5] h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[10px] font-mono outline-none" />
                  </div>
                </>
              )}
            </div>
          </div>

          <main className="flex-1 flex overflow-hidden p-6 gap-6 bg-gray-50/50">
            {/* SECTOR 1: SOURCES (Authentic vs Other) */}
            <section className="w-[30%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg relative">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Sources</span>
                {params.prefSrc?.length > 0 && rawArticles.length > 0 && (() => {
                  // Count unique preferred articles at raw level (not inflated by event grouping)
                  const seen = new Set();
                  let totalPreferred = 0;
                  rawArticles.forEach(a => {
                    if (params.prefSrc.some(ps => domainMatch(a.source?.uri, ps.uri))) {
                      const key = a.title?.toLowerCase().trim();
                      if (key && !seen.has(key)) { seen.add(key); totalPreferred++; }
                    }
                  });
                  const selectedPreferred = activeArticle
                    ? activeArticle.sources.filter(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))).length
                    : 0;
                  return totalPreferred > 0 ? (
                    <span className="text-[8px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100">
                      {activeArticle ? `${selectedPreferred} of ${totalPreferred} preferred` : `${totalPreferred} total preferred`}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  let govList = [];
                  let prefList = [];
                  let otherList = [];

                  if (activeArticle) {
                    // --- Active Article Mode ---
                    const thisEventGov = activeArticle.sources.filter(s => isGovernmentSource(s.source));
                    const seenGovTitles = new Set(thisEventGov.map(s => s.title?.toLowerCase().trim()));

                    const otherEventGov = articles
                      .filter(a => a.id !== activeArticle.id)
                      .flatMap(a => a.sources.filter(s => isGovernmentSource(s.source)))
                      .filter(s => {
                        const key = s.title?.toLowerCase().trim();
                        if (!key || seenGovTitles.has(key)) return false;
                        seenGovTitles.add(key);
                        return true;
                      });

                    govList = [
                      ...thisEventGov.map(s => ({ src: s, isCurrentEvent: true })),
                      ...otherEventGov.map(s => ({ src: s, isCurrentEvent: false }))
                    ];

                    const thisEventPref = activeArticle.sources.filter(s =>
                      !isGovernmentSource(s.source) &&
                      params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                    );
                    prefList = thisEventPref.map(s => ({ src: s, isCurrentEvent: true }));

                    const thisEventOther = activeArticle.sources.filter(s =>
                      !isGovernmentSource(s.source) &&
                      !params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                    );
                    const seenOtherTitles = new Set(thisEventOther.map(s => s.title?.toLowerCase().trim()));

                    const otherEventOther = articles
                      .filter(a => a.id !== activeArticle.id)
                      .flatMap(a => a.sources.filter(s =>
                        !isGovernmentSource(s.source) &&
                        !params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                      ))
                      .filter(s => {
                        const key = s.title?.toLowerCase().trim();
                        if (!key || seenOtherTitles.has(key)) return false;
                        seenOtherTitles.add(key);
                        return true;
                      });

                    otherList = [
                      ...thisEventOther.map(s => ({ src: s, isCurrentEvent: true })),
                      ...otherEventOther.map(s => ({ src: s, isCurrentEvent: false }))
                    ];

                  } else {
                    // --- All Articles Mode ---
                    const targetArticles = ledgerFilter === 'ALL' ? articles : articles.filter(a => a.ai.classification === ledgerFilter);

                    const govSources = targetArticles.flatMap(a => a.sources.filter(s => isGovernmentSource(s.source)));
                    const seenGov = new Set();
                    const uniqueGov = [];
                    govSources.forEach(s => {
                      const key = s.title?.toLowerCase().trim();
                      if (key && !seenGov.has(key)) {
                        seenGov.add(key);
                        uniqueGov.push(s);
                      }
                    });
                    // Also merge standalone govArticles fetched in parallel
                    govArticles.forEach(art => {
                      const key = art.title?.toLowerCase().trim();
                      if (key && !seenGov.has(key)) {
                        seenGov.add(key);
                        // Shape to match the src object format expected by renderSourceLink
                        uniqueGov.push({
                          url: art.url,
                          title: art.title,
                          date: art.date,
                          source: art.source,
                          body: art.body
                        });
                      }
                    });
                    govList = uniqueGov.map(s => ({ src: s, isCurrentEvent: false }));

                    const prefSources = targetArticles.flatMap(a => a.sources.filter(s =>
                      !isGovernmentSource(s.source) &&
                      params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                    ));
                    const seenPref = new Set();
                    const uniquePref = [];
                    prefSources.forEach(s => {
                      const key = s.title?.toLowerCase().trim();
                      if (key && !seenPref.has(key)) {
                        seenPref.add(key);
                        uniquePref.push(s);
                      }
                    });
                    prefList = uniquePref.map(s => ({ src: s, isCurrentEvent: false }));

                    const otherSources = targetArticles.flatMap(a => a.sources.filter(s =>
                      !isGovernmentSource(s.source) &&
                      !params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                    ));
                    const seenOther = new Set();
                    const uniqueOther = [];
                    otherSources.forEach(s => {
                      const key = s.title?.toLowerCase().trim();
                      if (key && !seenOther.has(key)) {
                        seenOther.add(key);
                        uniqueOther.push(s);
                      }
                    });
                    otherList = uniqueOther.map(s => ({ src: s, isCurrentEvent: false }));
                  }

                  const govNational = govList.filter(item => isNationalGovernmentSource(item.src.source, params.locs));
                  const govInternational = govList.filter(item => !isNationalGovernmentSource(item.src.source, params.locs));

                  const renderSourceLink = (item, idx, keyPrefix, themeColor = 'red') => {
                    const { src, isCurrentEvent } = item;

                    let hoverBgCls = 'hover:bg-red-50 hover:border-red-100';
                    let borderCls = 'border-transparent';
                    let badgeCls = 'bg-red-100 text-red-700';
                    let titleColorCls = 'text-gray-800';

                    if (themeColor === 'blue') {
                      hoverBgCls = 'hover:bg-blue-50 hover:border-blue-100';
                      badgeCls = 'bg-blue-100 text-blue-700';
                    } else if (themeColor === 'amber') {
                      hoverBgCls = 'hover:bg-amber-50 hover:border-amber-100';
                      badgeCls = 'bg-amber-100 text-amber-700';
                    } else if (themeColor === 'gray') {
                      hoverBgCls = 'hover:bg-gray-50 hover:border-gray-100';
                      badgeCls = 'bg-gray-100 text-gray-600';
                      titleColorCls = 'text-gray-700';
                    }

                    const activeEventBorder = isCurrentEvent
                      ? (themeColor === 'red' ? 'border-red-200 bg-red-50/20'
                        : themeColor === 'blue' ? 'border-blue-200 bg-blue-50/20'
                          : themeColor === 'amber' ? 'border-amber-200 bg-amber-50/20'
                            : 'border-blue-100 bg-blue-50/30')
                      : borderCls;

                    return (
                      <a key={`${keyPrefix}-${idx}`} href={src.url} target="_blank" rel="noopener noreferrer"
                        className={`block p-2.5 rounded-xl transition-all border ${activeEventBorder} ${hoverBgCls}`}>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${badgeCls}`}>
                            {src.source?.title || src.source?.uri || 'Source'}
                          </span>
                          {/* AI classification tag — shows what the AI decided for this article */}
                          {src.ai?.classification && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${src.ai.classification === 'ALERT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>{src.ai.classification}</span>
                          )}
                          {/* If article came from parallel gov fetch (no AI classification yet) */}
                          {(!src.ai?.classification && (keyPrefix === 'gov-nat' || keyPrefix === 'gov-int')) ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">GOV SOURCE</span>
                          ) : null}
                          {isCurrentEvent && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-1.5 py-0.5 rounded-md shadow-sm">This Alert</span>
                          )}
                          {src.date && <span className="text-[10px] font-bold text-gray-400">{src.date}</span>}
                        </div>
                        <h4 className={`text-[11px] font-bold ${titleColorCls} leading-snug line-clamp-2`}>{src.title}</h4>
                      </a>
                    );
                  };

                  return (
                    <>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">
                        {activeArticle
                          ? 'Sources for selected alert'
                          : (ledgerFilter === 'ALL' ? 'Sources for all articles' : ledgerFilter === 'ALERT' ? 'Sources for all alerts' : 'Sources for all info')
                        }
                      </p>

                      {/* 1. GOVERNMENT SOURCES CARD */}
                      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                        <button
                          onClick={() => setGovExpanded(!govExpanded)}
                          className="w-full px-3 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 hover:bg-gray-100/70 transition-all font-semibold outline-none text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🏛️</span>
                            <div>
                              <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Government Sources</h3>
                              <p className="text-[9px] font-semibold text-gray-400 mt-0.5">Articles from official gov agencies</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg border border-gray-200">
                              {govList.length} sources
                            </span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${govExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {govExpanded && (
                          <div className="p-2 space-y-3 max-h-[350px] overflow-y-auto bg-white transition-all">
                            {govList.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-[11px] font-semibold text-gray-400">No government sources detected</p>
                                <p className="text-[10px] font-semibold text-gray-300 mt-1">Official agencies not indexed for this query</p>
                              </div>
                            ) : (
                              <>
                                {govNational.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="px-2 py-0.5 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <svg className="w-3 h-3 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        National Alerts
                                      </span>
                                      <span className="text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.2 rounded border border-red-100">{govNational.length}</span>
                                    </div>
                                    <div className="space-y-1">
                                      {govNational.map((item, idx) => renderSourceLink(item, idx, 'gov-nat', 'red'))}
                                    </div>
                                  </div>
                                )}

                                {govInternational.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="px-2 py-0.5 flex items-center justify-between">
                                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">🌍 International Alerts</span>
                                      <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded border border-amber-100">{govInternational.length}</span>
                                    </div>
                                    <div className="space-y-1">
                                      {govInternational.map((item, idx) => renderSourceLink(item, idx, 'gov-int', 'amber'))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 2. PREFERRED SOURCES CARD */}
                      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                        <button
                          onClick={() => setPreferredExpanded(!preferredExpanded)}
                          className="w-full px-3 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 hover:bg-gray-100/70 transition-all font-semibold outline-none text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⭐</span>
                            <div>
                              <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Sources</h3>
                              {params.prefSrc?.length > 0 && (
                                <p className="text-[9px] font-semibold text-gray-400 mt-0.5">
                                  Preferred: {params.prefSrc.map(ps => ps.label || ps.uri).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100/50">
                              {prefList.length} articles
                            </span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${preferredExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {preferredExpanded && (
                          <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto bg-white transition-all">
                            {params.prefSrc?.length === 0 ? (
                              <div className="p-3 text-center text-[10px] font-semibold text-gray-400">
                                Select a preferred source in settings to see filtered results
                              </div>
                            ) : prefList.length > 0 ? (
                              prefList.map((item, idx) => renderSourceLink(item, idx, 'pref', 'blue'))
                            ) : (
                              <div className="p-4 text-center">
                                <p className="text-[11px] font-semibold text-gray-400">No articles from preferred sources</p>
                                <p className="text-[10px] font-semibold text-gray-300 mt-1">for this scope</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. OTHER SOURCES CARD */}
                      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                        <button
                          onClick={() => setOtherExpanded(!otherExpanded)}
                          className="w-full px-3 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 hover:bg-gray-100/70 transition-all font-semibold outline-none text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📰</span>
                            <div>
                              <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Other Sources</h3>
                              {params.prefSrc?.length > 0 && (
                                <p className="text-[9px] font-semibold text-gray-400 mt-0.5">Non-preferred articles</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg border border-gray-200">
                              {otherList.length} articles
                            </span>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${otherExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {otherExpanded && (
                          <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto bg-white transition-all">
                            {otherList.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-[11px] font-semibold text-gray-400">No other articles found</p>
                                <p className="text-[10px] font-semibold text-gray-300 mt-1">All results are from preferred sources</p>
                              </div>
                            ) : (
                              otherList.map((item, idx) => renderSourceLink(item, idx, 'other', 'gray'))
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </section>


            {/* SECTOR 2: ALERTS & INTEL LEDGER */}
            <section className="w-[40%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg relative">
              <div className="p-4 border-b border-gray-100 flex items-center shrink-0 bg-white">
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Intel Ledger</span>
              </div>
              {/* Filter tabs */}
              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60 shrink-0">
                {(() => {
                  const validArticles = articles.filter(a => a?.ai?.classification !== 'IRRELEVANT');
                  return [
                    { key: 'ALL', label: 'All', count: validArticles.length, cls: 'bg-gray-800 text-white', inactiveCls: 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400' },
                    { key: 'ALERT', label: 'Alerts', count: validArticles.filter(a => a?.ai?.classification === 'ALERT').length, cls: 'bg-red-600 text-white', inactiveCls: 'bg-red-50 text-red-500 border border-red-100 hover:border-red-400' },
                    { key: 'INFORMATIVE', label: 'Info', count: validArticles.filter(a => a?.ai?.classification === 'INFORMATIVE').length, cls: 'bg-blue-600 text-white', inactiveCls: 'bg-blue-50 text-blue-500 border border-blue-100 hover:border-blue-400' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => {
                        setLedgerFilter(f.key);
                        setSelectedIdx(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${ledgerFilter === f.key ? f.cls : f.inactiveCls
                        }`}
                    >
                      {f.label}
                      <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black ${ledgerFilter === f.key ? 'bg-white/25 text-inherit' : 'bg-gray-100 text-gray-500'
                        }`}>{f.count}</span>
                    </button>
                  ));
                })()}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                {(() => {
                  const validArticles = articles.filter(a => a?.ai?.classification !== 'IRRELEVANT');
                  const visible = ledgerFilter === 'ALL' ? validArticles : validArticles.filter(a => a?.ai?.classification === ledgerFilter);
                  if (visible.length === 0) return (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                        {validArticles.length === 0 ? 'No Articles Detected' : `No ${ledgerFilter === 'ALERT' ? 'Alert' : 'Info'} Articles`}
                      </p>
                    </div>
                  );
                  return visible.map((art, i) => {
                    const isAlert = art?.ai?.classification === 'ALERT';
                    const isInfo = art?.ai?.classification === 'INFORMATIVE';
                    const isSelected = selectedIdx === articles.indexOf(art);

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedIdx(articles.indexOf(art))}
                        className={`p-5 border rounded-2xl cursor-pointer transition-all ${isSelected
                          ? (isAlert ? 'border-red-500 ring-1 ring-red-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : isInfo ? 'border-blue-500 ring-1 ring-blue-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'border-gray-500 ring-1 ring-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]')
                          : 'border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300'
                          }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${isAlert
                              ? 'bg-red-600 text-white'
                              : isInfo
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-500'
                              }`}>
                              {art.ai?.classification}
                            </span>
                            {(() => {
                              const sourceNames = [...new Set(art.sources?.map(s => s.source?.title || s.source?.uri || 'Unknown Source'))];
                              const hasPreferred = art.sources?.some(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri)));
                              const sourceText = sourceNames.length > 1
                                ? `${sourceNames[0]} + ${sourceNames.length - 1} more`
                                : sourceNames[0] || 'Unknown Source';
                              return (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${hasPreferred
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                                  }`}>
                                  {hasPreferred && ' '}{sourceText}
                                </span>
                              );
                            })()}
                          </div>
                          <span className={`w-2 h-2 rounded-full shadow-inner ${isAlert
                            ? (pushedAlerts.has(art.id) ? 'bg-green-500' : 'bg-red-500')
                            : isInfo
                              ? 'bg-blue-400'
                              : 'bg-gray-300'
                            }`}></span>
                        </div>
                        <h3 className={`text-[11px] font-semibold leading-snug mb-2 ${isSelected ? (isAlert ? 'text-red-700' : isInfo ? 'text-blue-700' : 'text-gray-900') : 'text-gray-900'
                          }`}>
                          {art.title}
                        </h3>
                        {/* Brief excerpt */}
                        {(() => {
                          const brief = (art.sources?.[0]?.body || '').trim();
                          return brief ? (
                            <p className="text-[11px] font-semibold text-gray-400 leading-relaxed mb-3 line-clamp-2">
                              {brief.slice(0, 160)}{brief.length > 160 ? '…' : ''}
                            </p>
                          ) : null;
                        })()}
                        <p className="text-[11px] font-semibold text-gray-500 uppercase mb-3 tracking-wide">{art.ai?.hazard || 'Hazard'} in {art.ai?.region || 'Global'}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{new Date(art.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            {art.ai?.urgency === 'HIGH' && isAlert && <span className="text-[11px] font-semibold text-red-600 animate-pulse">URGENT</span>}
                            {/* Send via Email — broadcasts to employees in same country */}
                            <button
                              onClick={e => {
                                e.stopPropagation();

                                const alertCountryName = extractCountry(art.ai?.region);

                                const matchedEmployees = employees.filter(emp => {
                                  const empCountryObj = ENHANCED_COUNTRIES.find(c => c.code === emp.country);
                                  const empCountryName = (empCountryObj ? empCountryObj.name : emp.country || '').toLowerCase();
                                  const empState = (emp.state || '').toLowerCase();
                                  const alertRegionLower = (art.ai.region || '').toLowerCase();

                                  if (alertCountryName && empCountryName && alertCountryName.toLowerCase() === empCountryName) return true;
                                  if (empCountryName && alertRegionLower.includes(empCountryName)) return true;
                                  if (empState && alertRegionLower.includes(empState)) return true;
                                  return false;
                                });

                                setEmailDraft({
                                  article: art,
                                  allEmployees: employees,
                                  matchedIds: new Set(matchedEmployees.map(e => e.id)),
                                  selectedIds: new Set(matchedEmployees.map(e => e.id))
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${isAlert
                                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                                : isInfo
                                  ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-700'
                                }`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email
                            </button>
                            {art.sources?.[0]?.url && (
                              <a
                                href={art.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${isAlert
                                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                                  : isInfo
                                    ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-700'
                                  }`}
                              >
                                Read More
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </section>

            {/* SECTOR 3: RECOMMENDED SUGGESTIONS */}
            <section className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg">
              {/* Sticky Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 bg-white shrink-0 flex items-center justify-between">
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Recommended Suggestions for Selected Alert</span>
                {activeArticle && (
                  <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${activeArticle.ai?.classification === 'ALERT' ? 'bg-red-600 text-white' :
                    activeArticle.ai?.classification === 'INFORMATIVE' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>{activeArticle.ai?.classification}</span>
                )}
              </div>

              {activeArticle ? (
                <div className="flex-1 overflow-y-auto">
                  {/* Context sub-header */}
                  <div className={`px-5 py-2.5 border-b flex items-center gap-2 ${activeArticle.ai?.classification === 'ALERT' ? 'bg-red-50 border-red-100' :
                    activeArticle.ai?.classification === 'INFORMATIVE' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{activeArticle.ai?.hazard} — {activeArticle.ai?.region}</span>
                  </div>

                  <div className="p-4 space-y-4">
                    {activeArticle.ai?.classification === 'IRRELEVANT' ? (
                      <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest block">Intel Assessment</span>
                        <p className="text-[11px] font-semibold text-gray-700 leading-relaxed">{activeArticle.ai?.reasoning}</p>
                        <p className="text-[11px] font-semibold text-gray-400 italic">No operational mitigation action required for out-of-scope intelligence.</p>
                      </div>
                    ) : activeArticle.ai?.classification === 'INFORMATIVE' ? (
                      <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-3 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest block">Informative Article</span>
                        <p className="text-[11px] font-semibold text-blue-500 leading-relaxed">
                          No action recommendations for informative intelligence.<br />
                          Recommendations are only generated for <span className="font-black text-red-500">ALERT</span>-classified threats.
                        </p>
                        <p className="text-[10px] text-blue-400 italic mt-1">{activeArticle.ai.reasoning}</p>
                      </div>
                    ) : (
                      <>
                        {/* ── AI Threat-Specific Precautionary & Preparedness Protocols ── */}
                        {(activeArticle.ai.mitigation || activeArticle.ai.citizen_action) && (
                          <div className="rounded-2xl overflow-hidden shadow-md border border-emerald-200">
                            <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)' }} className="px-4 py-3 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-emerald-200 uppercase tracking-widest block leading-none mb-0.5">AI Threat Intelligence Brief</span>
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Precautionary &amp; Preventative Measures (Before Impact)</span>
                              </div>
                            </div>

                            <div className="p-4 bg-emerald-50/50 space-y-3">
                              {activeArticle.ai.mitigation && (
                                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Operational Precaution &amp; Mitigation Protocol</span>
                                  </div>
                                  <p className="text-[11px] font-semibold text-gray-800 leading-relaxed">{activeArticle.ai.mitigation}</p>
                                </div>
                              )}

                              {activeArticle.ai.citizen_action && (
                                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                                    <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest">Staff &amp; Public Safety Readiness Precautions</span>
                                  </div>
                                  <p className="text-[11px] font-semibold text-gray-800 leading-relaxed">{activeArticle.ai.citizen_action}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Objective 1: Pre-Event Asset Hardening & Life Safety Precautions ── */}
                        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #fecaca' }}>
                          <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)' }} className="px-4 py-3 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black text-red-200 uppercase tracking-widest block leading-none mb-0.5">Objective 01</span>
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Pre-Event Asset Hardening &amp; Life Safety Precautions</span>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 flex items-center gap-2" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#ef4444', animation: 'eq-blink 1.2s ease-in-out infinite' }} />
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#dc2626' }}>Priority: Pre-Disaster Risk Reduction &amp; Life Safety Preparedness</span>
                          </div>
                          <ul className="bg-white divide-y" style={{ borderColor: '#fef2f2' }}>
                            {[
                              'Pre-activate Incident Management Team (IMT) and verify pre-assigned roles for Floor Wardens and Safety Officers.',
                              'Conduct pre-event facility inspections — check emergency exits, fire suppression systems, and backup generators.',
                              'Stage emergency response kits, first-aid supplies, and satellite communication devices in designated safe zones.',
                              'Verify emergency evacuation routes and ensure all personnel are briefed on pre-hazard assembly points.',
                              'Perform pre-disaster data backups and secure physical confidential documents in fire/waterproof vaults.',
                              'Establish real-time monitoring of official early warning systems (NWS, Met Dept, Emergency Services).',
                              'Pre-position protective equipment (flood barriers, sandbags, window shutters, surge protectors) ahead of impact.',
                            ].map((step, idx) => (
                              <li key={idx} className="flex items-start gap-3 px-4 py-3"
                                style={{ transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
                                  style={{ background: '#fee2e2', color: '#dc2626' }}>{idx + 1}</span>
                                <span className="flex-1 text-[11px] font-semibold text-gray-800 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* ── Objective 2: Precautionary Business Continuity Staging & Risk Mitigation ── */}
                        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #bfdbfe' }}>
                          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)' }} className="px-4 py-3 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest block leading-none mb-0.5">Objective 02</span>
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Precautionary Business Continuity Staging &amp; Risk Mitigation</span>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 flex items-center gap-2" style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#3b82f6' }} />
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#1d4ed8' }}>Priority: Proactive System Staging &amp; Downtime Prevention</span>
                          </div>
                          <ul className="bg-white divide-y divide-blue-50">
                            {[
                              'Pre-emptively stage Business Continuity Plans (BCP) for critical business units (IT, Security, Finance, Ops).',
                              'Pre-authorize remote work protocols and verify VPN / cloud access for all essential staff prior to hazard landfall.',
                              'Perform offsite database snapshots and verify server failover mechanisms at Disaster Recovery (DR) sites.',
                              'Secure supply chain alternatives and pre-order essential operational consumables to prevent supply bottlenecks.',
                              'Issue pre-incident status advisories to key corporate stakeholders, vendors, and clients via mass notification tools.',
                              'Test backup power systems (UPS, fuel for generators) and verify fuel reserves for emergency vehicles.',
                              'Establish high-frequency check-in schedules for IT infrastructure and critical operations teams.',
                            ].map((step, idx) => (
                              <li key={idx} className="flex items-start gap-3 px-4 py-3"
                                style={{ transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
                                  style={{ background: '#dbeafe', color: '#1d4ed8' }}>{idx + 1}</span>
                                <span className="flex-1 text-[11px] font-semibold text-gray-800 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* ── Objective 3: Pre-Incident Travel Advisories & Mobility Restrictions ── */}
                        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #cbd5e1' }}>
                          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }} className="px-4 py-3 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.10)' }}>
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[8px] font-black uppercase tracking-widest block leading-none mb-0.5" style={{ color: '#94a3b8' }}>Objective 03</span>
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Pre-Incident Travel Advisories &amp; Mobility Restrictions</span>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 flex items-center gap-2" style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Priority: Preventive Mobility Management &amp; Travel Risk Reduction</span>
                          </div>
                          <ul className="bg-white divide-y divide-gray-50">
                            {[
                              'Immediately restrict or halt non-essential travel into the target alert zone prior to hazard escalation.',
                              'Audit itinerary logs for all active business travelers currently in or bound for the high-risk region.',
                              'Issue early precautionary travel advisories with pre-planned evacuation options and emergency contact numbers.',
                              'Pre-book emergency transport or alternate lodging outside the anticipated impact radius for traveling staff.',
                              'Advise personnel in the alert area to assemble 72-hour emergency kits (water, medications, power banks).',
                              'Monitor airport closures, transit suspensions, and highway advisories continuously to reroute staff proactively.',
                              'Establish clear pre-incident check-in protocols for field employees before communications networks become overloaded.',
                            ].map((step, idx) => (
                              <li key={idx} className="flex items-start gap-3 px-4 py-3"
                                style={{ transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5"
                                  style={{ background: '#f1f5f9', color: '#0f3460' }}>{idx + 1}</span>
                                <span className="flex-1 text-[11px] font-semibold text-gray-700 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* ── AI Reasoning ── */}
                    {activeArticle.ai.reasoning && (
                      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #fde68a' }}>
                        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                          <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#92400e' }}>AI Intelligence Reasoning</span>
                        </div>
                        <div className="px-4 py-3.5 bg-white">
                          <p className="text-[11px] font-semibold text-gray-600 leading-relaxed italic">"{activeArticle.ai.reasoning}"</p>
                        </div>
                      </div>
                    )}

                    {/* ── Read Source Article CTA ── */}
                    {(activeArticle.sources?.find(s => s?.url)?.url || activeArticle.url) && (
                      <a
                        href={activeArticle.sources?.find(s => s?.url)?.url || activeArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 group"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', textDecoration: 'none' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none mb-0.5">Source Intelligence</div>
                            <div>Read Full Article</div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}

                    {/* ── View Full EQ Response Plan link (earthquake ALERTs only) ── */}
                    {activeArticle.ai.classification === 'ALERT' &&
                      /earthquake|seismic|tremor|quake/i.test(activeArticle.ai.hazard + ' ' + activeArticle.ai.reasoning) && (
                        <button
                          onClick={() => setActivePage('earthquake-response')}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' }}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2l2-6 3 12 3-9 2 6 2-3h4" />
                            </svg>
                            <span>View Full EQ Response Plan</span>
                          </div>
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Select an Article</p>
                </div>
              )}
            </section>
          </main>
        </>
        }
      </div>

      {/* ── Email Broadcast Modal ── */}
      {emailDraft && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-black text-gray-800 uppercase tracking-widest leading-none">Push Alert to Employees</h2>
                  <p className="text-[11px] font-semibold text-gray-400 mt-1">{emailDraft.article.ai.hazard} in {emailDraft.article.ai.region}</p>
                </div>
              </div>
              <button onClick={() => setEmailDraft(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Select Recipients</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmailDraft(prev => ({ ...prev, selectedIds: new Set(prev.allEmployees.map(e => e.id)) }))}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setEmailDraft(prev => ({ ...prev, selectedIds: new Set() }))}
                    className="text-[10px] font-black text-gray-500 hover:text-gray-700 uppercase tracking-wider px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emailDraft.allEmployees.map(emp => {
                  const isSelected = emailDraft.selectedIds.has(emp.id);
                  const isMatched = emailDraft.matchedIds.has(emp.id);
                  return (
                    <label key={emp.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={isSelected}
                          onChange={(e) => {
                            const newIds = new Set(emailDraft.selectedIds);
                            if (e.target.checked) newIds.add(emp.id);
                            else newIds.delete(emp.id);
                            setEmailDraft(prev => ({ ...prev, selectedIds: newIds }));
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-bold text-gray-800 truncate">{emp.firstName} {emp.lastName}</p>
                          {isMatched && <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">In Region</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{emp.companyEmail}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{emp.role} • {emp.city ? emp.city + ', ' : ''}{emp.state ? emp.state + ', ' : ''}{emp.country}</p>
                      </div>
                    </label>
                  );
                })}
                {emailDraft.allEmployees.length === 0 && (
                  <div className="col-span-2 py-8 text-center">
                    <p className="text-[12px] font-semibold text-gray-400">No employees found. Add employees in the Employees page.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                {emailDraft.selectedIds.size} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEmailDraft(null)}
                  className="px-5 py-2.5 rounded-xl text-[11px] font-black text-gray-500 hover:bg-gray-200 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={emailDraft.selectedIds.size === 0}
                  onClick={async () => {
                    const selectedEmployees = emailDraft.allEmployees.filter(e => emailDraft.selectedIds.has(e.id));
                    const art = emailDraft.article;
                    const articleUrl = art.sources?.find(s => s?.url)?.url || art.url || null;
                    const threat = {
                      classification: art.ai.classification, hazard: art.ai.hazard, region: art.ai.region,
                      urgency: art.ai.urgency, reasoning: art.ai.reasoning, mitigation: art.ai.mitigation,
                      citizen_action: art.ai.citizen_action, title: art.title, id: art.id,
                      articleUrl
                    };
                    try {
                      const response = await fetch('/api/broadcast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ threat, employees: selectedEmployees }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        alert(`✅ Broadcast sent to ${selectedEmployees.length} employee(s)!\n${data.previewUrl ? `Preview: ${data.previewUrl}` : ''}`);
                        setEmailDraft(null);
                      } else {
                        alert(`❌ Failed to send: ${data.error}`);
                      }
                    } catch (err) {
                      const subject = encodeURIComponent(`[AlertEm ${art.ai.classification}] ${art.ai.hazard} — ${art.ai.region}`);
                      const body = encodeURIComponent(
                        `ALERTEM INTELLIGENCE BRIEF\n${'='.repeat(50)}\n\n` +
                        `STATUS    : ${art.ai.classification}\nHAZARD    : ${art.ai.hazard}\nREGION    : ${art.ai.region}\nURGENCY   : ${art.ai.urgency || 'N/A'}\nDATE      : ${new Date(art.date).toLocaleDateString()}\n\n` +
                        `HEADLINE\n--------\n${art.title}\n\n` +
                        `AI REASONING\n------------\n${art.ai.reasoning || 'N/A'}\n\n` +
                        `MITIGATION STRATEGY\n-------------------\n${art.ai.mitigation || 'N/A'}\n\n` +
                        `CIVILIAN ACTION PROTOCOL\n------------------------\n${art.ai.citizen_action || 'N/A'}\n\n` +
                        `${'='.repeat(50)}\nPowered by AlertEm Threat Intelligence Platform`
                      );
                      const toList = selectedEmployees.map(e => e.companyEmail).filter(Boolean).join(',');
                      window.location.href = `mailto:${toList}?subject=${subject}&body=${body}`;
                      setEmailDraft(null);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Push Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppMain />
    </ErrorBoundary>
  );
}
