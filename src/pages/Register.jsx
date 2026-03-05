import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AuthShell, Field, ErrorMsg, SuccessMsg, SubmitButton, inputCls } from './Login';

export default function Register() {
  const { user, createUserByAdmin } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill in all required fields'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      await createUserByAdmin({ full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      setSuccess('Account created successfully.');
      setForm({ full_name: '', email: '', password: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <AuthShell title="Access denied" subtitle="Only admins can access private registration">
        <div className="space-y-4">
          <ErrorMsg msg="You need admin access to create new accounts." />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}
          >
            Back to Dashboard
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Private registration" subtitle="Admin-only user account creation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <input type="text" autoComplete="name" placeholder="Your name"
            value={form.full_name} onChange={e => set('full_name', e.target.value)}
            className={inputCls} />
        </Field>

        <Field label="Email address">
          <input type="email" autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            className={inputCls} />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)}
              className={`${inputCls} pr-10`} />
            <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password">
          <input type={showPwd ? 'text' : 'password'} autoComplete="new-password"
            placeholder="Re-enter password"
            value={form.confirm} onChange={e => set('confirm', e.target.value)}
            className={inputCls} />
        </Field>

        {error && <ErrorMsg msg={error} />}
        {success && <SuccessMsg msg={success} />}

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Return to{' '}
        <Link to="/Admin" className="font-semibold hover:underline" style={{ color: 'var(--brand-gold)' }}>
          Admin dashboard
        </Link>
      </p>
    </AuthShell>
  );
}
