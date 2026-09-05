import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

async function withProgress(goal) {
  const { rows: milestones } = await db.query(`SELECT * FROM milestones WHERE goal_id = $1 ORDER BY sort_order ASC`, [goal.id]);
  const { rows: linkedTasks } = await db.query(`SELECT id, title, status FROM tasks WHERE goal_id = $1 ORDER BY id DESC`, [goal.id]);
  
  const doneMilestones = milestones.filter(m => m.done).length;
  const doneTasks = linkedTasks.filter(t => t.status === 'completed').length;
  
  const totalItems = milestones.length + linkedTasks.length;
  const totalDone = doneMilestones + doneTasks;
  const progress = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return { ...goal, milestones, progress, milestones_done: doneMilestones, milestones_total: milestones.length, linked_tasks: linkedTasks };
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT * FROM goals`;
    const params = [];
    if (status && status !== 'all') { sql += ` WHERE status = $1`; params.push(status); }
    sql += ` ORDER BY id ASC`;
    const { rows: goals } = await db.query(sql, params);
    
    const goalsWithProgress = await Promise.all(goals.map(withProgress));
    res.json(goalsWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(await withProgress(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, category = 'Work', color = 'primary', due_date = null } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const { rows } = await db.query(`INSERT INTO goals (title, category, color, due_date, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [title, category, color, due_date]);
    res.status(201).json(await withProgress(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { rows: existingRows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.id]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const fields = ['title', 'category', 'color', 'due_date', 'status'];
    const updates = []; const params = [];
    let paramIndex = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f}=$${paramIndex++}`);
        params.push(req.body[f]);
      }
    }
    
    if (updates.length) {
      params.push(req.params.id);
      await db.query(`UPDATE goals SET ${updates.join(', ')} WHERE id=$${paramIndex}`, params);
    }
    const { rows: updatedRows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.id]);
    res.json(await withProgress(updatedRows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM goals WHERE id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Milestones
router.post('/:id/milestones', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const maxSortResult = await db.query(`SELECT COALESCE(MAX(sort_order), -1) m FROM milestones WHERE goal_id=$1`, [req.params.id]);
    const maxSort = parseInt(maxSortResult.rows[0].m, 10);
    
    await db.query(`INSERT INTO milestones (goal_id, title, done, is_current, sort_order) VALUES ($1, $2, 0, 0, $3)`,
      [req.params.id, title, maxSort + 1]);
      
    const { rows: goalRows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.id]);
    res.status(201).json(await withProgress(goalRows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:goalId/milestones/:mid', async (req, res) => {
  try {
    const { done, is_current, title } = req.body;
    const updates = []; const params = [];
    let paramIndex = 1;
    if (done !== undefined) { updates.push(`done=$${paramIndex++}`); params.push(done ? 1 : 0); }
    if (is_current !== undefined) { updates.push(`is_current=$${paramIndex++}`); params.push(is_current ? 1 : 0); }
    if (title !== undefined) { updates.push(`title=$${paramIndex++}`); params.push(title); }
    if (updates.length) {
      params.push(req.params.mid);
      await db.query(`UPDATE milestones SET ${updates.join(', ')} WHERE id=$${paramIndex}`, params);
    }
    
    const { rows: goalRows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.goalId]);
    res.json(await withProgress(goalRows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:goalId/milestones/:mid', async (req, res) => {
  try {
    await db.query(`DELETE FROM milestones WHERE id=$1`, [req.params.mid]);
    const { rows: goalRows } = await db.query(`SELECT * FROM goals WHERE id=$1`, [req.params.goalId]);
    res.json(await withProgress(goalRows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
