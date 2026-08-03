import React, { useState, useEffect, useCallback } from 'react';

// ─── Storage helpers ───────────────────────────────────────────────────────────
const STORE_KEY = 'alertem_eq_response';
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
}
function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// ─── Icon helpers ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 5, color = 'currentColor', sw = 2 }) => (
  <svg className={`w-${size} h-${size} shrink-0`} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={sw}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// ─── Phase tabs data ───────────────────────────────────────────────────────────
const PHASES = [
  { id: 'prep',      label: 'Preparedness',  emoji: '🟡', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { id: 'active',   label: 'Active',         emoji: '🔴', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { id: 'immediate',label: 'Immediate',      emoji: '🟠', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { id: 'recovery', label: 'Recovery',       emoji: '🟢', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
];

// ─── Travel risk levels ────────────────────────────────────────────────────────
const TRAVEL_LEVELS = [
  { id: 'green',  label: 'Green — Travel Permitted',     emoji: '🟢', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  { id: 'amber',  label: 'Amber — Essential Travel Only',emoji: '🟡', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  { id: 'red',    label: 'Red — All Travel Suspended',   emoji: '🔴', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
];

// ─── IMT roles ─────────────────────────────────────────────────────────────────
const IMT_ROLES = [
  { id: 'commander',    label: 'Incident Commander',         icon: '🎖️' },
  { id: 'safety',       label: 'Safety Officer',              icon: '🦺' },
  { id: 'warden1',      label: 'Floor Warden — Level 1',     icon: '🚪' },
  { id: 'warden2',      label: 'Floor Warden — Level 2',     icon: '🚪' },
  { id: 'hr',           label: 'HR Lead',                    icon: '👥' },
  { id: 'it',           label: 'IT Lead',                    icon: '💻' },
  { id: 'comms',        label: 'Communications Lead',        icon: '📢' },
  { id: 'logistics',    label: 'Logistics Lead',             icon: '📦' },
];
const IMT_STATUSES = ['Standby', 'Notified', 'Confirmed', 'On Station'];

// ─── BC Functions ──────────────────────────────────────────────────────────────
const BC_FUNCTIONS = [
  'Finance', 'Customer Service', 'Trading Operations', 'IT Operations',
  'Security Operations', 'HR & Payroll', 'Supply Chain', 'Contact Center',
];
const BC_STATUSES = ['Standby', 'Activated', 'Degraded', 'Restored'];
const BC_STATUS_COLORS = {
  Standby:   { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  Activated: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  Degraded:  { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  Restored:  { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
};

// ─── Checklist data by phase ───────────────────────────────────────────────────
const CHECKLISTS = {
  prep: {
    governance: [
      'Establish an Earthquake Emergency Response Plan',
      'Define Incident Management Team (IMT) roles and responsibilities',
      'Nominate Floor Wardens and Emergency Coordinators',
      'Maintain updated employee emergency contact information',
    ],
    infrastructure: [
      'Conduct seismic risk assessment for all offices',
      'Verify building seismic compliance certificates',
      'Secure heavy furniture, racks, servers and filing cabinets',
      'Install automatic gas shut-off valves where applicable',
      'Protect critical electrical infrastructure',
      'Maintain emergency lighting and backup power',
    ],
    resources: [
      'First aid kits and trauma kits',
      'Stretchers and PPE',
      'Satellite phones and portable radios',
      'Emergency food and water (minimum 72 hours)',
      'Fire extinguishers and flashlights',
      'Battery banks and emergency blankets',
      'Emergency generators',
    ],
    training: [
      'Conduct Drop, Cover and Hold On awareness training',
      'Train staff on evacuation procedures and assembly points',
      'Conduct fire response and aftershock awareness training',
      'Brief staff on family emergency planning',
      'Conduct earthquake drills at least twice annually',
    ],
  },
  active: {
    employees: [
      'Stay calm',
      'Drop, Cover and Hold On',
      'Stay away from glass partitions',
      'Do not use elevators',
      'Protect head and neck',
      'Avoid running while shaking continues',
      'Stop machinery where safely possible',
      'If outdoors — move away from buildings, power lines and trees',
      'If driving — stop safely away from bridges, tunnels and flyovers',
    ],
  },
  immediate: {
    lifesafety: [
      'Pre-activate Incident Management Team and confirm roles',
      'Pre-stage headcount logs and verify safe assembly point routes',
      'Pre-position emergency first aid kits and trauma supplies',
      'Verify direct hotline access to local emergency services (Police, Fire, Ambulance)',
      'Monitor early warning alerts for potential secondary hazards or aftershocks',
      'Restrict access to high-risk zones ahead of hazard escalation',
    ],
    building: [
      'Conduct pre-hazard structural integrity checks on facility frames and exits',
      'Inspect automatic gas shut-off valves and leak detection sensors',
      'Audit electrical surge protection and emergency generator transfer switches',
      'Clear potential fire hazards and flammable materials from main exit pathways',
      'Inspect water supply lines and emergency plumbing isolation valves',
      'Verify hazardous chemical containment barriers and spill kits',
      'Audit elevator emergency recall mechanisms with certified engineers',
    ],
    property: [
      'Pre-emptively secure confidential documents in fireproof/waterproof vaults',
      'Gracefully shut down critical IT systems and server racks to prevent power-loss data corruption',
      'Protect critical assets and hardware with surge protectors and emergency covers',
      'Document baseline facility condition and equipment logs for pre-disaster insurance verification',
      'Secure sensitive areas and restrict access to authorized personnel only',
    ],
  },
  recovery: {
    crisis: [
      'Activate Crisis Management Team',
      'Activate Business Continuity Team',
      'Open Emergency Operations Center',
      'Convene Executive Decision Team',
    ],
    assessment: [
      'Assess employee safety status — confirm all accounted for',
      'Assess building usability with structural engineer',
      'Assess IT infrastructure and server health',
      'Assess network availability and internet connectivity',
      'Assess data center status and backup integrity',
      'Assess supplier disruption and customer impact',
      'Assess utility and transportation availability',
    ],
    itdr: [
      'Validate data integrity across all systems',
      'Confirm cloud availability and redundancy',
      'Monitor cybersecurity posture — elevated threat post-disaster',
      'Test backup restoration capability',
      'Activate DR Site if primary office is unavailable',
      'Restore critical applications and communication systems',
      'Restore VPN connectivity for remote workforce',
    ],
    comms: [
      'Issue employee status update via SMS and email',
      'Notify customers of service impact',
      'Notify key suppliers of operational status',
      'Brief Board of Directors and executive team',
      'Submit regulatory notifications where required',
      'Brief insurance providers and file preliminary claim',
      'Issue authorized media statement if required',
    ],
  },
};

// ─── Executive Framework ───────────────────────────────────────────────────────
const EXEC_FRAMEWORK = [
  {
    objective: 'People & Assets', icon: '🛡️',
    h1: 'Life safety, evacuation, accountability',
    h24: 'Structural inspection, medical care, secure assets',
    hw: 'Repairs, insurance, return-to-office planning',
  },
  {
    objective: 'Business Continuity', icon: '⚙️',
    h1: 'Activate Crisis & BC Teams',
    h24: 'Recover critical services, alternate workplace, stakeholder communication',
    hw: 'Restore normal operations, validate recovery, implement improvements',
  },
  {
    objective: 'Travel Advisory', icon: '✈️',
    h1: 'Suspend travel, account for travelers',
    h24: 'Reassess affected routes, relocate staff if needed',
    hw: 'Resume travel in phases based on official guidance',
  },
];

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ done, total, color = '#dc2626' }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black tabular-nums" style={{ color }}>{done}/{total}</span>
    </div>
  );
}

// ─── Interactive Checklist ─────────────────────────────────────────────────────
function InteractiveChecklist({ items, checked, onToggle, accent = '#dc2626' }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const done = checked[i];
        return (
          <li key={i}
            className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
            onClick={() => onToggle(i)}
          >
            <span className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: done ? accent : '#d1d5db', background: done ? accent : 'transparent' }}>
              {done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className={`text-[12px] font-semibold leading-snug transition-all ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Collapsible card ──────────────────────────────────────────────────────────
function Section({ title, icon, accent = '#dc2626', defaultOpen = true, progress, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 bg-gray-50/80 hover:bg-gray-100/60 transition-all text-left outline-none">
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{title}</p>
          {progress && <div className="mt-1">{progress}</div>}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EarthquakeResponsePage({ activeArticle, onNavigate }) {
  // ── Persistent state ──
  const [store, setStore] = useState(loadStore);

  const update = useCallback((key, val) => {
    setStore(prev => {
      const next = { ...prev, [key]: val };
      saveStore(next);
      return next;
    });
  }, []);

  // ── Phase ──
  const [phase, setPhase] = useState(store.phase || 'prep');
  useEffect(() => { update('phase', phase); }, [phase, update]);

  // ── Travel risk ──
  const [travelRisk, setTravelRisk] = useState(store.travelRisk || 'green');
  const [travelUpdated, setTravelUpdated] = useState(store.travelUpdated || '');
  const setTravel = (id) => {
    const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setTravelRisk(id);
    setTravelUpdated(ts);
    update('travelRisk', id);
    update('travelUpdated', ts);
  };

  // ── IMT roles ──
  const [imtStatus, setImtStatus] = useState(store.imtStatus || {});
  const setImt = (roleId, status) => {
    const next = { ...imtStatus, [roleId]: status };
    setImtStatus(next);
    update('imtStatus', next);
  };

  // ── BC functions ──
  const [bcStatus, setBcStatus] = useState(store.bcStatus || {});
  const setBc = (fn, status) => {
    const next = { ...bcStatus, [fn]: status };
    setBcStatus(next);
    update('bcStatus', next);
  };

  // ── Checklists ──
  const [checks, setChecks] = useState(store.checks || {});
  const toggleCheck = (phase, section, idx) => {
    const key = `${phase}_${section}`;
    const prev = checks[key] || {};
    const next = { ...checks, [key]: { ...prev, [idx]: !prev[idx] } };
    setChecks(next);
    update('checks', next);
  };
  const getChecked = (phase, section) => checks[`${phase}_${section}`] || {};

  // ── Live alert ──
  const isLiveEq = activeArticle &&
    activeArticle.ai?.classification === 'ALERT' &&
    /earthquake|seismic|tremor|quake/i.test((activeArticle.ai?.hazard || '') + ' ' + (activeArticle.ai?.reasoning || ''));

  // ── IMT activation % ──
  const imtActivated = IMT_ROLES.filter(r => imtStatus[r.id] === 'On Station').length;
  const imtPct = Math.round((imtActivated / IMT_ROLES.length) * 100);

  // ── BC restoration % ──
  const bcRestored = BC_FUNCTIONS.filter(f => bcStatus[f] === 'Restored').length;
  const bcPct = Math.round((bcRestored / BC_FUNCTIONS.length) * 100);

  // ── Export / Print ──
  const handleExport = () => {
    const el = document.getElementById('eq-print-area');
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>EQ Situation Report</title>
      <style>body{font-family:'Inter', sans-serif;padding:24px;color:#111;}
      h1{color:#dc2626;}h2{color:#1e3a5f;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #e5e7eb;padding:8px;font-size:12px;}
      th{background:#f9fafb;}</style></head><body>`);
    win.document.write(`<h1>🌐 Earthquake Situation Report</h1>`);
    win.document.write(`<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>`);
    win.document.write(`<p><strong>Phase:</strong> ${PHASES.find(p => p.id === phase)?.label}</p>`);
    win.document.write(`<p><strong>Travel Risk:</strong> ${TRAVEL_LEVELS.find(t => t.id === travelRisk)?.label}</p>`);
    win.document.write(`<p><strong>IMT Activation:</strong> ${imtPct}% (${imtActivated}/${IMT_ROLES.length} On Station)</p>`);
    win.document.write(`<p><strong>BC Recovery:</strong> ${bcPct}% (${bcRestored}/${BC_FUNCTIONS.length} Restored)</p>`);
    win.document.write('<h2>IMT Status</h2><table><tr><th>Role</th><th>Status</th></tr>');
    IMT_ROLES.forEach(r => {
      win.document.write(`<tr><td>${r.icon} ${r.label}</td><td>${imtStatus[r.id] || 'Standby'}</td></tr>`);
    });
    win.document.write('</table>');
    win.document.write('<h2>BC Function Status</h2><table><tr><th>Function</th><th>Status</th></tr>');
    BC_FUNCTIONS.forEach(f => {
      win.document.write(`<tr><td>${f}</td><td>${bcStatus[f] || 'Standby'}</td></tr>`);
    });
    win.document.write('</table></body></html>');
    win.document.close();
    win.print();
  };

  const travelLevel = TRAVEL_LEVELS.find(t => t.id === travelRisk);
  const phaseData = PHASES.find(p => p.id === phase);

  return (
    <div id="eq-print-area" className="eq-page flex-1 overflow-y-auto bg-gray-50">

      {/* ── Live Alert Banner ── */}
      {isLiveEq && (
        <div className="sticky top-0 z-50 flex items-center gap-3 px-6 py-3 text-white font-black text-[12px] uppercase tracking-widest shadow-lg"
          style={{ background: 'linear-gradient(90deg, #7f1d1d, #dc2626)' }}>
          <span className="animate-pulse">⚠️</span>
          <span>LIVE ALERT: {activeArticle.ai.hazard} detected in {activeArticle.ai.region} — This response plan is now active</span>
          <button onClick={() => onNavigate?.('dashboard')}
            className="ml-auto text-[10px] bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all">
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="eq-hero px-8 py-10 text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a1a2e 100%)' }}>
        <div className="flex justify-center mb-4">
          <span className="text-[12px] font-black text-red-500 uppercase tracking-[3px] bg-red-500/15 px-4 py-1.5 rounded-full border border-red-500/30">
            ● ISO 22301:2019 Aligned
          </span>
        </div>
        <h1 className="text-[28px] font-black text-white leading-[1.2] mb-3">
          Earthquake Organizational<br />Response Framework
        </h1>
        <p className="text-[13px] text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed">
          Integrated lifecycle response · Life Safety · Crisis Management · Business Continuity ·
          Disaster Recovery · Supply Chain Resilience · Travel Risk Management
        </p>
        {/* Export button */}
        <button onClick={handleExport}
          className="mx-auto flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all hover:bg-white/10 active:scale-95 text-slate-200 border border-slate-600/50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Export Situation Report
        </button>
      </div>

      <div className="eq-content max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Phase Tabs ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Response Phase</p>
          <div className="grid grid-cols-4 gap-2">
            {PHASES.map(p => (
              <button key={p.id} onClick={() => setPhase(p.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all font-black text-[11px] uppercase tracking-widest"
                style={{
                  borderColor: phase === p.id ? p.color : '#e5e7eb',
                  background: phase === p.id ? p.bg : '#f9fafb',
                  color: phase === p.id ? p.color : '#9ca3af',
                }}>
                <span className="text-xl">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            OBJECTIVE 1 — PEOPLE, PROPERTY & ASSETS
        ═══════════════════════════════════════════════ */}
        <div>
          <div className="rounded-2xl px-5 py-4 mb-4 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)' }}>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-red-200 mb-1">Objective 01</p>
            <h2 className="text-[18px] font-black">Protect People, Company Property & Critical Assets</h2>
            <p className="text-[11px] text-red-100 mt-1">Priority: Life Safety First</p>
          </div>

          {/* PHASE: PREPAREDNESS */}
          {(phase === 'prep') && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                🟡 Phase 1 — Before the Earthquake (Preparedness)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'governance', title: 'Governance', icon: '⚖️', color: '#dc2626' },
                  { key: 'infrastructure', title: 'Infrastructure', icon: '🏢', color: '#b91c1c' },
                  { key: 'resources', title: 'Emergency Resources', icon: '🧰', color: '#991b1b' },
                  { key: 'training', title: 'Employee Preparedness', icon: '🎓', color: '#7f1d1d' },
                ].map(({ key, title, icon, color }) => {
                  const items = CHECKLISTS.prep[key];
                  const chk = getChecked('prep', key);
                  const done = items.filter((_, i) => chk[i]).length;
                  return (
                    <Section key={key} title={title} icon={icon} accent={color}
                      progress={<ProgressBar done={done} total={items.length} color={color} />}>
                      <InteractiveChecklist items={items} checked={chk} accent={color}
                        onToggle={i => toggleCheck('prep', key, i)} />
                    </Section>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHASE: ACTIVE */}
          {phase === 'active' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                🔴 Phase 2 — During the Earthquake
              </p>
              {(() => {
                const items = CHECKLISTS.active.employees;
                const chk = getChecked('active', 'employees');
                const done = items.filter((_, i) => chk[i]).length;
                return (
                  <Section title="Employee Actions During Shaking" icon="🫂" accent="#dc2626"
                    progress={<ProgressBar done={done} total={items.length} color="#dc2626" />}>
                    <InteractiveChecklist items={items} checked={chk} accent="#dc2626"
                      onToggle={i => toggleCheck('active', 'employees', i)} />
                  </Section>
                );
              })()}
            </div>
          )}

          {/* PHASE: IMMEDIATE */}
          {phase === 'immediate' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                🟠 Phase 3 — Immediately After the Earthquake
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'lifesafety', title: 'Life Safety Actions', icon: '🚑', color: '#dc2626' },
                  { key: 'building',   title: 'Building Safety Checks', icon: '🏗️', color: '#b91c1c' },
                  { key: 'property',   title: 'Property Protection', icon: '🔐', color: '#991b1b' },
                ].map(({ key, title, icon, color }) => {
                  const items = CHECKLISTS.immediate[key];
                  const chk = getChecked('immediate', key);
                  const done = items.filter((_, i) => chk[i]).length;
                  return (
                    <Section key={key} title={title} icon={icon} accent={color}
                      progress={<ProgressBar done={done} total={items.length} color={color} />}>
                      <InteractiveChecklist items={items} checked={chk} accent={color}
                        onToggle={i => toggleCheck('immediate', key, i)} />
                    </Section>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHASE: RECOVERY — show recovery sections under this objective too */}
          {phase === 'recovery' && (
            <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
              Recovery actions are covered under Objective 2 below ↓
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            IMT ACTIVATION PANEL
        ═══════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div>
              <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">🎖️ IMT Activation Status</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Incident Management Team — Role Accountability</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[18px] font-black" style={{ color: imtPct === 100 ? '#16a34a' : '#dc2626' }}>{imtPct}%</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Activated</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(${imtPct === 100 ? '#16a34a' : '#dc2626'} ${imtPct * 3.6}deg, #f3f4f6 0deg)` }}>
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-black text-gray-600">{imtActivated}/{IMT_ROLES.length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {IMT_ROLES.map(role => {
              const status = imtStatus[role.id] || 'Standby';
              const statusIdx = IMT_STATUSES.indexOf(status);
              const colors = {
                Standby:    'bg-gray-100 text-gray-500',
                Notified:   'bg-yellow-100 text-yellow-700',
                Confirmed:  'bg-blue-100 text-blue-700',
                'On Station': 'bg-green-100 text-green-700',
              };
              return (
                <div key={role.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] font-black text-gray-700 leading-snug truncate" title={role.label}>{role.icon} {role.label}</p>
                  <div className="flex gap-1 flex-wrap">
                    {IMT_STATUSES.map(s => (
                      <button key={s} onClick={() => setImt(role.id, s)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md transition-all ${status === s ? colors[s] + ' ring-1 ring-current' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200/50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            OBJECTIVE 2 — BUSINESS CONTINUITY
        ═══════════════════════════════════════════════ */}
        <div>
          <div className="rounded-2xl px-5 py-4 mb-4 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 60%, #3b82f6 100%)' }}>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-blue-200 mb-1">Objective 02</p>
            <h2 className="text-[18px] font-black">Recover Operations & Ensure Business Continuity</h2>
            <p className="text-[11px] text-blue-100 mt-1">Priority: Restore Critical Services Quickly</p>
          </div>

          {/* Recovery checklists */}
          {phase === 'recovery' && (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'crisis',      title: 'Crisis Team Activation', icon: '🚨', color: '#1d4ed8' },
                  { key: 'assessment',  title: 'Situation Assessment',   icon: '📋', color: '#2563eb' },
                  { key: 'itdr',        title: 'IT Disaster Recovery',   icon: '💻', color: '#3b82f6' },
                  { key: 'comms',       title: 'Communication Strategy', icon: '📢', color: '#60a5fa' },
                ].map(({ key, title, icon, color }) => {
                  const items = CHECKLISTS.recovery[key];
                  const chk = getChecked('recovery', key);
                  const done = items.filter((_, i) => chk[i]).length;
                  return (
                    <Section key={key} title={title} icon={icon} accent={color}
                      progress={<ProgressBar done={done} total={items.length} color={color} />}>
                      <InteractiveChecklist items={items} checked={chk} accent={color}
                        onToggle={i => toggleCheck('recovery', key, i)} />
                    </Section>
                  );
                })}
              </div>
            </div>
          )}

          {/* BC Function Activation Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-4">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">⚙️ BC Function Status</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Business Continuity — Critical Function Recovery</p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-black" style={{ color: bcPct === 100 ? '#16a34a' : '#1d4ed8' }}>{bcPct}%</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Restored</p>
              </div>
            </div>
            <div className="p-1 border-b border-gray-100">
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-full transition-all duration-500 rounded-full"
                  style={{ width: `${bcPct}%`, background: bcPct === 100 ? '#16a34a' : '#1d4ed8' }} />
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {BC_FUNCTIONS.map(fn => {
                const status = bcStatus[fn] || 'Standby';
                const c = BC_STATUS_COLORS[status];
                const statusIdx = BC_STATUSES.indexOf(status);
                return (
                  <div key={fn} className="border border-gray-100 bg-white rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-black text-gray-700 truncate" title={fn}>{fn}</p>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: c.bg, color: c.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                      {status}
                    </span>
                    <div className="flex gap-1 flex-wrap pt-1">
                      {BC_STATUSES.map(s => (
                        <button key={s} onClick={() => setBc(fn, s)}
                          className={`text-[8.5px] font-black px-1.5 py-0.5 rounded transition-all ${status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            OBJECTIVE 3 — TRAVEL RISK MANAGEMENT
        ═══════════════════════════════════════════════ */}
        <div>
          <div className="rounded-2xl px-5 py-4 mb-4 text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}>
            <p className="text-[9px] font-black uppercase tracking-[4px] text-slate-300 mb-1">Objective 03</p>
            <h2 className="text-[18px] font-black">Travel Advisory & Employee Mobility Management</h2>
            <p className="text-[11px] text-slate-300 mt-1">Priority: Prevent Employees from Entering Unsafe Areas</p>
          </div>

          {/* Travel Risk Level Selector */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Travel Risk Level</p>
              {travelUpdated && (
                <p className="text-[9px] text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                  ✓ Updated by Analyst · {travelUpdated}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TRAVEL_LEVELS.map(t => (
                <button key={t.id} onClick={() => setTravel(t.id)}
                  className="p-3 rounded-xl border-2 text-center transition-all font-black flex flex-col items-center justify-center gap-1"
                  style={{
                    borderColor: travelRisk === t.id ? t.color : '#e5e7eb',
                    background: travelRisk === t.id ? t.bg : '#f9fafb',
                    color: travelRisk === t.id ? t.color : '#9ca3af',
                    transform: travelRisk === t.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: travelRisk === t.id ? `0 4px 12px ${t.color}30` : 'none',
                  }}>
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-[10px] uppercase tracking-widest leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Travel checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Section title="Before Travel — Risk Monitoring" icon="🔍" accent="#0f3460">
              <ul className="space-y-2">
                {['Government travel advisories', 'Local emergency management agencies', 'Seismic alerts', 'Airport operations', 'Road closures', 'Rail disruptions', 'Hotel availability'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 font-semibold leading-snug bg-gray-50 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1" /> {item}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Corporate Travel Control Actions" icon="✈️" accent="#0f3460">
              <ul className="space-y-2">
                {['Suspend travel into affected areas immediately', 'Relocate visiting employees from the area', 'Account for all currently travelling staff', 'Establish direct contact with stranded employees', 'Arrange emergency accommodation as needed', 'Arrange evacuation flights if necessary', 'Maintain communication every few hours until safe'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 font-semibold leading-snug bg-gray-50 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1" /> {item}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            EXECUTIVE DECISION FRAMEWORK
        ═══════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-[13px] font-black text-gray-800 uppercase tracking-widest">Executive Decision Framework</h2>
            <p className="text-[10px] text-gray-500 mt-0.5 font-semibold">Time-phased response objectives for organizational leadership</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-widest bg-gray-100 border-b border-gray-200 w-40">Objective</th>
                  <th className="px-4 py-3 text-left font-black text-white uppercase tracking-widest" style={{ background: '#7f1d1d' }}>First 1 Hour</th>
                  <th className="px-4 py-3 text-left font-black text-white uppercase tracking-widest" style={{ background: '#1e3a5f' }}>First 24 Hours</th>
                  <th className="px-4 py-3 text-left font-black text-white uppercase tracking-widest" style={{ background: '#1a1a2e' }}>First Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {EXEC_FRAMEWORK.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3.5 font-black text-gray-700 flex items-center gap-2 border-r border-gray-100">
                      <span className="text-sm">{row.icon}</span> {row.objective}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-semibold leading-relaxed border-r border-gray-100">{row.h1}</td>
                    <td className="px-4 py-3.5 text-gray-600 font-semibold leading-relaxed border-r border-gray-100">{row.h24}</td>
                    <td className="px-4 py-3.5 text-gray-600 font-semibold leading-relaxed">{row.hw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            GORISCO RECOMMENDATIONS
        ═══════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-8">
          <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
            <span className="text-[9px] font-black uppercase tracking-[3px] text-blue-300">Gorisco Consulting Differentiators</span>
            <h2 className="text-[16px] font-black text-white mt-1">Recommendations for Gorisco Clients</h2>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold">Key differentiators to emphasize when advising clients on integrated resilience programs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white">
            {[
              { n: '01', title: 'Integrate Emergency Response with Business Continuity', body: 'Treat Emergency Response and Business Continuity as a single unified program — not separate initiatives. This eliminates response gaps and ensures seamless transition from life safety to operational recovery.' },
              { n: '02', title: 'Adopt a People-First Recovery Model', body: 'Employee safety and accountability must drive all subsequent recovery decisions. No recovery action should commence before life safety is confirmed and all personnel are accounted for.' },
              { n: '03', title: 'Deploy a Mass Notification Platform', body: 'Use AlertEm to send location-based alerts, confirm employee safety, issue evacuation instructions, and distribute travel advisories in real time — across SMS, email, mobile app and WhatsApp simultaneously.' },
              { n: '04', title: 'Conduct Realistic Simulation Exercises', body: 'Run comprehensive earthquake simulations involving executive leadership, facilities, IT, HR, security, and all business units to validate both emergency response and business continuity plans.' },
            ].map((card, i) => (
              <div key={i} className={`p-5 flex gap-4 ${i < 2 ? 'md:border-b border-gray-100' : ''} ${i % 2 === 0 ? 'md:border-r border-gray-100' : ''} border-b border-gray-100 md:border-b-0`}>
                <span className="text-[24px] font-black text-gray-200 shrink-0 leading-none">{card.n}</span>
                <div>
                  <h4 className="text-[12px] font-black text-gray-800 mb-1.5 leading-snug">{card.title}</h4>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200 mt-8 mb-8">
          <p className="text-[10px] font-semibold text-gray-400">
            Aligned with <strong className="text-gray-500">ISO 22301:2019</strong> Business Continuity Management · International Emergency Management Practices
          </p>
          <p className="text-[10px] font-bold text-gray-300 mt-2">© Gorisco Resilience Consulting · AlertEm Platform</p>
        </div>

      </div>
    </div>
  );
}
