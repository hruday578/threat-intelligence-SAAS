import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Logo = ({ className = "h-16" }) => (
  <img
    src="/alertem-logo.png"
    alt="AlertEm Logo"
    className={`${className} object-contain`}
  />
);

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signInWithEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      console.error('[AuthPage] Error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Soft Red Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/60 relative z-10 space-y-6">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <Logo className="h-24" />
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2.5">
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">
              Corporate Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@enterprise.com"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition-all"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-red-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Log In to Dashboard'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 text-center text-[9px] font-mono text-slate-400">
          ALERTEM SaaS v2.0 • Secure Authentication Area
        </div>
      </div>
    </div>
  );
}
