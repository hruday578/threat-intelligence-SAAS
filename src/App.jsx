import React, { useState, useEffect } from 'react';
import { COUNTRIES } from './data/countries';
import { regionsByCountry } from './data/regions';
import { citiesByState } from './data/cities';

// ─── Operational Constants ──────────────────────────────────────────────────
const TACTICAL_LIBRARY = [
  'Wildfire', 'Flood', 'Earthquake', 'Hurricane', 'Tornado', 'Heatwave', 
  'Cyber Attack', 'Data Breach', 'Explosion', 'Chemical Spill', 'Power Outage',
  'Dubai', 'Saudi Arabia', 'UAE', 'India', 'USA'
];

// ─── TACTICAL NEURAL PROMPT (V6 - BATCH OPTIMIZED) ───
const BATCH_CLASSIFY_PROMPT = (topic, location) => `Objective: Analyze threats related to "${topic}" specifically affecting the region: "${location}".
Rules:
1. ALERT: Official warnings or active emergencies affecting ${location}.
2. INFORMATIVE: General news or research affecting ${location}.
3. IRRELEVANT: News explicitly about other regions NOT affecting ${location}, or travel/sport/politics. PURGE THESE.
Analyze the following articles provided as a JSON array. 
Return ONLY a strictly valid JSON array containing exactly one object per article, maintaining the exact original order. Do not wrap in markdown blocks.
Format:
[
  { "classification": "ALERT" | "INFORMATIVE" | "IRRELEVANT", "hazard": "...", "region": "...", "reasoning": "...", "mitigation": "...", "citizen_action": "...", "confidence": 0-100, "urgency": "HIGH" | "MED" | "LOW" }
]`;

const CATEGORIES = [
  { label: 'Business', uri: 'news/Business' },
  { label: 'Technology', uri: 'news/Technology' },
  { label: 'Health', uri: 'news/Health' },
  { label: 'Environment', uri: 'news/Environment' },
  { label: 'Disasters', uri: 'news/Society/Issues/Environment/Natural_Disasters' },
  { label: 'Politics', uri: 'news/Politics' },
  { label: 'Economy', uri: 'news/Economy' },
];

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

// ─── Branding ──────────────────────────────────────────────────────────────
const Logo = ({ className = "h-8" }) => (
  <img 
    src="/logo.svg" 
    alt="AlertEm Logo" 
    className={`${className} object-contain`} 
  />
);

// ─── Components ──────────────────────────────────────────────────────────────

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
  const addTag = (t) => { if(t && !tags.includes(t)) onAdd(t); setInput(''); setShowSuggest(false); };
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
          onKeyDown={e => { if(e.key === 'Enter') addTag(input.trim()); }}
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

