import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AuthShell, Field, ErrorMsg, SuccessMsg, SubmitButton, inputCls } from './Login';

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);
  const isResetPath = location.pathname === '/ResetPassword';

  const [step, setStep] = useState(() => (tokenFromUrl || isResetPath ? 2 : 1));
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep(2);
      setError('');
      setSuccess('');
      return;
    }
    if (isResetPath && !tokenFromUrl) {
      setStep(2);
      setError('Open the reset link from your email. If the link expired, request a new reset below.');
    }
  }, [tokenFromUrl, isResetPath]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setError('');
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await forgotPassword(email.trim());
      setSuccess('If an account exists for this email, you will receive a reset link shortly.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Reset link is missing or invalid. Request a new reset from the forgot password page.');
      return;
    }
    if (!form.password) {
      setError('Password is required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, form.password);
      setSuccess('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/Login', { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? 'Reset password' : 'Set new password'}
      subtitle={
        step === 1
          ? 'We will email you a link to choose a new password'
          : 'Choose a new password for your account'
      }
    >
      {step === 1 ? (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <Field label="Email address">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
              className={inputCls}
            />
          </Field>

          {error && <ErrorMsg msg={error} />}
          {success && <SuccessMsg msg={success} />}

          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {!tokenFromUrl && (
            <Field label="Reset token (from your email link)">
              <input
                type="text"
                placeholder="Paste the token from the reset link if needed"
                value={token}
                onChange={e => {
                  setToken(e.target.value);
                  setError('');
                }}
                className={inputCls}
              />
            </Field>
          )}

          <Field label="New password">
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Confirm new password">
            <input
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              className={inputCls}
            />
          </Field>

          {error && <ErrorMsg msg={error} />}
          {success && <SuccessMsg msg={success} />}

          <SubmitButton loading={loading}>Reset password</SubmitButton>

          {!tokenFromUrl && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Open the link from your email, or{' '}
              <Link to="/ForgotPassword" className="font-semibold hover:underline" style={{ color: 'var(--brand-gold)' }}>
                request a new link
              </Link>
              .
            </p>
          )}
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
