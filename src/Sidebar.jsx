import React from 'react';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Threat Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
      </svg>
    ),
  },
  {
    id: 'maps',
    label: 'Map View',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    id: 'employees',
    label: 'Alert Recipients',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'risk-assessment',
    label: 'Organizational Details',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'explorer',
    label: 'Threat Explorer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: 'system-logs',
    label: 'System Logs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, errorCount = 0, isDarkMode = false }) {
  const logoSrc = isDarkMode ? "/monochrome_logo.png" : "/alertem-logo.png";
  return (
    <aside
      className={`sidebar-root ${isDarkMode ? 'sidebar-dark' : 'sidebar-light'}`}
      style={{
        width: collapsed ? 68 : 260,
        minWidth: collapsed ? 68 : 260,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo + Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-logo-area">
          {collapsed ? (
            <div className="sidebar-logo-icon">
              <img src={logoSrc} alt="ThreatLazer" className="sidebar-logo-img-small" />
            </div>
          ) : (
            <div className="sidebar-logo-full">
              <img src={logoSrc} alt="ThreatLazer.AI" className="sidebar-logo-img-full" />
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
              </div>
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
                  <span className="sidebar-nav-label">{item.label}</span>
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
            <span className="sidebar-footer-brand">THREATLAZER.AI</span>
            <span className="sidebar-footer-version">v2.0 Tactical</span>
          </div>
        )}
      </div>
    </aside>
  );
}
