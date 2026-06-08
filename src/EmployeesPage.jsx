import React, { useState } from 'react';
import { COUNTRIES } from './data/countries';
import { regionsByCountry } from './data/regions';

const EMPTY_FORM = {
  firstName: '', lastName: '', company: '', companyEmail: '',
  personalEmail: '', phone: '', country: '', state: '',
};

export default function EmployeesPage({ employees = [], setEmployees }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editIdx, setEditIdx] = useState(null);
  const [search, setSearch] = useState('');

  const stateOptions = form.country
    ? (regionsByCountry[form.country] || []).map(r => r.label)
    : [];

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    if (editIdx !== null) {
      const updated = [...employees];
      updated[editIdx] = { ...form, id: employees[editIdx].id };
      setEmployees(updated);
    } else {
      setEmployees([...employees, { ...form, id: Date.now() }]);
    }
    setForm({ ...EMPTY_FORM });
    setEditIdx(null);
    setShowModal(false);
  };

  const handleEdit = (idx) => {
    setForm({ ...employees[idx] });
    setEditIdx(idx);
    setShowModal(true);
  };

  const handleDelete = (idx) => {
    setEmployees(employees.filter((_, i) => i !== idx));
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditIdx(null);
    setShowModal(true);
  };

  const filtered = employees.filter(emp => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.company.toLowerCase().includes(q) ||
      emp.companyEmail.toLowerCase().includes(q)
    );
  });

  const countryName = (code) => COUNTRIES.find(c => c.code === code)?.name || code;

  return (
    <div className="emp-page">
      {/* Header */}
      <div className="emp-topbar">
        <div className="emp-topbar-left">
          <span className="emp-topbar-accent" />
          <h1 className="emp-topbar-title">Employees</h1>
          <span className="emp-topbar-count">{employees.length}</span>
        </div>
        <div className="emp-topbar-right">
          <div className="emp-search-box">
            <svg className="emp-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="emp-search-input"
            />
          </div>
          <button onClick={openAdd} className="emp-add-btn">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* Table or Empty */}
      <div className="emp-body">
        {employees.length === 0 ? (
          <div className="emp-empty">
            <div className="emp-empty-circle">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="emp-empty-title">No Employees Added</h2>
            <p className="emp-empty-desc">Click "Add Employee" to start building your team directory.</p>
            <button onClick={openAdd} className="emp-empty-btn">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Employee
            </button>
          </div>
        ) : (
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Company Email</th>
                  <th>Personal Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                  const realIdx = employees.indexOf(emp);
                  return (
                    <tr key={emp.id || idx}>
                      <td className="emp-td-num">{idx + 1}</td>
                      <td>
                        <div className="emp-name-cell">
                          <div className="emp-avatar">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="emp-company">{emp.company || '—'}</span></td>
                      <td><span className="emp-email">{emp.companyEmail || '—'}</span></td>
                      <td><span className="emp-email">{emp.personalEmail || '—'}</span></td>
                      <td><span className="emp-phone">{emp.phone || '—'}</span></td>
                      <td>
                        <span className="emp-location">
                          {emp.state && emp.country ? `${emp.state}, ${countryName(emp.country)}` :
                           emp.country ? countryName(emp.country) : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="emp-actions">
                          <button onClick={() => alert(`Simulated push alert sent to ${emp.firstName} ${emp.lastName}'s devices.`)} className="emp-action-btn emp-action-push" title="Push Alert">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </button>
                          <button onClick={() => handleEdit(realIdx)} className="emp-action-btn emp-action-edit" title="Edit">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(realIdx)} className="emp-action-btn emp-action-delete" title="Delete">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && search && (
              <div className="emp-no-results">No employees match "{search}"</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="emp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="emp-modal" onClick={e => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2 className="emp-modal-title">{editIdx !== null ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="emp-modal-close">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="emp-modal-body">
              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>First Name <span className="emp-required">*</span></label>
                  <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" />
                </div>
                <div className="emp-form-group">
                  <label>Last Name <span className="emp-required">*</span></label>
                  <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" />
                </div>
              </div>

              <div className="emp-form-group">
                <label>Company</label>
                <input type="text" value={form.company} onChange={e => set('company', e.target.value)} placeholder="Acme Corp" />
              </div>

              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>Company Email</label>
                  <input type="email" value={form.companyEmail} onChange={e => set('companyEmail', e.target.value)} placeholder="john@company.com" />
                </div>
                <div className="emp-form-group">
                  <label>Personal Email</label>
                  <input type="email" value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)} placeholder="john@gmail.com" />
                </div>
              </div>

              <div className="emp-form-group">
                <label>Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>

              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>Country</label>
                  <select value={form.country} onChange={e => set('country', e.target.value)}>
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="emp-form-group">
                  <label>State / Region</label>
                  {stateOptions.length > 0 ? (
                    <select value={form.state} onChange={e => set('state', e.target.value)} disabled={!form.country}>
                      <option value="">Select State</option>
                      {stateOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={form.state} 
                      onChange={e => set('state', e.target.value)} 
                      placeholder="Enter state/region" 
                      disabled={!form.country}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="emp-modal-footer">
              <button onClick={() => setShowModal(false)} className="emp-btn-cancel">Cancel</button>
              <button onClick={handleSave} className="emp-btn-save" disabled={!form.firstName.trim() || !form.lastName.trim()}>
                {editIdx !== null ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
