import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { rows: todaysTasks } = await db.query(`SELECT * FROM tasks WHERE due_date = $1 ORDER BY start_time ASC`, [today]);
    const completed = todaysTasks.filter(t => t.status === 'completed');
    const { rows: overdue } = await db.query(`SELECT * FROM tasks WHERE status='overdue' ORDER BY id DESC`);

    const completedMinutes = todaysTasks.reduce((sum, t) => sum + (t.spent_minutes || 0), 0);
    const { rows: focusSessionsToday } = await db.query(`SELECT * FROM focus_sessions WHERE date = $1`, [today]);
    const focusSeconds = focusSessionsToday.reduce((sum, s) => {
      if (s.status === 'running') {
        const startedStr = s.started_at instanceof Date ? s.started_at.toISOString() : String(s.started_at);
        const startedAt = new Date(startedStr.replace(' ', 'T').endsWith('Z') ? startedStr : startedStr + 'Z').getTime();
        return sum + s.elapsed_seconds + Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      }
      return sum + s.elapsed_seconds;
    }, 0);

    const topPriorities = todaysTasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const order = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      })
      .slice(0, 4);

    const { rows: activeSessionRows } = await db.query(`SELECT * FROM focus_sessions WHERE date=$1 AND status IN ('running','paused') ORDER BY id DESC LIMIT 1`, [today]);
    const activeSession = activeSessionRows.length > 0 ? activeSessionRows[0] : null;

    const productivityScore = Math.min(100, Math.round(
      (completed.length / Math.max(1, todaysTasks.length)) * 60 +
      Math.min(1, focusSeconds / (4 * 3600)) * 40
    ));

    res.json({
      date: today,
      stats: {
        plannedTasks: todaysTasks.length,
        completedTasks: completed.length,
        upcomingTasks: todaysTasks.filter(t => t.status === 'planned').length,
        completedMinutes,
        focusSeconds,
        focusTargetSeconds: 4 * 3600,
        productivityScore,
      },
      topPriorities,
      overdue,
      activeSession,
      schedule: todaysTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
