import React, { useState } from 'react';

export default function SystemLogsPage({ logs = [], onClearLogs }) {
  const [filter, setFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ANALYSIS') return log.type === 'ANALYSIS';
    if (filter === 'AUTH') return log.type === 'AUTH' || log.type === 'CONFIG';
    if (filter === 'ERRORS') return log.type === 'ERROR';
    if (filter === 'INFO') return log.type === 'INFO';
    return true;
  });

  const analysisCount = logs.filter(l => l.type === 'ANALYSIS').length;
  const authCount = logs.filter(l => l.type === 'AUTH' || l.type === 'CONFIG').length;
  const errorCount = logs.filter(l => l.type === 'ERROR').length;
  const infoCount = logs.filter(l => l.type === 'INFO').length;

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alertem_system_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'ANALYSIS': return 'bg-purple-600 text-white';
      case 'AUTH': return 'bg-emerald-600 text-white';
      case 'CONFIG': return 'bg-indigo-600 text-white';
      case 'ERROR': return 'bg-red-600 text-white';
      case 'INFO': default: return 'bg-blue-600 text-white';
    }
  };

  const getCardStyle = (type) => {
    switch (type) {
      case 'ANALYSIS': return 'bg-purple-50/40 border-purple-100 text-purple-950';
      case 'AUTH': return 'bg-emerald-50/40 border-emerald-100 text-emerald-950';
      case 'CONFIG': return 'bg-indigo-50/40 border-indigo-100 text-indigo-950';
      case 'ERROR': return 'bg-red-50/50 border-red-100 text-red-950';
      case 'INFO': default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 uppercase tracking-widest">System Audit &amp; Tool History</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-wider">
                {logs.length} Total Entries
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Comprehensive audit trail recording user logins, exact analysis query parameters, AI provider executions, auto-pilot scans, and system notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 border border-purple-200 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Logs (JSON)
          </button>
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 border border-slate-200"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setFilter('ANALYSIS')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === 'ANALYSIS' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Analysis Runs ({analysisCount})
          </button>
          <button
            onClick={() => setFilter('AUTH')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === 'AUTH' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Auth &amp; Config ({authCount})
          </button>
          <button
            onClick={() => setFilter('ERRORS')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === 'ERRORS' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Errors ({errorCount})
          </button>
          <button
            onClick={() => setFilter('INFO')}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === 'INFO' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Status Info ({infoCount})
          </button>
        </div>

        <span className="text-[10px] font-semibold text-slate-400">
          Showing {filteredLogs.length} of {logs.length} entries
        </span>
      </div>

      {/* Logs Feed Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 overflow-y-auto shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">No Audit Logs Available</h3>
            <p className="text-[11px] font-semibold text-slate-400 max-w-sm">
              Launch an analysis scan, change risk configurations, or sign in to populate the operational audit history.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && typeof log.details === 'object';

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${getCardStyle(log.type)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${getBadgeStyle(log.type)}`}>
                        {log.type}
                      </span>
                      <h4 className="text-[11px] font-black uppercase tracking-wide text-slate-900">
                        {log.title || log.type}
                      </h4>
                    </div>

                    <div className="shrink-0 text-right flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 block font-mono">
                          {log.timestamp}
                        </span>
                        {log.date && (
                          <span className="text-[9px] font-medium text-slate-400 block">
                            {log.date}
                          </span>
                        )}
                      </div>
                      {hasDetails && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 hover:text-purple-600 hover:border-purple-200 uppercase transition-all shadow-sm"
                        >
                          {isExpanded ? 'Hide Query Parameters' : 'View Query Audit'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] font-medium leading-relaxed break-words font-mono text-slate-700 pl-1">
                    {log.message}
                  </p>

                  {/* Rendered Audit Details Card */}
                  {hasDetails && isExpanded && (
                    <div className="mt-3 p-4 bg-white rounded-xl border border-purple-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[9px] font-black text-purple-700 uppercase tracking-widest">
                          Captured Query Parameters &amp; Results
                        </span>
                        {log.details.provider && (
                          <span className="text-[9px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                            AI Model: {log.details.provider}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Hazards</span>
                          <div className="flex flex-wrap gap-1">
                            {log.details.hazards?.length > 0
                              ? log.details.hazards.map(h => <span key={h} className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-[8px] font-bold border border-orange-200">{h}</span>)
                              : <span className="text-slate-400 font-bold text-[9px]">None</span>}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Concepts</span>
                          <div className="flex flex-wrap gap-1">
                            {log.details.concepts?.length > 0
                              ? log.details.concepts.map(c => <span key={c} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[8px] font-bold border border-purple-200">{c}</span>)
                              : <span className="text-slate-400 font-bold text-[9px]">None</span>}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Location Scope</span>
                          <p className="font-bold text-slate-800 text-[9px] truncate">
                            {log.details.country} {log.details.state !== 'All Regions' ? `> ${log.details.state}` : ''}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Time &amp; Radius</span>
                          <p className="font-bold text-slate-800 text-[9px]">
                            {log.details.duration} | Radius: {log.details.radius}
                          </p>
                        </div>
                      </div>

                      {/* Result metrics if available */}
                      {log.details.totalAnalyzed !== undefined && (
                        <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-[9px] font-black">
                          <span className="text-slate-500 uppercase tracking-wider">Classification Output:</span>
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">{log.details.alertsCount} ALERTS</span>
                          <span className="bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">{log.details.infoCount} INFORMATIVE</span>
                          <span className="bg-slate-400 text-white px-2 py-0.5 rounded shadow-sm">{log.details.irrelevantCount} IRRELEVANT</span>
                          <span className="text-slate-400 font-semibold ml-auto">({log.details.totalAnalyzed} Total Articles Processed)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
