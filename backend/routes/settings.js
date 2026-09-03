import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT key, value FROM settings`);
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/', async (req, res) => {
  try {
    await db.query('BEGIN');
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      await db.query(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`, [k, String(v)]);
    }
    await db.query('COMMIT');
    
    const { rows } = await db.query(`SELECT key, value FROM settings`);
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
