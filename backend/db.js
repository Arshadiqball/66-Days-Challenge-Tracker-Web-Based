import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

pool.on('error', (err) => {
  console.error('[db] unexpected client error', err.message);
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email          TEXT UNIQUE NOT NULL,
        full_name      TEXT NOT NULL DEFAULT '',
        role           TEXT NOT NULL DEFAULT 'user',
        password_hash  TEXT NOT NULL DEFAULT '',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email  TEXT NOT NULL,
        token       TEXT UNIQUE NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email      TEXT NOT NULL,
        day_number      INT  NOT NULL,
        is_bonus        BOOLEAN NOT NULL DEFAULT FALSE,
        completed       BOOLEAN NOT NULL DEFAULT FALSE,
        habit_stacked   TEXT NOT NULL DEFAULT 'no',
        feeling_before  TEXT NOT NULL DEFAULT '',
        feeling_after   TEXT NOT NULL DEFAULT '',
        mood            TEXT NOT NULL DEFAULT '',
        notes           TEXT NOT NULL DEFAULT '',
        trophy_earned   BOOLEAN NOT NULL DEFAULT FALSE,
        log_date        TEXT NOT NULL DEFAULT '',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS day_contents (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_number       INT  NOT NULL,
        is_bonus         BOOLEAN NOT NULL DEFAULT FALSE,
        habit_title      TEXT NOT NULL DEFAULT '',
        habit_emoji      TEXT NOT NULL DEFAULT '',
        quote_of_day     TEXT NOT NULL DEFAULT '',
        quote_author     TEXT NOT NULL DEFAULT '',
        why_this_habit   TEXT NOT NULL DEFAULT '',
        action_plan      TEXT NOT NULL DEFAULT '',
        affirmation      TEXT NOT NULL DEFAULT '',
        category         TEXT NOT NULL DEFAULT 'Morning',
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS custom_fields (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_label   TEXT NOT NULL DEFAULT '',
        field_type    TEXT NOT NULL DEFAULT 'textarea',
        field_options TEXT NOT NULL DEFAULT '',
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order    INT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Add password_hash column to existing users table if it was created without it
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
    `);

    // Ensure the primary admin account always exists
    await client.query(`
      INSERT INTO users (email, full_name, role, password_hash)
      VALUES ('arshadiqbal.d@gmail.com', 'Arshad Iqbal', 'admin', '')
      ON CONFLICT (email) DO UPDATE SET role = 'admin';
    `);

    console.log('[db] schema ready');
  } finally {
    client.release();
  }
}

export const ENTITY_TABLE = {
  HabitLog:    'habit_logs',
  DayContent:  'day_contents',
  CustomField: 'custom_fields',
  User:        'users',
};
