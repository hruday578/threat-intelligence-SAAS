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

import { TOP_SOURCES } from './data/sources';

//  Operational Constants 
const TACTICAL_LIBRARY = [
  'Natural Disaster', 'Wildfire', 'Flood', 'Earthquake', 'Hurricane', 'Tornado', 'Heatwave',
  'Tsunami', 'Landslide', 'Drought', 'Blizzard', 'Avalanche', 'Volcanic Eruption',
  'Cyber Attack', 'Data Breach', 'Explosion', 'Chemical Spill', 'Power Outage',
  'Terrorism', 'Aviation Accident', 'Train Derailment', 'Industrial Accident',
  'Dubai', 'Saudi Arabia', 'UAE', 'India', 'USA'
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


//  TACTICAL NEURAL PROMPT (V10 - FEW-SHOT GROUNDED) 
const BATCH_CLASSIFY_PROMPT = (topic, location, expandedZones = []) => {
  const zoneList = expandedZones.length > 1
    ? `"${location}" and its surrounding zone (${expandedZones.slice(0, 8).join(', ')})`
    : `"${location}"`;
  return `You are a senior threat intelligence analyst producing operational field briefs for emergency response teams. TARGET ZONE: ${zoneList}. Topic: "${topic}".

For EVERY article you must return a JSON object. The "mitigation" and "citizen_action" fields MUST contain real, specific, actionable sentences — never "Unknown", "N/A", or vague placeholders.

CLASSIFICATION:
- ALERT: Active or imminent emergency directly in the target zone.
- INFORMATIVE: Background or related news relevant to the target zone.
- IRRELEVANT: Article is primarily about a different geographic region.

--- FEW-SHOT EXAMPLES (follow this quality and specificity) ---

EXAMPLE INPUT: { "title": "Major cyberattack hits government infrastructure in Seattle", "body": "Hackers have compromised critical systems in Seattle City Hall..." }
EXAMPLE OUTPUT: { "classification": "ALERT", "hazard": "Cyber Attack", "region": "Seattle, WA, USA", "reasoning": "Active cyberattack targeting government systems directly within the target zone.", "mitigation": "Immediately isolate affected systems from the network to prevent lateral movement. Activate incident response teams and engage national cybersecurity agencies. Conduct forensic analysis to identify attack vectors and patch exploited vulnerabilities. Deploy backup systems and restore from clean snapshots where possible.", "citizen_action": "Change your passwords immediately for all government and banking portals. Monitor your bank accounts for unauthorized transactions. Do not click links in any unexpected emails or SMS messages.", "confidence": 88, "urgency": "HIGH" }

EXAMPLE INPUT: { "title": "Wildfire spreading near residential areas in Los Angeles", "body": "Firefighters are battling a fast-moving blaze in the hills outside LA..." }
EXAMPLE OUTPUT: { "classification": "ALERT", "hazard": "Wildfire", "region": "Los Angeles, CA, USA", "reasoning": "Active wildfire is directly threatening residential communities in the target zone.", "mitigation": "Deploy aerial water-bombing aircraft to establish firebreaks on the northern perimeter. Enforce mandatory evacuation orders for zones A and B immediately. Position fire crews along Highway 9 as a containment line. Coordinate with utility companies to de-energize power lines in the fire path.", "citizen_action": "Evacuate immediately if you are in the designated evacuation zone — do not wait. Close all windows and doors to prevent ember intrusion if sheltering in place. Pack emergency documents, medications, and 3 days of supplies before leaving.", "confidence": 95, "urgency": "HIGH" }

--- END EXAMPLES ---

Now classify the following articles using the same quality. For the "region" field, extract the specific city, state/province, and country where the threat event actually occurred (e.g., "Houston, TX, USA" or "Mumbai, Maharashtra, India"). Be as specific as possible based on the article title and body. If the location is outside the target zone, keep the specific location so it can be filtered or reported correctly. If no specific city is mentioned, use the most specific region/country available, falling back to "${location}" only if no other location info is found.

Return ONLY a valid JSON array, same order as input. No markdown, no explanation text outside the array.
[
  { "classification": "ALERT|INFORMATIVE|IRRELEVANT", "hazard": "Specific type", "region": "Specific City, State, Country", "reasoning": "1-2 sentence explanation", "mitigation": "Step 1. Step 2. Step 3.", "citizen_action": "Action 1. Action 2.", "confidence": 0-100, "urgency": "HIGH|MED|LOW" }
]`;
};

const DURATIONS = [
  { label: '1H', value: '1h', days: 0.04 },
  { label: '24H', value: '24h', days: 1 },
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 }
];
const PROVIDERS = [
  { id: 'groq-8b', label: 'GROQ 8B FAST', endpoint: '/groq/chat/completions', model: 'llama-3.1-8b-instant' },
  { id: 'groq-70b', label: 'GROQ 70B', endpoint: '/groq/chat/completions', model: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', label: 'OPENROUTER', endpoint: '/openrouter/chat/completions', model: 'meta-llama/llama-3.3-70b-instruct:free' },
  { id: 'deepseek', label: 'DEEPSEEK', endpoint: '/deepseek/chat/completions', model: 'deepseek-chat' }
];

const ENHANCED_COUNTRIES = [
  ...COUNTRIES,
  { name: 'United Arab Emirates', code: 'AE' }
].filter((c, i, a) => a.findIndex(t => t.code === c.code) === i);

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
  const filtered = (options || []).filter(o => (o.label || '').toLowerCase().includes(search.toLowerCase()));
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
    keyword:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  icon: '' },
    concept:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  icon: '' },
    location: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '' },
    category: { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    icon: '' },
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

