import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool, initDb, ENTITY_TABLE } from './db.js';

dotenv.config();

const app     = express();
const PORT    = Number(process.env.BACKEND_PORT || 8000);
const APP_ID  = process.env.VITE_BASE44_APP_ID || 'local';
const JWT_SECRET = process.env.JWT_SECRET || 'habit-dashboard-jwt-secret-change-in-prod';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';
const RESET_TOKEN_EXPIRY_MINUTES = 30;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok      = (res, data)  => res.status(200).json(data);
const created = (res, data)  => res.status(201).json(data);
const notFound   = (res, msg) => res.status(404).json({ error: msg || 'Not found' });
const badRequest = (res, msg) => res.status(400).json({ error: msg });
const unauthorized = (res, msg) => res.status(401).json({ error: msg || 'Unauthorized' });

function buildWhereClause(filter) {
  const keys = Object.keys(filter);
  if (!keys.length) return { where: '', values: [] };
  const clauses = keys.map((k, i) => `${k} = $${i + 1}`);
  return { where: `WHERE ${clauses.join(' AND ')}`, values: Object.values(filter) };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getTokenFromRequest(req) {
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return req.headers['x-token'] || null;
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  ok(res, { status: 'ok', port: PORT });
});

// ─── Public app settings ──────────────────────────────────────────────────────

app.get('/api/apps/public/prod/public-settings/by-id/:id', (_req, res) => {
  ok(res, {
    id: APP_ID,
    public_settings: {
      app_name: 'Habit Dashboard',
      auth_required: true,
      theme: 'dark',
    },
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) return badRequest(res, 'Email and password are required');
  if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters');

  const raw = getTokenFromRequest(req);
  if (!raw) return unauthorized(res, 'Admin authentication required');
  const payload = verifyToken(raw);
  if (!payload || payload.role !== 'admin') return unauthorized(res, 'Admin access required');

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return badRequest(res, 'An account with this email already exists');

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (email, full_name, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, email, full_name, role, created_at`,
      [email.toLowerCase(), full_name?.trim() || '', hash]
    );
    const user = rows[0];
    created(res, { user });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return badRequest(res, 'Email and password are required');

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!rows.length) return unauthorized(res, 'Invalid email or password');

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return unauthorized(res, 'Invalid email or password');

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;
    ok(res, { token, user: safeUser });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// LOGOUT  — client-side token removal; this endpoint just confirms success
app.post('/api/auth/logout', (_req, res) => {
  ok(res, { success: true });
});

// FORGOT PASSWORD — generates a reset token (returned in response for local dev)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return badRequest(res, 'Email is required');

  try {
    const { rows } = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Don't reveal whether the email exists
    if (!rows.length) {
      return ok(res, { message: 'If that email exists, a reset link has been sent.' });
    }

    const token      = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_email, token, expires_at)
       VALUES ($1, $2, $3)`,
      [email.toLowerCase(), token, expiresAt]
    );

    // In production this token would be emailed; in local dev we return it directly
    ok(res, {
      message: 'Reset link generated.',
      reset_token: token,
      reset_url: `http://localhost:5173/ResetPassword?token=${token}`,
      expires_in: `${RESET_TOKEN_EXPIRY_MINUTES} minutes`,
    });
  } catch (err) {
    console.error('[forgot-password]', err.message);
    res.status(500).json({ error: 'Could not generate reset token' });
  }
});

// RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return badRequest(res, 'Token and new password are required');
  if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters');

  try {
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    if (!rows.length) return badRequest(res, 'Reset token is invalid or has expired');

    const resetRecord = rows[0];
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, resetRecord.user_email]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetRecord.id]);

    ok(res, { message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('[reset-password]', err.message);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ─── Current User (JWT-protected) ────────────────────────────────────────────

app.get('/api/apps/:appId/entities/User/me', async (req, res) => {
  const raw = getTokenFromRequest(req);
  if (!raw) return unauthorized(res, 'No token provided');

  const payload = verifyToken(raw);
  if (!payload) return unauthorized(res, 'Invalid or expired token');

  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [payload.id]
    );
    if (!rows.length) return notFound(res, 'User not found');
    ok(res, rows[0]);
  } catch (err) {
    console.error('[/me]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics (no-op) ───────────────────────────────────────────────────────

app.post('/api/apps/:appId/analytics/track/batch', (_req, res) => {
  ok(res, { received: true });
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
// Reads the JWT, sets req.authUser. Returns 401 if missing/invalid.

function requireAuth(req, res, next) {
  const raw = getTokenFromRequest(req);
  if (!raw) return unauthorized(res, 'Authentication required');
  const payload = verifyToken(raw);
  if (!payload) return unauthorized(res, 'Invalid or expired token');
  req.authUser = payload; // { id, email, role }
  next();
}

// Tables whose records are always scoped to the authenticated user
const USER_SCOPED_TABLES = new Set(['habit_logs']);
const ADMIN_ONLY_TABLES = new Set(['users']);

// ─── Generic entity CRUD ──────────────────────────────────────────────────────

// LIST / FILTER
app.get('/api/apps/:appId/entities/:entity', requireAuth, async (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return notFound(res, `Unknown entity: ${req.params.entity}`);
  if (ADMIN_ONLY_TABLES.has(table) && req.authUser.role !== 'admin') {
    return unauthorized(res, 'Admin access required');
  }

  try {
    const { q, sort, limit } = req.query;
    let filter = {};

    if (q) {
      try { filter = JSON.parse(q); } catch { return badRequest(res, 'Invalid q param'); }
    }

    // Force HabitLog queries to only return the authenticated user's records
    if (USER_SCOPED_TABLES.has(table)) {
      filter.user_email = req.authUser.email;
    }

    let query, values = [];
    const filterKeys = Object.keys(filter);

    if (filterKeys.length) {
      const { where, values: vals } = buildWhereClause(filter);
      query  = `SELECT * FROM ${table} ${where} ORDER BY created_at ASC`;
      values = vals;
    } else {
      const orderField = sort ? sort.replace(/[^a-z_]/gi, '') : 'created_at';
      const rowLimit   = parseInt(limit) || 500;
      query  = `SELECT * FROM ${table} ORDER BY ${orderField} ASC LIMIT ${rowLimit}`;
    }

    const { rows } = await pool.query(query, values);
    ok(res, rows.map(({ password_hash: _, ...r }) => r));
  } catch (err) {
    console.error(`[GET ${req.params.entity}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// CREATE
app.post('/api/apps/:appId/entities/:entity', requireAuth, async (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return notFound(res, `Unknown entity: ${req.params.entity}`);
  if (ADMIN_ONLY_TABLES.has(table) && req.authUser.role !== 'admin') {
    return unauthorized(res, 'Admin access required');
  }

  const { id: _id, created_at: _ca, updated_at: _ua, ...fields } = req.body || {};

  // Always stamp HabitLog with the authenticated user's email — prevents spoofing
  if (USER_SCOPED_TABLES.has(table)) {
    fields.user_email = req.authUser.email;
  }

  if (!Object.keys(fields).length) return badRequest(res, 'Empty body');

  const cols   = Object.keys(fields);
  const vals   = Object.values(fields);
  const params = cols.map((_, i) => `$${i + 1}`);

  try {
    const { rows } = await pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${params.join(', ')}) RETURNING *`,
      vals
    );
    created(res, rows[0]);
  } catch (err) {
    console.error(`[POST ${req.params.entity}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/apps/:appId/entities/:entity/:id', requireAuth, async (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return notFound(res, `Unknown entity: ${req.params.entity}`);
  if (ADMIN_ONLY_TABLES.has(table) && req.authUser.role !== 'admin') {
    return unauthorized(res, 'Admin access required');
  }

  const { id: _id, created_at: _ca, updated_at: _ua, password_hash: _ph, ...fields } = req.body || {};

  // For user-scoped tables, ensure the record belongs to the authenticated user
  if (USER_SCOPED_TABLES.has(table)) {
    const { rows } = await pool.query(
      `SELECT user_email FROM ${table} WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return notFound(res, `${req.params.entity} not found`);
    if (rows[0].user_email !== req.authUser.email) return unauthorized(res, 'Access denied');
    // Prevent changing ownership
    fields.user_email = req.authUser.email;
  }

  if (!Object.keys(fields).length) return badRequest(res, 'No updatable fields');

  const sets = Object.keys(fields).map((k, i) => `${k} = $${i + 1}`);
  const vals = [...Object.values(fields), req.params.id];

  const hasUpdatedAt = ['habit_logs', 'day_contents', 'custom_fields'].includes(table);
  if (hasUpdatedAt) sets.push('updated_at = NOW()');

  try {
    const { rows } = await pool.query(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return notFound(res, `${req.params.entity} not found`);
    const { password_hash: _, ...safe } = rows[0];
    ok(res, safe);
  } catch (err) {
    console.error(`[PUT ${req.params.entity}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/apps/:appId/entities/:entity/:id', requireAuth, async (req, res) => {
  const table = ENTITY_TABLE[req.params.entity];
  if (!table) return notFound(res, `Unknown entity: ${req.params.entity}`);
  if (ADMIN_ONLY_TABLES.has(table) && req.authUser.role !== 'admin') {
    return unauthorized(res, 'Admin access required');
  }

  try {
    // For user-scoped tables, only allow deleting own records
    const ownershipClause = USER_SCOPED_TABLES.has(table)
      ? `AND user_email = '${req.authUser.email}'`
      : '';

    const { rowCount } = await pool.query(
      `DELETE FROM ${table} WHERE id = $1 ${ownershipClause}`, [req.params.id]
    );
    if (!rowCount) return notFound(res, `${req.params.entity} not found or access denied`);
    ok(res, { deleted: true });
  } catch (err) {
    console.error(`[DELETE ${req.params.entity}]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Catch-all ────────────────────────────────────────────────────────────────

app.use((req, res) => {
  console.warn(`[backend] unhandled: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ─── Start ────────────────────────────────────────────────────────────────────

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[backend] running on http://localhost:${PORT}`);
      console.log(`[backend] database: ${process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@')}`);
    });
  })
  .catch((err) => {
    console.error('[backend] failed to init db:', err.message);
    process.exit(1);
  });
