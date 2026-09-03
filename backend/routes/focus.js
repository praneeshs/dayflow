import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

function computeElapsed(session) {
  if (session.status !== 'running') return session.elapsed_seconds;
  // started_at might be a Date object in pg, or a string
  const startedStr = session.started_at instanceof Date ? session.started_at.toISOString() : String(session.started_at);
  const startedAt = new Date(startedStr.replace(' ', 'T').endsWith('Z') ? startedStr : startedStr + 'Z').getTime();
  const now = Date.now();
  const runningExtra = Math.floor((now - startedAt) / 1000);
  return session.elapsed_seconds + Math.max(0, runningExtra);
}

// GET active session (the one currently running or most recently paused today)
router.get('/active', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await db.query(
      `SELECT * FROM focus_sessions WHERE date = $1 AND status IN ('running','paused') ORDER BY id DESC LIMIT 1`,
      [today]
    );
    if (rows.length === 0) return res.json(null);
    const session = rows[0];
    res.json({ ...session, live_elapsed_seconds: computeElapsed(session) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { rows } = await db.query(`SELECT * FROM focus_sessions WHERE date = $1 ORDER BY id ASC`, [today]);
    res.json(rows.map(s => ({ ...s, live_elapsed_seconds: computeElapsed(s) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { task_id = null, label = 'Focus Session', duration_minutes = 45 } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    // auto end any other running session
    await db.query(`UPDATE focus_sessions SET status='ended', ended_at=NOW(), elapsed_seconds = elapsed_seconds WHERE status='running'`);

    const { rows } = await db.query(`
      INSERT INTO focus_sessions (task_id, label, duration_minutes, elapsed_seconds, status, started_at, date)
      VALUES ($1, $2, $3, 0, 'running', NOW(), $4)
      RETURNING *
    `, [task_id, label, duration_minutes, today]);

    if (task_id) {
      await db.query(`UPDATE tasks SET status='in_progress' WHERE id=$1`, [task_id]);
    }

    res.status(201).json({ ...rows[0], live_elapsed_seconds: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/pause', async (req, res) => {
  try {
    const { rows: sessionRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    if (sessionRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const session = sessionRows[0];
    const elapsed = computeElapsed(session);
    
    await db.query(`UPDATE focus_sessions SET status='paused', elapsed_seconds=$1 WHERE id=$2`, [elapsed, req.params.id]);
    
    const { rows: updatedRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    res.json({ ...updatedRows[0], live_elapsed_seconds: elapsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    await db.query(`UPDATE focus_sessions SET status='running', started_at=NOW() WHERE id=$1`, [req.params.id]);
    const { rows: updatedRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    const session = updatedRows[0];
    res.json({ ...session, live_elapsed_seconds: computeElapsed(session) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/extend', async (req, res) => {
  try {
    const { minutes = 5 } = req.body;
    await db.query(`UPDATE focus_sessions SET duration_minutes = duration_minutes + $1 WHERE id=$2`, [minutes, req.params.id]);
    const { rows: updatedRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    const session = updatedRows[0];
    res.json({ ...session, live_elapsed_seconds: computeElapsed(session) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const { rows: sessionRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    if (sessionRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const session = sessionRows[0];
    const elapsed = computeElapsed(session);
    
    await db.query(`UPDATE focus_sessions SET status='completed', ended_at=NOW(), elapsed_seconds=$1 WHERE id=$2`, [elapsed, req.params.id]);
    
    if (session.task_id) {
      await db.query(`UPDATE tasks SET spent_minutes = COALESCE(spent_minutes, 0) + $1 WHERE id=$2`, [Math.round(elapsed / 60), session.task_id]);
    }
    
    const { rows: updatedRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    res.json({ ...updatedRows[0], live_elapsed_seconds: elapsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const { rows: sessionRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    if (sessionRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const session = sessionRows[0];
    const elapsed = computeElapsed(session);
    
    await db.query(`UPDATE focus_sessions SET status='ended', ended_at=NOW(), elapsed_seconds=$1 WHERE id=$2`, [elapsed, req.params.id]);
    
    if (session.task_id) {
      await db.query(`UPDATE tasks SET spent_minutes = COALESCE(spent_minutes, 0) + $1 WHERE id=$2`, [Math.round(elapsed / 60), session.task_id]);
    }
    
    const { rows: updatedRows } = await db.query(`SELECT * FROM focus_sessions WHERE id=$1`, [req.params.id]);
    res.json({ ...updatedRows[0], live_elapsed_seconds: elapsed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
