/**
 * Direct API client for entity operations.
 * Reads the JWT from localStorage on EVERY request (not at module init),
 * so it always has the current logged-in user's token.
 */

const TOKEN_KEY = 'base44_access_token';
const APP_ID    = import.meta.env.VITE_BASE44_APP_ID || 'local';
const BASE      = `/api/apps/${APP_ID}/entities`;

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function entityApi(name) {
  const base = `${BASE}/${name}`;
  return {
    filter: (q)         => request('GET',    `${base}?q=${encodeURIComponent(JSON.stringify(q))}`),
    list:   (sort, lim) => request('GET',    `${base}?sort=${sort}&limit=${lim ?? 500}`),
    create: (data)      => request('POST',   base, data),
    update: (id, data)  => request('PUT',    `${base}/${id}`, data),
    delete: (id)        => request('DELETE', `${base}/${id}`),
  };
}

export const entities = {
  HabitLog:    entityApi('HabitLog'),
  DayContent:  entityApi('DayContent'),
  CustomField: entityApi('CustomField'),
  User:        entityApi('User'),
};
