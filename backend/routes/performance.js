import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

router.get('/', async (req, res) => {
  try {
    const days = lastNDays(7);
    const placeholders = days.map((_, i) => `$${i + 1}`).join(',');

    const { rows: completedTasks } = await db.query(
      `SELECT * FROM tasks WHERE status='completed' AND due_date IN (${placeholders})`, days
    );

    const { rows: sessions } = await db.query(
      `SELECT * FROM focus_sessions WHERE date IN (${placeholders})`, days
    );

    const totalFocusSeconds = sessions.reduce((sum, s) => sum + s.elapsed_seconds, 0);

    const dailyVelocity = days.map(d => {
      const dayTasks = completedTasks.filter(t => t.due_date === d).length;
      const dayFocusMin = sessions.filter(s => s.date === d).reduce((sum, s) => sum + s.elapsed_seconds, 0) / 60;
      return { date: d, tasksCompleted: dayTasks, focusMinutes: Math.round(dayFocusMin) };
    });

    const { rows: byCategory } = await db.query(`
      SELECT category, COALESCE(SUM(spent_minutes),0) as minutes
      FROM tasks WHERE due_date IN (${placeholders})
      GROUP BY category
    `, days);

    const { rows: allTasksInRange } = await db.query(`SELECT * FROM tasks WHERE due_date IN (${placeholders})`, days);
    const onTime = allTasksInRange.filter(t => t.status === 'completed').length;
    const total = allTasksInRange.length;

    res.json({
      range: { from: days[0], to: days[days.length - 1] },
      summary: {
        tasksCompleted: completedTasks.length,
        totalFocusHours: +(totalFocusSeconds / 3600).toFixed(1),
        onTimeRate: total ? Math.round((onTime / total) * 100) : 0,
        avgFocusPerDay: +(totalFocusSeconds / 3600 / 7).toFixed(1),
      },
      dailyVelocity,
      timeAllocation: byCategory.map(r => ({ category: r.category, minutes: parseInt(r.minutes, 10) })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
