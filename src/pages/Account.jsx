import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const inputCls = `
  w-full px-3 py-2 rounded-lg border text-sm outline-none
  focus:border-yellow-500/60
`.replace(/\s+/g, ' ').trim();

export default function Account() {
  const { user, updateProfile, changePassword } = useAuth();

  const [username, setUsername] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (user?.full_name != null) setUsername(user.full_name);
  }, [user?.full_name]);

  const saveUsername = async (e) => {
    e.preventDefault();
    const n = username.trim();
    if (!n) {
      setProfileMsg({ type: 'err', text: 'Username is required.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await updateProfile({ full_name: n });
      setProfileMsg({ type: 'ok', text: 'Username saved.' });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err.message || 'Could not save username.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (!currentPwd || !newPwd) {
      setPwdMsg({ type: 'err', text: 'Fill in current and new password.' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({ type: 'ok', text: 'Password updated.' });
    } catch (err) {
      setPwdMsg({ type: 'err', text: err.message || 'Could not update password.' });
    } finally {
      setPwdSaving(false);
    }
  };

  const msgBox = (msg) =>
    msg.text ? (
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={
          msg.type === 'ok'
            ? { background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
            : { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
        }
      >
        {msg.text}
      </div>
    ) : null;

  return (
    <div className="p-6 md:p-10 max-w-xl mx-auto animate-fade-in-up">
      <h1 className="text-2xl font-bold font-playfair mb-1" style={{ color: 'var(--text-primary)' }}>
        Account
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Update how you appear in the app and your sign-in password.
      </p>

      <div className="glass-card rounded-2xl p-6 border-gold border mb-6">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Username
        </h2>
        <form onSubmit={saveUsername} className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setProfileMsg({ type: '', text: '' });
              }}
              className={inputCls}
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Email (sign-in)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className={inputCls}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(201,168,76,0.15)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed',
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Email cannot be changed here. Contact an admin if you need a different address.
            </p>
          </div>
          {msgBox(profileMsg)}
          <button
            type="submit"
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A8882A)',
              color: '#1A1A2E',
              opacity: profileSaving ? 0.7 : 1,
            }}
          >
            {profileSaving && <Loader2 size={14} className="animate-spin" />}
            Save username
          </button>
        </form>
      </div>

      <div className="glass-card rounded-2xl p-6 border-gold border">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Password
        </h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Current password
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPwd}
              onChange={e => {
                setCurrentPwd(e.target.value);
                setPwdMsg({ type: '', text: '' });
              }}
              className={inputCls}
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              New password
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPwd}
                onChange={e => {
                  setNewPwd(e.target.value);
                  setPwdMsg({ type: '', text: '' });
                }}
                className={`${inputCls} pr-10`}
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
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
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Confirm new password
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPwd}
              onChange={e => {
                setConfirmPwd(e.target.value);
                setPwdMsg({ type: '', text: '' });
              }}
              className={inputCls}
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(201,168,76,0.2)', color: 'var(--text-primary)' }}
            />
          </div>
          {msgBox(pwdMsg)}
          <button
            type="submit"
            disabled={pwdSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A8882A)',
              color: '#1A1A2E',
              opacity: pwdSaving ? 0.7 : 1,
            }}
          >
            {pwdSaving && <Loader2 size={14} className="animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
