import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const d = date || new Date().toISOString().slice(0, 10);
    const { rows } = await db.query(`SELECT * FROM calendar_events WHERE event_date = $1 ORDER BY start_time ASC`, [d]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description = '', category = 'Work', event_date, start_time, end_time, task_id = null } = req.body;
    if (!title || !start_time || !end_time) return res.status(400).json({ error: 'title, start_time, end_time required' });
    const d = event_date || new Date().toISOString().slice(0, 10);
    const { rows } = await db.query(`
      INSERT INTO calendar_events (title, description, category, event_date, start_time, end_time, task_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, category, d, start_time, end_time, task_id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { rows: existingRows } = await db.query(`SELECT * FROM calendar_events WHERE id=$1`, [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const existing = existingRows[0];
    
    const fields = ['title', 'description', 'category', 'event_date', 'start_time', 'end_time', 'done'];
    const updates = [];
    const params = [];
    let paramIndex = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${paramIndex++}`); params.push(req.body[f]); }
    }
    if (!updates.length) return res.json(existing);
    params.push(req.params.id);
    const { rows } = await db.query(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM calendar_events WHERE id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
