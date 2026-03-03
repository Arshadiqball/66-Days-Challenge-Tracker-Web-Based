import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email address">
          <input
            type="email" autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            className={inputCls} />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)}
              className={`${inputCls} pr-10`} />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <div className="text-right -mt-2">
          <Link to="/ForgotPassword" className="text-xs hover:underline" style={{ color: 'var(--brand-gold)' }}>
            Forgot password?
          </Link>
        </div>

        {error && <ErrorMsg msg={error} />}

        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/Register" className="font-semibold hover:underline" style={{ color: 'var(--brand-gold)' }}>
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── Shared auth shell ────────────────────────────────────────────────────────
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--brand-navy)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        :root {
          --brand-gold:#C9A84C; --brand-gold-light:#E8C96A; --brand-gold-dark:#A8882A;
          --brand-dark:#1A1A2E; --brand-navy:#0F0F23; --brand-mid:#16213E;
          --brand-surface:#1E2A45; --text-primary:#F5F0E8; --text-secondary:#B8B0A0; --text-muted:#7A7268;
        }
        .text-gold-gradient{background:linear-gradient(135deg,#C9A84C,#E8C96A,#C9A84C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        textarea,input{background:transparent !important;}
        textarea::placeholder,input::placeholder{color:var(--text-muted);}
      `}</style>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)' }}>
            <Trophy size={20} style={{ color: '#1A1A2E' }} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-gold-gradient">66 Days</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Challenge</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border"
          style={{ background: 'rgba(30,42,69,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(201,168,76,0.2)' }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────
export const inputCls = `
  w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
  focus:border-yellow-500/60
`.replace(/\s+/g, ' ').trim();

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <style>{`.auth-input{background:rgba(255,255,255,0.04) !important;border-color:rgba(201,168,76,0.2);color:var(--text-primary);}
      .auth-input:focus{border-color:rgba(201,168,76,0.5);}`}</style>
      {React.cloneElement(React.Children.only(children), {
        className: `${children.props.className || ''} auth-input`,
      })}
    </div>
  );
}

export function ErrorMsg({ msg }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
      {msg}
    </div>
  );
}

export function SuccessMsg({ msg }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
      {msg}
    </div>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity"
      style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E', opacity: loading ? 0.7 : 1 }}>
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
