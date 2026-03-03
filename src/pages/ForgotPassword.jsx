import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AuthShell, Field, ErrorMsg, SuccessMsg, SubmitButton, inputCls } from './Login';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Step 1: enter email  |  Step 2: enter token + new password
  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [token,   setToken]   = useState('');
  const [devLink, setDevLink] = useState('');
  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await forgotPassword(email.trim());
      // In local dev the backend returns the token directly
      if (data.reset_token) {
        setToken(data.reset_token);
        setDevLink(data.reset_url || '');
      }
      setSuccess('Reset token generated. In production this would be emailed to you.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) { setError('Reset token is required'); return; }
    if (!form.password) { setError('Password is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, form.password);
      setSuccess('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/Login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? 'Reset password' : 'Set new password'}
      subtitle={step === 1 ? 'Enter your email to get a reset token' : 'Enter the token and your new password'}>

      {step === 1 ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <Field label="Email address">
            <input type="email" placeholder="you@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              className={inputCls} />
          </Field>

          {error   && <ErrorMsg   msg={error} />}
          {success && <SuccessMsg msg={success} />}

          <SubmitButton loading={loading}>Send reset token</SubmitButton>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {/* In local dev show the token so devs can copy it */}
          {devLink && (
            <div className="rounded-xl px-4 py-3 text-xs break-all"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--text-secondary)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--brand-gold)' }}>Local dev — token pre-filled</p>
              <p className="font-mono break-all" style={{ color: 'var(--text-muted)' }}>{token}</p>
            </div>
          )}

          <Field label="Reset token">
            <input type="text" placeholder="Paste reset token"
              value={token} onChange={e => { setToken(e.target.value); setError(''); }}
              className={inputCls} />
          </Field>

          <Field label="New password">
            <input type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => set('password', e.target.value)}
              className={inputCls} />
          </Field>

          <Field label="Confirm new password">
            <input type="password" placeholder="Re-enter password"
              value={form.confirm} onChange={e => set('confirm', e.target.value)}
              className={inputCls} />
          </Field>

          {error   && <ErrorMsg   msg={error} />}
          {success && <SuccessMsg msg={success} />}

          <SubmitButton loading={loading}>Reset password</SubmitButton>
        </form>
      )}

      <div className="mt-5 text-center">
        <Link to="/Login" className="inline-flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={12} /> Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