// ─── Main Application ────────────────────────────────────────────────────────

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newsKey, setNewsKey] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [provider, setProvider] = useState('groq-8b');
  const [keywords, setKeywords] = useState(['wildfire']);
  const [zonesInput, setZonesInput] = useState('');
  const [params, setParams] = useState({ cats: [], locs: [], states: [], cities: [], dur: '30d' });
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [rawArticles, setRawArticles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [error, setError] = useState('');

  const countryList = (ENHANCED_COUNTRIES || []).map(c => ({ label: c.name, code: c.code, uri: `http://en.wikipedia.org/wiki/${c.name.replace(/ /g, '_')}` }));
  const stateList = (params.locs || []).reduce((acc, c) => [...acc, ...(ENHANCED_REGIONS[c.code] || [])], []);
  const cityList = (params.states || []).reduce((acc, s) => {
    const cities = citiesByState[s.label] || [];
    return [...acc, ...cities.map(city => ({ label: city, keyword: city, uri: `http://en.wikipedia.org/wiki/${city.replace(/ /g, '_')}` }))];
  }, []);
  
  const activeArticle = selectedIdx !== null ? articles[selectedIdx] : null;

  const alertsCount = articles.filter(a => a.ai.classification === 'ALERT').length;
  const reportsCount = articles.filter(a => a.ai.classification === 'INFORMATIVE').length;

  const handleExecute = async () => {
    if (!newsKey || !aiKey) return setError('Configuration Incomplete');
    if (!keywords.length) return setError('Add at least one keyword');
    setLoading(true); setArticles([]); setSelectedIdx(null); setError('');

    const activeZones = zonesInput.split(',').map(z => z.trim()).filter(Boolean);

    try {
      const dateStart = new Date(Date.now() - (DURATIONS.find(d => d.value === params.dur)?.days || 1) * 86400000).toISOString().split('T')[0];
      const queryParts = [{ "dateStart": dateStart }];
      if (keywords.length === 1) queryParts.push({ "keyword": keywords[0] });
      else if (keywords.length > 1) queryParts.push({ "$or": keywords.map(w => ({ "keyword": w })) });

      if (params.cities.length) {
        queryParts.push({ "$or": [...params.cities.map(c => ({ "locationUri": c.uri })), ...params.cities.map(c => ({ "keyword": c.label }))]});
      } else if (params.states.length) {
        queryParts.push({ "$or": [...params.states.map(s => ({ "locationUri": s.uri })), ...params.states.map(s => ({ "keyword": s.label }))]});
      } else if (params.locs.length) {
        queryParts.push({ "$or": [...params.locs.map(l => ({ "locationUri": l.uri })), ...params.locs.map(l => ({ "keyword": l.label }))]});
      }

      if (params.cats.length) queryParts.push({ "$or": params.cats.map(c => ({ "categoryUri": c.uri })) });

      // TACTICAL RETRY LOGIC
      let res;
      let attempts = 0;
      while (attempts < 2) {
        try {
          res = await fetch(`/internal-sync/api/v1/article/getArticles`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              apiKey: newsKey, 
              action: "getArticles", 
              articlesCount: 40, 
              articlesSortBy: "date", 
              resultType: "articles", 
              dataType: ["news"], 
              query: { "$query": { "$and": queryParts } } 
            })
          });
          if (res.ok) break;
        } catch (e) {
          console.error("News Fetch Attempt Failed:", e);
          if (attempts === 1) throw new Error(`NETWORK_FAILURE: ${e.name} - ${e.message}`);
          await new Promise(r => setTimeout(r, 1000));
        }
        attempts++;
      }

      if (!res.ok) {
        let errText = await res.text();
        try {
          const errObj = JSON.parse(errText);
          errText = errObj.error || errText;
        } catch(e) {}
        throw new Error(errText || `API Error: ${res.status}`);
      }

      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      const raw = data?.articles?.results || [];
      if (!raw.length) throw new Error('NO ARTICLES FOUND');

      const seen = new Set();
      const uniqueRaw = raw.filter(art => {
        const key = art.title.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const processed = [];
      const activeProvider = PROVIDERS.find(p => p.id === provider);
      const locationContext = [...params.cities, ...params.states, ...params.locs].map(l => l.label).join(', ') || 'Global';

      // Neural Batch Processing with Token-Guard
      const chunkSize = 5;
      for (let i = 0; i < uniqueRaw.length; i += chunkSize) {
        const chunk = uniqueRaw.slice(i, i + chunkSize);
        try {
          await new Promise(r => setTimeout(r, 1500)); // Throttling for free-tier stability
          
          const payload = chunk.map((a, idx) => ({ id: idx, title: a.title, body: (a.body || '').slice(0, 250) }));
          
          const aiRes = await fetch(activeProvider.endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiKey}` },
            body: JSON.stringify({ 
              model: activeProvider.model, 
              temperature: 0.1,
              messages: [
                { role: 'system', content: BATCH_CLASSIFY_PROMPT(keywords.join(', '), locationContext) }, 
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
            const aiJson = aiJsonArray[idx] || { classification: 'INFORMATIVE', reasoning: 'Missing from batch', mitigation: 'Monitor status', citizen_action: 'Stay alert', urgency: 'LOW', hazard: 'General', region: 'Global' };
            if (aiJson.classification !== 'IRRELEVANT') {
              processed.push({ ...art, ai: aiJson });
            }
          });
        } catch (e) { 
          setError(`AI Error: ${e.message}`);
          break; // Halt processing on fatal error
        }
      }

      // Consolidation Logic
      const groupedEvents = {};
      
      for (const art of processed) {
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
        
        if (art.ai.urgency === 'HIGH') groupedEvents[groupKey].ai.urgency = 'HIGH';
        
        if ((art.ai.confidence || 0) > groupedEvents[groupKey].ai.confidence) {
          groupedEvents[groupKey].ai.confidence = art.ai.confidence || 0;
          groupedEvents[groupKey].ai.reasoning = art.ai.reasoning;
          groupedEvents[groupKey].ai.mitigation = art.ai.mitigation;
          groupedEvents[groupKey].ai.citizen_action = art.ai.citizen_action;
          groupedEvents[groupKey].source = art.source;
          if (cls !== 'ALERT') groupedEvents[groupKey].title = art.title;
        }
        
        groupedEvents[groupKey].sources.push(art);
      }

      setRawArticles(processed);

      let finalEvents = Object.values(groupedEvents).sort((a, b) => new Date(b.date) - new Date(a.date));
      setArticles(finalEvents);
      
      // AUTO-SELECT the highest priority alert for the Right-Side Solution Panel
      if (finalEvents.length > 0) {
        setSelectedIdx(0);
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
            <div className="flex justify-center mb-8"><Logo className="h-20" /></div>
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
          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${art.ai.classification === 'ALERT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{art.ai.classification}</span>
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
    <div className="h-screen bg-white flex flex-col font-sans overflow-hidden text-gray-900">
      <header className="px-8 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Logo className="h-8" />
          <div className="h-8 w-px bg-gray-100"></div>
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Model: {PROVIDERS.find(p => p.id === provider)?.model}</span>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest">Sign Out</button>
      </header>

      <div className="p-8 pb-4 shrink-0">
        <div className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><span className="w-1.5 h-6 bg-red-600 rounded-full" /><h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Analysis Configuration</h2></div>
            <button onClick={() => { setKeywords(['wildfire']); setZonesInput(''); setParams({ cats: [], locs: [], states: [], cities: [], dur: '30d' }); }} className="text-[9px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest">Reset Analysis</button>
          </div>

          <div className="flex items-start gap-4 flex-wrap">
            <TagInput label="Target Hazards" tags={keywords} onAdd={t => setKeywords([...new Set([...keywords, t])])} onRemove={t => setKeywords(keywords.filter(k => k !== t))} suggestionsLibrary={TACTICAL_LIBRARY} />
            <MultiSelect label="Categories" options={CATEGORIES} selected={params.cats} onChange={v => setParams(p => ({ ...p, cats: v }))} placeholder="All Sectors" />
            <MultiSelect label="Country" options={countryList} selected={params.locs} onChange={v => setParams(p => ({ ...p, locs: v }))} placeholder="Global" />
            <MultiSelect label="State / Region" options={stateList} selected={params.states} onChange={v => setParams(p => ({ ...p, states: v }))} placeholder="All Regions" disabled={!params.locs.length} />
            <MultiSelect label="City" options={cityList} selected={params.cities} onChange={v => setParams(p => ({ ...p, cities: v }))} placeholder="All Cities" disabled={!params.states.length} />
            <div className="w-32">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Duration</label>
              <select value={params.dur} onChange={e => setParams(p => ({ ...p, dur: e.target.value }))} className="h-10 w-full bg-white border border-gray-100 text-[10px] font-black rounded-xl px-3 outline-none cursor-pointer">
                {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="w-56">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Target Zones (Local)</label>
              <input type="text" value={zonesInput} onChange={e => setZonesInput(e.target.value)} placeholder="e.g. Whitefield, JP Nagar" className="h-10 w-full bg-white border border-gray-100 text-[10px] font-bold rounded-xl px-3 outline-none" />
            </div>
            <button onClick={handleExecute} disabled={loading} className="h-10 px-8 mt-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? 'Analyzing...' : <>Run Analysis <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-gray-50 overflow-x-auto pb-1">
            <input type="password" value={newsKey} onChange={e => setNewsKey(e.target.value)} placeholder="NewsAPI Token" className="min-w-[150px] flex-1 h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[10px] font-mono outline-none" />
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setProvider(p.id)} className={`px-4 h-8 text-[8px] font-black uppercase rounded-lg transition-all ${provider === p.id ? 'bg-white text-red-600 shadow-md' : 'text-gray-400 hover:bg-gray-200'}`}>{p.label}</button>
              ))}
            </div>
            <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder={`${PROVIDERS.find(p => p.id === provider)?.label} API Key`} className="min-w-[150px] flex-[1.5] h-10 bg-gray-50/50 border border-gray-100 rounded-xl px-4 text-[10px] font-mono outline-none" />
          </div>
          {error && <div className="text-[10px] font-black text-red-600 uppercase text-center bg-red-50 py-2 rounded-xl border border-red-100 animate-pulse overflow-hidden px-4">{error}</div>}
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* SECTOR 1: GLOBAL INTEL FEED (RAW) */}
        <section className="w-[28%] bg-gray-50 border-r border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 bg-white/50 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse"></span>
              Global Intel Feed (Raw)
            </span>
            <span className="text-[8px] font-black text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">{rawArticles.length} Sources</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {rawArticles.map((art, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2 hover:border-red-100 transition-all cursor-default group">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{art.source?.title || 'Unknown Source'}</span>
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase ${art.ai.classification === 'ALERT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {art.ai.classification}
                  </span>
                </div>
                <h4 className="text-[10px] font-black text-gray-700 leading-tight group-hover:text-red-600 transition-colors">{art.title}</h4>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[7px] font-bold text-gray-300 uppercase">{new Date(art.date).toLocaleDateString()}</span>
                  <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Signal Locked</span>
                </div>
              </div>
            ))}
            {rawArticles.length === 0 && <div className="h-full flex flex-col items-center justify-center space-y-2 opacity-30">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Awaiting Sensors...</p>
            </div>}
          </div>
        </section>

        {/* SECTOR 2: TACTICAL ALERT LEDGER (NEURAL) */}
        <section className="w-[32%] bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-2xl relative z-10">
          <div className="p-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
              Tactical Alert Ledger
            </span>
            <span className="text-[8px] font-black text-red-600 px-2 py-0.5 bg-red-50 rounded-full">{articles.filter(a => a.ai.classification === 'ALERT').length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-red-50/50 scrollbar-hide">
            {articles.filter(a => a.ai.classification === 'ALERT').map((art, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedIdx(articles.indexOf(art))}
                className={`p-6 space-y-4 cursor-pointer transition-all border-l-4 ${selectedIdx === articles.indexOf(art) ? 'bg-red-50 border-red-600 shadow-inner' : 'hover:bg-gray-50 border-transparent'}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Active Threat</span>
                  </div>
                  <span className="text-[8px] font-black text-gray-300">{new Date(art.date).toLocaleDateString()}</span>
                </div>
                <h3 className="text-[12px] font-black text-gray-900 leading-tight uppercase tracking-tight">{art.ai.hazard} in {art.ai.region}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(n => <div key={n} className="w-4 h-4 rounded-full border border-white bg-gray-200"></div>)}
                  </div>
                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{art.sources?.length || 1} Combined Reports</span>
                  <span className={`text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest ${art.ai.urgency === 'HIGH' ? 'bg-red-600' : 'bg-orange-500'}`}>{art.ai.urgency}</span>
                </div>
              </div>
            ))}
            {articles.filter(a => a.ai.classification === 'ALERT').length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Perimeter Secure</p>
              </div>
            )}
          </div>
        </section>

        {/* SECTOR 3: OPERATIONAL SOLUTIONS */}
        <section className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          <div className="p-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Master Tactical Directive
            </span>
            {activeArticle && <span className="text-[8px] font-black text-green-600 px-3 py-1 bg-green-50 rounded-lg border border-green-100 uppercase tracking-widest">Unified Intelligence</span>}
          </div>
          {activeArticle ? (
            <div className="flex-1 overflow-y-auto p-10 space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 scrollbar-hide">
              {/* Directive Header */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm">Operational Order</div>
                   <div className="h-px flex-1 bg-gray-200"></div>
                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">{activeArticle.sources?.length || 1} Neural Sources Synthesized</div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none uppercase">
                    {activeArticle.ai.hazard} <span className="text-red-600">Detected</span>
                  </h2>
                  <p className="text-lg font-black text-gray-500 uppercase tracking-tighter">Region: {activeArticle.ai.region}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1 tracking-[0.2em]">Threat Level</span>
                  <span className={`text-lg font-black ${activeArticle.ai.urgency === 'HIGH' ? 'text-red-600' : 'text-orange-500'}`}>{activeArticle.ai.urgency}</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1 tracking-[0.2em]">Confidence</span>
                  <span className="text-lg font-black text-green-600">{activeArticle.ai.confidence}%</span>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1 tracking-[0.2em]">Validation</span>
                  <span className="text-lg font-black text-gray-900 uppercase italic">Verified</span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{activeArticle.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                    Source Insight: {activeArticle.sources && activeArticle.sources.length > 1 ? `${activeArticle.sources.length} Combined Neural Sources` : activeArticle.source?.title}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 bg-red-600 text-white rounded-[2.5rem] shadow-2xl shadow-red-200 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <div className="flex items-center gap-3"><svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-[10px] font-black uppercase tracking-widest text-red-100">Tactical Mitigation Directive</span></div>
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Consolidated Strategic Response</span>
                    <p className="text-lg font-black leading-tight tracking-tight">{activeArticle.ai.mitigation || 'Maintain standard monitoring protocols.'}</p>
                  </div>
                </div>

                <div className="p-8 bg-yellow-50 border-2 border-yellow-100 rounded-[2.5rem] space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-lg font-black text-xl">!</div>
                      <div>
                        <h3 className="text-[10px] font-black text-yellow-900 uppercase tracking-widest leading-none">Civilian Safety Advisory</h3>
                        <p className="text-[8px] font-black text-yellow-600 uppercase tracking-widest mt-1">Personal Emergency Protocol</p>
                      </div>
                    </div>
                    <span className="bg-yellow-200 text-yellow-800 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Immediate Action</span>
                  </div>
                  <div className="bg-white/80 p-6 rounded-[2rem] border border-yellow-200/50">
                    <p className="text-sm font-black text-yellow-900 leading-relaxed italic italic-style">
                      "{activeArticle.ai.citizen_action || 'Follow local authorities and maintain emergency preparedness.'}"
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-gray-900 text-white rounded-[2.5rem] shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Neural Reasoning Engine</span></div>
                  <p className="text-sm font-bold text-gray-300 leading-relaxed">"{activeArticle.ai.reasoning}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40 grayscale">
              <div className="w-32 h-32 bg-gray-200 rounded-[3rem] flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">System Standby</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Awaiting Neural Link...</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
