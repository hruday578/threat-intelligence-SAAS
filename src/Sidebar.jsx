import React from 'react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'maps',
    label: 'Maps',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'risk-assessment',
    label: 'Risk Assessment',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'explorer',
    label: 'Explorer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'system-logs',
    label: 'System Logs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, errorCount = 0 }) {
  return (
    <aside
      className="sidebar-root"
      style={{
        width: collapsed ? 68 : 220,
        minWidth: collapsed ? 68 : 220,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo + Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-logo-area">
          {collapsed ? (
            <div className="sidebar-logo-icon">
              <img src="/alertem-logo.png" alt="AlertEm" className="sidebar-logo-img-small" />
            </div>
          ) : (
            <div className="sidebar-logo-full">
              <img src="/alertem-logo.png" alt="AlertEm" className="sidebar-logo-img-full" />
            </div>
          )}
        </div>
        <button onClick={onToggle} className="sidebar-toggle-btn" title={collapsed ? 'Expand' : 'Collapse'}>
          <svg
            className="sidebar-toggle-icon"
            style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          const isLogs = item.id === 'system-logs';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="sidebar-nav-icon relative">
                {item.icon}
                {isLogs && errorCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-slate-900 animate-pulse" />
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                  <span className="sidebar-nav-label truncate">{item.label}</span>
                  {isLogs && errorCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[8px] font-black rounded-full bg-red-600 text-white">
                      {errorCount}
                    </span>
                  )}
                </div>
              )}
              {isActive && <div className="sidebar-nav-active-bar" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-text">
            <span className="sidebar-footer-brand">ALERTEM</span>
            <span className="sidebar-footer-version">v2.0 Tactical</span>
          </div>
        )}
      </div>
    </aside>
  );
}
