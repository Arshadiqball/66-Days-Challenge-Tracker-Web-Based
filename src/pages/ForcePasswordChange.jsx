import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AuthShell, Field, ErrorMsg, SubmitButton, inputCls } from './Login';

export default function ForcePasswordChange() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!current || !nextPwd) {
      setError('Please fill in all fields.');
      return;
    }
    if (nextPwd.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (nextPwd !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await changePassword({ current_password: current, new_password: nextPwd });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Your administrator created your account with a temporary password. Set your own password before continuing."
    >
      <p className="text-sm mb-4 -mt-2" style={{ color: 'var(--text-secondary)' }}>
        Signed in as <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current (temporary) password">
          <input
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="New password">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={nextPwd}
              onChange={e => setNextPwd(e.target.value)}
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm new password">
          <input
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={inputCls}
          />
        </Field>

        {error && <ErrorMsg msg={error} />}

        <SubmitButton loading={loading}>Save password and continue</SubmitButton>
      </form>

      <button
        type="button"
        onClick={() => { logout(); navigate('/Login', { replace: true }); }}
        className="w-full mt-4 py-2 text-sm rounded-xl border transition-colors hover:bg-white/5"
        style={{ borderColor: 'rgba(201,168,76,0.25)', color: 'var(--text-muted)' }}
      >
        Sign out instead
      </button>
    </AuthShell>
  );
}
