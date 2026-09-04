import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// GET /api/tasks?filter=today|upcoming|completed|overdue|all&category=Work&priority=High&q=search
router.get('/', async (req, res) => {
  try {
    const { filter = 'today', category, priority, q } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    let sql = `SELECT t.*, g.title AS goal_title FROM tasks t LEFT JOIN goals g ON g.id = t.goal_id WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filter === 'today') {
      sql += ` AND t.due_date = $${paramIndex++} AND t.status != 'overdue'`;
      params.push(today);
    } else if (filter === 'upcoming') {
      sql += ` AND t.due_date > $${paramIndex++} AND t.status NOT IN ('completed')`;
      params.push(today);
    } else if (filter === 'completed') {
      sql += ` AND t.status = 'completed'`;
    } else if (filter === 'overdue') {
      sql += ` AND t.status = 'overdue'`;
    }

    if (category && category !== 'All') {
      sql += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }
    if (priority && priority !== 'All') {
      sql += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (q) {
      sql += ` AND (t.title ILIKE $${paramIndex++} OR t.notes ILIKE $${paramIndex++})`;
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY t.status='completed' ASC, ${filter === 'today' ? 't.start_time ASC,' : ''} t.sort_order ASC, t.id ASC`;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/counts', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    
    const [todayCount, upcomingCount, completedCount, overdueCount, allCount, byCategory, byPriority] = await Promise.all([
      db.query(`SELECT COUNT(*) c FROM tasks WHERE due_date = $1 AND status != 'overdue'`, [today]),
      db.query(`SELECT COUNT(*) c FROM tasks WHERE due_date > $1 AND status NOT IN ('completed')`, [today]),
      db.query(`SELECT COUNT(*) c FROM tasks WHERE status = 'completed'`),
      db.query(`SELECT COUNT(*) c FROM tasks WHERE status = 'overdue'`),
      db.query(`SELECT COUNT(*) c FROM tasks`),
      db.query(`SELECT category, COUNT(*) c FROM tasks GROUP BY category`),
      db.query(`SELECT priority, COUNT(*) c FROM tasks GROUP BY priority`)
    ]);

    res.json({
      counts: {
        today: parseInt(todayCount.rows[0].c, 10),
        upcoming: parseInt(upcomingCount.rows[0].c, 10),
        completed: parseInt(completedCount.rows[0].c, 10),
        overdue: parseInt(overdueCount.rows[0].c, 10),
        all: parseInt(allCount.rows[0].c, 10),
      },
      byCategory: byCategory.rows,
      byPriority: byPriority.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM tasks WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title, notes = '', category = 'Work', priority = 'Medium', goal_id = null,
      start_time = null, end_time = null, est_minutes = 30, due_date = null,
    } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const dueDate = due_date || new Date().toISOString().slice(0, 10);
    const sortResult = await db.query(`SELECT COALESCE(MAX(sort_order), 0) m FROM tasks`);
    const maxSort = parseInt(sortResult.rows[0].m, 10);

    const { rows } = await db.query(`
      INSERT INTO tasks (title, notes, category, priority, status, goal_id, start_time, end_time, est_minutes, due_date, sort_order)
      VALUES ($1, $2, $3, $4, 'planned', $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [title.trim(), notes, category, priority, goal_id, start_time, end_time, est_minutes, dueDate, maxSort + 1]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const check = await db.query(`SELECT * FROM tasks WHERE id = $1`, [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const existing = check.rows[0];

    const fields = ['title', 'notes', 'category', 'priority', 'status', 'goal_id', 'start_time', 'end_time', 'est_minutes', 'spent_minutes', 'due_date'];
    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${paramIndex++}`);
        params.push(req.body[f]);
      }
    }
    if (req.body.status === 'completed' && existing.status !== 'completed') {
      updates.push(`completed_at = $${paramIndex++}`);
      params.push(new Date().toISOString());
    }
    if (req.body.status && req.body.status !== 'completed') {
      updates.push(`completed_at = NULL`);
    }
    
    if (updates.length === 0) return res.json(existing);

    params.push(req.params.id);
    const { rows } = await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM tasks WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Quick actions
router.post('/:id/complete', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE tasks SET status='completed', completed_at=$1 WHERE id=$2 RETURNING *`, [new Date().toISOString(), req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/reopen', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE tasks SET status='planned', completed_at=NULL WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const { rows } = await db.query(`UPDATE tasks SET status='in_progress' WHERE id=$1 RETURNING *`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/reschedule', async (req, res) => {
  try {
    const { start_time, end_time, due_date } = req.body;
    const check = await db.query(`SELECT * FROM tasks WHERE id=$1`, [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const existing = check.rows[0];

    const { rows } = await db.query(`UPDATE tasks SET start_time=$1, end_time=$2, due_date=$3, status=CASE WHEN status='overdue' THEN 'planned' ELSE status END WHERE id=$4 RETURNING *`, 
      [start_time ?? existing.start_time, end_time ?? existing.end_time, due_date ?? existing.due_date, req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
