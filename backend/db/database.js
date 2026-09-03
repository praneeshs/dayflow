import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

export async function initSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT DEFAULT 'primary',
      due_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      is_current INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      category TEXT DEFAULT 'Work',
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'planned',
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      start_time TEXT,
      end_time TEXT,
      est_minutes INTEGER DEFAULT 30,
      spent_minutes INTEGER DEFAULT 0,
      due_date TEXT DEFAULT CURRENT_DATE::text,
      completed_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      label TEXT,
      duration_minutes INTEGER DEFAULT 45,
      elapsed_seconds INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      date TEXT DEFAULT CURRENT_DATE::text
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'Work',
      event_date TEXT DEFAULT CURRENT_DATE::text,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const { rows } = await db.query('SELECT COUNT(*) AS c FROM settings');
  if (parseInt(rows[0].c, 10) === 0) {
    await seed();
  }
}

async function seed() {
  const defaultSettings = {
    full_name: 'Praneesh',
    job_title: 'Product & Tech',
    timezone: '(GMT+05:30) Chennai, Kolkata',
    daily_max_deep_work: '8',
    core_work_start: '09:00',
    core_work_end: '17:30',
    evening_hard_stop: '1',
    default_task_duration: '45',
    meeting_buffer: '15',
    focus_protocol: 'flowmodoro',
    hydration_nudges: '1',
    eye_relief: '1',
    lunch_lock: '1',
    theme: 'light',
  };
  
  for (const [k, v] of Object.entries(defaultSettings)) {
    await db.query(`INSERT INTO settings (key, value) VALUES ($1, $2)`, [k, v]);
  }
}
