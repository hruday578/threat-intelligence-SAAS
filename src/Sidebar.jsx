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
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
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
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="sidebar-nav-icon">{item.icon}</div>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
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