//  Main Application 

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(true);
  const [newsKey, setNewsKey] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [provider, setProvider] = useState('groq-8b');
  const [keywords, setKeywords] = useState(['wildfire']);
  const [zonesInput, setZonesInput] = useState('');
  const [params, setParams] = useState({ cats: [], locs: [], states: [], cities: [], dur: '30d', prefSrc: [], concepts: [] });
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [rawArticles, setRawArticles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [error, setError] = useState('');
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoPilotInterval, setAutoPilotInterval] = useState(5);
  const [pushedAlerts, setPushedAlerts] = useState(new Set());
  const [radius, setRadius] = useState(0);
  const [expandedZones, setExpandedZones] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [employees, setEmployees] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alertem_employees') || '[]'); } catch { return []; }
  });
  const [dispatchedAlerts, setDispatchedAlerts] = useState({});

  const pushToEmployee = (articleId, employeeId) => {
    setDispatchedAlerts(prev => ({
      ...prev,
      [`${articleId}-${employeeId}`]: true
    }));
  };

  useEffect(() => {
    localStorage.setItem('alertem_employees', JSON.stringify(employees));
  }, [employees]);
  const masterProcessedRef = useRef([]);
  const seenTitlesRef = useRef(new Set());

  const countryList = (ENHANCED_COUNTRIES || []).map(c => ({ label: c.name, code: c.code, uri: `http://en.wikipedia.org/wiki/${c.name.replace(/ /g, '_')}` }));
  const stateList = (params.locs || []).reduce((acc, c) => [...acc, ...(ENHANCED_REGIONS[c.code] || [])], []);
  const cityList = (params.states || []).reduce((acc, s) => {
    const cities = citiesByState[s.label] || [];
    return [...acc, ...cities.map(city => ({ label: city, keyword: city, uri: `http://en.wikipedia.org/wiki/${city.replace(/ /g, '_')}` }))];
  }, []);

  const activeArticle = selectedIdx !== null ? articles[selectedIdx] : null;

  const alertsCount = articles.filter(a => a.ai.classification === 'ALERT').length;
  const reportsCount = articles.filter(a => a.ai.classification === 'INFORMATIVE').length;

  useEffect(() => {
    if (!autoPilot || !isLoggedIn) return;
    const interval = setInterval(() => {
      handleExecute(true);
    }, autoPilotInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoPilot, autoPilotInterval, isLoggedIn, newsKey, aiKey, keywords, params, zonesInput, provider]);

  const handleExecute = async (isAuto = false) => {
    if (!newsKey || !aiKey) return setError('Configuration Incomplete');
    if (!keywords.length && !params.concepts.length && !params.locs.length && !params.cats.length) return setError('Add at least one keyword, concept, or location');
    setLoading(true);
    setError('');
    if (!isAuto) {
      setArticles([]);
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
          } else {
            keywordParts.push({ "keyword": kw });
          }
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
            // Separate date from topic conditions
            const queryConditions = qParts.filter(p => !p.dateStart && !p.dateEnd);
            const datePart = qParts.find(p => p.dateStart);

            // lang MUST be inside $query.$and — $filter does NOT support lang in EventRegistry AQL
            const allConditions = [{ "lang": "eng" }, ...queryConditions];

            const queryBlock = {
              "$query": allConditions.length === 1
                ? allConditions[0]
                : { "$and": allConditions }
            };

            const filterBlock = datePart
              ? { "$filter": { "dateStart": datePart.dateStart, "dateEnd": datePart.dateEnd } }
              : {};

            const body = {
              apiKey: newsKey,
              action: "getArticles",
              articlesCount: count,
              articlesSortBy: sortBy,
              resultType: "articles",
              dataType: ["news"],
              articleBodyLen: 300,
              keywordSearchMode: "simple",
              query: { ...queryBlock, ...filterBlock }
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
            }
          } catch (e) {
            if (attempts === 1) throw new Error(`NETWORK_FAILURE: ${e.message}`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        const errText = await res.text();
        throw new Error(`API Error: ${res?.status} ${errText}`);
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
        const genArticles  = genRes?.articles?.results  || [];
        console.log(` Preferred: ${prefArticles.length} | Other sources: ${genArticles.length}`);
        if (prefArticles.length > 0) {
          console.log('Preferred source URIs sample:', prefArticles.slice(0, 3).map(a => a.source?.uri));
          console.log('Other source URIs sample:', genArticles.slice(0, 3).map(a => a.source?.uri));
        }
        if (prefArticles.length === 0) {
          setError(` No articles from ${params.prefSrc.map(s=>s.label||s.uri).join(', ')} for this query. Showing all sources.`);
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

      if (!raw.length) throw new Error('NO ARTICLES FOUND');

      const seen = new Set();
      const uniqueRaw = raw.filter(art => {
        const key = art.title.toLowerCase().trim();
        if (seen.has(key) || seenTitlesRef.current.has(key)) return false;
        seen.add(key);
        seenTitlesRef.current.add(key);
        return true;
      });

      if (!uniqueRaw.length) {
        setLoading(false);
        return;
      }

      const processed = [];
      const activeProvider = PROVIDERS.find(p => p.id === provider);
      const locationContext = [...params.cities, ...params.states, ...params.locs].map(l => l.label).join(', ') || 'Global';

      // Neural Batch Processing with Token-Guard
      const chunkSize = 5;
      for (let i = 0; i < uniqueRaw.length; i += chunkSize) {
        const chunk = uniqueRaw.slice(i, i + chunkSize);
        try {
          await new Promise(r => setTimeout(r, 1500)); // Throttling for free-tier stability

          const payload = chunk.map((a, idx) => ({ id: idx, title: a.title, body: (a.body || '').slice(0, 500) }));

          const aiRes = await fetch(activeProvider.endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
            body: JSON.stringify({
              model: activeProvider.model,
              temperature: 0.1,
              messages: [
                { role: 'system', content: BATCH_CLASSIFY_PROMPT([...keywords, ...params.concepts.map(c => c.label)].join(', '), locationContext, expandedZoneKeywords) },
                { role: 'user', content: JSON.stringify(payload) }
              ]
            })
          });

          if (!aiRes.ok) {
            const errData = await aiRes.json().catch(() => ({}));
            const msg = errData.error?.message || aiRes.statusText;
            if (aiRes.status === 429) {
              setError("DAILY AI LIMIT REACHED. SWITCH PROVIDER OR WAIT 24H.");
              break;
            }
            throw new Error(msg);
          }

          const aiData = await aiRes.json();
          const rawContent = aiData.choices[0].message.content;
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error("AI failed to format JSON array");

          const aiJsonArray = JSON.parse(jsonMatch[0].trim());

          chunk.forEach((art, idx) => {
            const aiJson = aiJsonArray[idx] || { classification: 'INFORMATIVE', reasoning: 'Missing from batch', mitigation: 'Monitor status', citizen_action: 'Stay alert', urgency: 'LOW', hazard: 'General', region: locationContext };

            // REGION GUARD: If the AI returned a region that doesn't match our target, classify it as IRRELEVANT instead of discarding it!
            if (aiJson.classification !== 'IRRELEVANT' && locationContext !== 'Global') {
              const targetTokens = locationContext.toLowerCase().split(/[\s,]+/);
              const aiRegion = (aiJson.region || '').toLowerCase();
              const regionMatches = targetTokens.some(token => token.length > 2 && aiRegion.includes(token));
              if (!regionMatches) {
                aiJson.classification = 'IRRELEVANT';
                aiJson.reasoning = `Region Mismatch: Intel focuses on "${aiJson.region || 'another region'}" rather than "${locationContext}".`;
              } else {
                // Keep the AI's specific region so geocoding on the map is highly accurate, 
                // instead of resetting it back to the broad target zone.
                // E.g. keep "Bangalore, Karnataka, India" instead of overriding with "India".
              }
            }

            masterProcessedRef.current.push({ ...art, ai: aiJson });
          });
        } catch (e) {
          setError(`AI Error: ${e.message}`);
          break; // Halt processing on fatal error
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
            title: cls === 'ALERT' ? `${art.ai.hazard || 'Alert'} in ${art.ai.region || 'Region'}` : art.title,
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
          if (cls !== 'ALERT') groupedEvents[groupKey].title = art.title;
        }

        groupedEvents[groupKey].sources.push(art);
      }

      setRawArticles([...masterProcessedRef.current]);

      let finalEvents = Object.values(groupedEvents).sort((a, b) => {
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
    } catch (e) {
      console.error("ANALYSIS_CRASH:", e);
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl max-w-sm w-full space-y-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-8"><Logo className="h-32" /></div>
          </div>
          <form onSubmit={e => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4">
            <input type="email" placeholder="Analyst ID" className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold outline-none" defaultValue="admin@aertem.ia" />
            <input type="password" placeholder="Access Key" className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold outline-none" defaultValue="password" />
            <button className="w-full h-14 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all">Establish Connection</button>
          </form>
        </div>
      </div>
    );
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
          />
        )}
        {activePage === 'employees' && <EmployeesPage employees={employees} setEmployees={setEmployees} />}
        {activePage === 'risk-assessment' && <RiskAssessmentPage articles={articles} />}
        {activePage === 'dashboard' && <>
          <header className="px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
              <Logo className="h-16" />
              <div className="h-8 w-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Model: {PROVIDERS.find(p => p.id === provider)?.model}</span>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest">Sign Out</button>
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
                  <button onClick={() => setAutoPilot(!autoPilot)} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${autoPilot ? 'bg-red-600 text-white border-red-600 animate-pulse shadow-lg shadow-red-200' : 'text-gray-400 border-gray-200 hover:text-red-600 hover:border-red-600'}`}>
                    {autoPilot ? `Auto-Pilot: ON (${autoPilotInterval}m)` : 'Enable Auto-Pilot'}
                  </button>
                  <button onClick={() => { setKeywords(['wildfire']); setZonesInput(''); setParams({ cats: [], locs: [], states: [], cities: [], dur: '30d', prefSrc: [], concepts: [] }); }} className="text-[9px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest">Reset Analysis</button>
                </div>
              </div>

              {configExpanded && (
                <>
                  <div className="flex items-start gap-4 flex-wrap">
                    <TagInput label="Target Hazards" tags={keywords} onAdd={t => setKeywords([...new Set([...keywords, t])])} onRemove={t => setKeywords(keywords.filter(k => k !== t))} suggestionsLibrary={TACTICAL_LIBRARY} />
                    <ConceptInput label=" Concepts" concepts={params.concepts} onChange={v => setParams(p => ({ ...p, concepts: v }))} />
                    <MultiSelect label="Preferred Source" options={TOP_SOURCES} selected={params.prefSrc} onChange={v => setParams(p => ({ ...p, prefSrc: v }))} placeholder="Any Source" />
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
                    <button onClick={() => handleExecute(false)} disabled={loading} className="h-10 px-8 mt-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                      {loading ? 'Analyzing...' : <>Run Analysis <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>}
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
              {error && <div className="text-[10px] font-black text-red-600 uppercase text-center bg-red-50 py-2 rounded-xl border border-red-100 animate-pulse overflow-hidden px-4">{error}</div>}
            </div>
          </div>

          <main className="flex-1 flex overflow-hidden p-6 gap-6 bg-gray-50/50">
            {/* SECTOR 1: RESOURCES (Authentic vs Other) */}
            <section className="w-[30%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg relative">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Resources</span>
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
                {activeArticle ? (
                  <>
                    {/* Context label */}
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1">
                      Sources for selected alert
                    </p>

                    {/* Authentic Resources Card */}
                    <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-3 py-2 border-b border-red-50 flex justify-between items-center bg-red-50/60">
                        <div>
                          <h3 className="text-[11px] font-semibold text-red-700 uppercase tracking-widest">
                            {params.prefSrc?.length > 0 ? ' Preferred Sources' : 'Authentic Resources'}
                          </h3>
                          {params.prefSrc?.length > 0 && (
                            <p className="text-[11px] font-semibold text-red-400 mt-0.5">
                              {params.prefSrc.map(ps => ps.label || ps.uri).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-red-500 bg-white px-2 py-0.5 rounded-lg border border-red-100">
                          {activeArticle.sources.filter(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))).length} articles
                        </span>
                      </div>
                      <div className="p-2 space-y-1">
                        {params.prefSrc?.length === 0 ? (
                          <div className="p-3 text-center text-[11px] font-semibold text-gray-400">
                            Select a preferred source to see filtered results
                          </div>
                        ) : activeArticle.sources.filter(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))).length > 0 ? (
                          activeArticle.sources.filter(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))).map((src, si) => (
                            <a key={`auth-${si}`} href={src.url} target="_blank" rel="noopener noreferrer"
                              className="block p-2.5 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                              {/* Source badge */}
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-semibold uppercase tracking-widest bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">
                                  {src.source?.title || src.source?.uri || 'Source'}
                                </span>
                                {src.date && (
                                  <span className="text-[11px] font-semibold text-gray-400">{src.date}</span>
                                )}
                              </div>
                              <h4 className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2">
                                {src.title}
                              </h4>
                            </a>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-[11px] font-semibold text-gray-400">No articles from preferred sources</p>
                            <p className="text-[11px] font-semibold text-gray-300 mt-1">for this specific alert</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Other Sources Card — shows ALL non-preferred articles from entire analysis */}
                    {(() => {
                      // Collect all non-preferred articles from the whole analysis
                      const seenTitles = new Set();
                      // Current event's non-preferred articles first
                      const thisEventOther = activeArticle.sources.filter(s =>
                        !params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                      );
                      thisEventOther.forEach(s => seenTitles.add(s.title?.toLowerCase().trim()));
                      // All other events' non-preferred articles
                      const otherEventArticles = articles
                        .filter(a => a.id !== activeArticle.id)
                        .flatMap(a => a.sources.filter(s =>
                          !params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri))
                        ))
                        .filter(s => {
                          const key = s.title?.toLowerCase().trim();
                          if (!key || seenTitles.has(key)) return false;
                          seenTitles.add(key);
                          return true;
                        });
                      const totalOther = thisEventOther.length + otherEventArticles.length;

                      const renderArticle = (src, si, isCurrentEvent) => (
                        <a key={`other-${si}`} href={src.url} target="_blank" rel="noopener noreferrer"
                          className={`block p-2.5 rounded-xl transition-colors border ${isCurrentEvent ? 'border-blue-100 bg-blue-50/30 hover:bg-blue-50' : 'border-transparent hover:bg-gray-50 hover:border-gray-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[11px] font-semibold uppercase tracking-widest bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                              {src.source?.title || src.source?.uri || 'Source'}
                            </span>
                            {isCurrentEvent && (
                              <span className="text-[11px] font-semibold uppercase tracking-widest bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md">This Alert</span>
                            )}
                            {src.date && <span className="text-[11px] font-semibold text-gray-400">{src.date}</span>}
                          </div>
                          <h4 className="text-[11px] font-semibold text-gray-700 leading-snug line-clamp-2">{src.title}</h4>
                        </a>
                      );

                      return (
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                          <div className="px-3 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/80">
                            <div>
                              <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Other Sources</h3>
                              {params.prefSrc?.length > 0 && (
                                <p className="text-[11px] font-semibold text-gray-400 mt-0.5">All non-preferred articles</p>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-lg border border-gray-100">
                              {totalOther} articles
                            </span>
                          </div>
                          <div className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
                            {totalOther === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-[11px] font-semibold text-gray-400">No other articles found</p>
                                <p className="text-[11px] font-semibold text-gray-300 mt-1">All results are from preferred sources</p>
                              </div>
                            ) : (
                              <>
                                {thisEventOther.map((src, si) => renderArticle(src, si, true))}
                                {otherEventArticles.length > 0 && thisEventOther.length > 0 && (
                                  <div className="px-2 py-1.5">
                                    <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">From other alerts</span>
                                  </div>
                                )}
                                {otherEventArticles.map((src, si) => renderArticle(src, si + thisEventOther.length, false))}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">Select an Alert<br />to view resources</p>
                  </div>
                )}
              </div>
            </section>


            {/* SECTOR 2: ALERTS & INTEL LEDGER */}
            <section className="w-[40%] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg relative">
              <div className="p-4 border-b border-gray-100 flex items-center shrink-0 bg-white">
                <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Intel Ledger</span>
              </div>
              {/* Filter tabs */}
              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60 shrink-0">
                {[
                  { key: 'ALL',         label: 'All',    count: articles.length,                                                       cls: 'bg-gray-800 text-white',          inactiveCls: 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400' },
                  { key: 'ALERT',       label: 'Alerts', count: articles.filter(a => a.ai.classification === 'ALERT').length,         cls: 'bg-red-600 text-white',           inactiveCls: 'bg-red-50 text-red-500 border border-red-100 hover:border-red-400' },
                  { key: 'INFORMATIVE', label: 'Info',   count: articles.filter(a => a.ai.classification === 'INFORMATIVE').length,   cls: 'bg-blue-600 text-white',          inactiveCls: 'bg-blue-50 text-blue-500 border border-blue-100 hover:border-blue-400' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setLedgerFilter(f.key); setSelectedIdx(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                      ledgerFilter === f.key ? f.cls : f.inactiveCls
                    }`}
                  >
                    {f.label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black ${
                      ledgerFilter === f.key ? 'bg-white/25 text-inherit' : 'bg-gray-100 text-gray-500'
                    }`}>{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                {(() => {
                  const visible = ledgerFilter === 'ALL' ? articles : articles.filter(a => a.ai.classification === ledgerFilter);
                  if (visible.length === 0) return (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                        {articles.length === 0 ? 'No Articles Detected' : `No ${ledgerFilter === 'ALERT' ? 'Alert' : 'Info'} Articles`}
                      </p>
                    </div>
                  );
                  return visible.map((art, i) => {
                  const isAlert = art.ai.classification === 'ALERT';
                  const isInfo = art.ai.classification === 'INFORMATIVE';
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
                            {art.ai.classification}
                          </span>
                          {(() => {
                            const sourceNames = [...new Set(art.sources?.map(s => s.source?.title || s.source?.uri || 'Unknown Source'))];
                            const hasPreferred = art.sources?.some(s => params.prefSrc?.some(ps => domainMatch(s.source?.uri, ps.uri)));
                            const sourceText = sourceNames.length > 1
                              ? `${sourceNames[0]} + ${sourceNames.length - 1} more`
                              : sourceNames[0] || 'Unknown Source';
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                                hasPreferred
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
                      <p className="text-[11px] font-semibold text-gray-500 uppercase mb-3 tracking-wide">{art.ai.hazard} in {art.ai.region}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{new Date(art.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          {art.ai.urgency === 'HIGH' && isAlert && <span className="text-[11px] font-semibold text-red-600 animate-pulse">URGENT</span>}
                          {art.sources?.[0]?.url && (
                            <a
                              href={art.sources[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                                isAlert
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
                <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Recommended Suggestions</span>
                {activeArticle && (
                  <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${activeArticle.ai.classification === 'ALERT' ? 'bg-red-600 text-white' :
                      activeArticle.ai.classification === 'INFORMATIVE' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>{activeArticle.ai.classification}</span>
                )}
              </div>

              {activeArticle ? (
                <div className="flex-1 overflow-y-auto">
                  {/* Context sub-header */}
                  <div className={`px-5 py-3 border-b flex items-center gap-2 ${activeArticle.ai.classification === 'ALERT' ? 'bg-red-50 border-red-100' :
                      activeArticle.ai.classification === 'INFORMATIVE' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide truncate">{activeArticle.ai.hazard} — {activeArticle.ai.region}</span>
                  </div>

                  <div className="p-4 space-y-4">
                    {activeArticle.ai.classification === 'IRRELEVANT' ? (
                      <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest block">Intel Assessment</span>
                        <p className="text-[11px] font-semibold text-gray-700 leading-relaxed">{activeArticle.ai.reasoning}</p>
                        <p className="text-[11px] font-semibold text-gray-400 italic">No operational mitigation action required for out-of-scope intelligence.</p>
                      </div>
                    ) : (
                      <>
                        {/* Mitigation Steps */}
                        <div className="rounded-2xl overflow-hidden border border-red-100 shadow-sm">
                          <div className="px-4 py-2.5 bg-red-600 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-red-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[11px] font-semibold text-white uppercase tracking-widest">Mitigation Strategy</span>
                          </div>
                          {(() => {
                            const raw = (activeArticle.ai.mitigation || '').trim();
                            const isInvalid = !raw || ['unknown', 'n/a', 'none', 'na', 'monitor status'].includes(raw.toLowerCase());
                            const steps = isInvalid ? [] : (raw.match(/[^.!?]+[.!?]+/g) || [raw]).filter(s => s.trim().length > 4);
                            return steps.length > 0 ? (
                              <ul className="divide-y divide-red-50 bg-white">
                                {steps.map((step, idx) => (
                                  <li key={idx} className="flex gap-3 px-4 py-3.5 items-start hover:bg-red-50/40 transition-colors">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[11px] font-semibold mt-0.5 border border-red-200">{idx + 1}</span>
                                    <span className="text-[11px] font-semibold text-gray-800 leading-relaxed">{step.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-4 py-6 text-center bg-white">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"> Awaiting detailed analysis from AI model</p>
                                <p className="text-[11px] font-semibold text-gray-300 mt-1">Try switching to a more capable provider (e.g. GROQ 70B or DeepSeek)</p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Civilian Action Steps */}
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                          <div className="px-4 py-2.5 bg-gray-800 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest">Civilian Action Protocol</span>
                          </div>
                          {(() => {
                            const raw = (activeArticle.ai.citizen_action || '').trim();
                            const isInvalid = !raw || ['unknown', 'n/a', 'none', 'na', 'stay alert'].includes(raw.toLowerCase());
                            const steps = isInvalid ? [] : (raw.match(/[^.!?]+[.!?]+/g) || [raw]).filter(s => s.trim().length > 4);
                            return steps.length > 0 ? (
                              <ul className="divide-y divide-gray-100 bg-white">
                                {steps.map((step, idx) => (
                                  <li key={idx} className="flex gap-3 px-4 py-3.5 items-start hover:bg-gray-50 transition-colors">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[11px] font-semibold mt-0.5 border border-gray-200">{idx + 1}</span>
                                    <span className="text-[11px] font-semibold text-gray-700 leading-relaxed">{step.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="px-4 py-6 text-center bg-white">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"> Awaiting detailed analysis from AI model</p>
                                <p className="text-[11px] font-semibold text-gray-300 mt-1">Try switching to a more capable provider (e.g. GROQ 70B or DeepSeek)</p>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    {/* REASONING BLOCK */}
                    {activeArticle.ai.reasoning && (
                      <div className="rounded-2xl overflow-hidden border border-amber-100 shadow-sm">
                        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest">AI Reasoning</span>
                        </div>
                        <div className="px-4 py-3.5 bg-white">
                          <p className="text-[11px] font-semibold text-gray-600 leading-relaxed italic">"{activeArticle.ai.reasoning}"</p>
                        </div>
                      </div>
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
    </div>
  );
}
