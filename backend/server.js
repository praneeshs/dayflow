import express from 'express';
import cors from 'cors';
import { initSchema } from './db/database.js';

import tasksRouter from './routes/tasks.js';
import focusRouter from './routes/focus.js';
import calendarRouter from './routes/calendar.js';
import goalsRouter from './routes/goals.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import performanceRouter from './routes/performance.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/focus-sessions', focusRouter);
app.use('/api/calendar-events', calendarRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/performance', performanceRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`DayFlow API running on http://localhost:${PORT}`));
}

export default app;
