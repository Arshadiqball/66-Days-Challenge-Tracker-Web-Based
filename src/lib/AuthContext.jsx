import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// @ts-ignore
const AuthContext = createContext(null);

const TOKEN_KEY = 'base44_access_token'; // base44 SDK reads this key automatically
const API_BASE  = '/api/auth';

async function apiPost(path, body) {
  const res = await fetch(path, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);

  // ── Bootstrap: check saved token on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }

    // eslint-disable-next-line no-undef
    const _env = /** @type {any} */ (import.meta).env || {};
    fetch(`/api/apps/${_env.VITE_BASE44_APP_ID || 'local'}/entities/User/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u  => { setUser(u); setIsAuthenticated(true); })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async ({ email, password, full_name }) => {
    const { token, user: u } = await apiPost(`${API_BASE}/register`, { email, password, full_name });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    setIsAuthenticated(true);
    return u;
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { token, user: u } = await apiPost(`${API_BASE}/login`, { email, password });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(u);
    setIsAuthenticated(true);
    return u;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    return apiPost(`${API_BASE}/forgot-password`, { email });
  }, []);

  // ── Reset Password ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (token, password) => {
    return apiPost(`${API_BASE}/reset-password`, { token, password });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      register,
      login,
      logout,
      forgotPassword,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
