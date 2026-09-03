import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function fmtSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

const priorityColors = {
  Urgent: 'bg-error-container text-on-error-container',
  High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Medium: 'bg-secondary-container text-on-secondary-container',
  Low: 'bg-surface-container text-on-surface-variant',
};

export default function Dashboard({ refreshKey, onRefresh, onAddTask }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const d = await api.get('/dashboard');
    setData(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [refreshKey]);
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  async function completeTask(id) {
    await api.post(`/tasks/${id}/complete`);
    load();
    onRefresh();
  }

  async function rescheduleOverdue(id) {
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    await api.post(`/tasks/${id}/reschedule`, {
      due_date: now.toISOString().slice(0, 10),
      start_time: `${pad(later.getHours())}:${pad(later.getMinutes())}`,
      end_time: `${pad(later.getHours() + 1)}:${pad(later.getMinutes())}`,
    });
    load();
    onRefresh();
  }

  if (loading || !data) {
    return <div className="text-on-surface-variant font-body-md">Loading your day…</div>;
  }

  const { stats, topPriorities, overdue, schedule } = data;
  const focusPct = Math.min(100, Math.round((stats.focusSeconds / stats.focusTargetSeconds) * 100));

  return (
    <div className="flex flex-col w-full space-y-space-xl max-w-[1400px]">
      {/* Welcome banner */}
      <section className="relative w-full rounded-2xl bg-surface-container-lowest p-space-xl shadow-sm overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col space-y-space-2xs max-w-2xl">
          <div className="inline-flex items-center gap-space-xs text-primary font-label-md">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-semibold uppercase tracking-wider text-label-sm">Live Workspace</span>
          </div>
          <h1 className="font-display font-bold text-display-lg-mobile lg:text-display-lg text-on-surface tracking-tight leading-tight">
            Good morning, Praneesh 👋
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant pt-space-2xs leading-relaxed">
            You have <span className="font-semibold text-on-surface">{stats.plannedTasks} scheduled tasks</span> today. Let's make it a high-leverage day.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-space-sm">
          <button onClick={onAddTask} className="inline-flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md hover:bg-surface-container-highest transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Quick Task</span>
          </button>
          <Link to="/focus-timer" className="relative inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Plan My Day</span>
          </Link>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard label="TODAY'S TASKS" value={stats.plannedTasks} sub={`${stats.completedTasks} completed`} icon="checklist" />
        <StatCard label="COMPLETED TIME" value={fmtMinutes(stats.completedMinutes)} sub="Logged today" icon="schedule" />
        <StatCard label="FOCUS TIME" value={fmtSeconds(stats.focusSeconds)} sub={`${focusPct}% of 4h goal`} icon="timer" ring={focusPct} />
        <StatCard label="PRODUCTIVITY SCORE" value={`${stats.productivityScore}/100`} sub="Today" icon="trending_up" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg">
        <div className="xl:col-span-2 space-y-space-lg">
          {/* Top priorities */}
          <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-display font-semibold text-headline-sm text-on-surface">Top Priorities for Today</h2>
              <Link to="/tasks" className="text-primary font-label-md hover:underline">View all</Link>
            </div>
            <div className="space-y-space-sm">
              {topPriorities.length === 0 && (
                <p className="text-on-surface-variant font-body-md">Nothing urgent right now — nice work.</p>
              )}
              {topPriorities.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-space-sm">
                    <button
                      onClick={() => completeTask(t.id)}
                      className="w-5 h-5 rounded-full border-2 border-outline-variant hover:border-primary flex-shrink-0"
                      title="Mark complete"
                    />
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{t.title}</p>
                      <div className="flex items-center gap-space-xs mt-0.5">
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{t.start_time}–{t.end_time}</span>
                        <span className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${priorityColors[t.priority] || priorityColors.Medium}`}>
                          {t.priority.toUpperCase()}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{t.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Today's schedule */}
          <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-display font-semibold text-headline-sm text-on-surface">Today's Schedule & Timeline</h2>
              <Link to="/calendar" className="text-primary font-label-md hover:underline">Expand Calendar →</Link>
            </div>
            <div className="space-y-space-xs">
              {schedule.map((t) => (
                <div key={t.id} className={`flex items-center justify-between p-space-sm rounded-xl ${t.status === 'in_progress' ? 'bg-primary-fixed/40 border border-primary/30' : t.status === 'completed' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-space-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'completed' ? 'bg-secondary' : t.status === 'in_progress' ? 'bg-primary' : 'bg-outline-variant'}`} />
                    <span className={`font-label-lg text-label-lg text-on-surface ${t.status === 'completed' ? 'line-through' : ''}`}>{t.title}</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{t.start_time} - {t.end_time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-space-lg">
          {overdue.length > 0 && (
            <section className="bg-error-container/40 border border-error/20 rounded-2xl p-space-lg">
              <div className="flex items-center gap-space-xs mb-space-sm text-error font-label-md font-semibold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{overdue.length} Overdue Task{overdue.length > 1 ? 's' : ''}</span>
              </div>
              {overdue.map((t) => (
                <div key={t.id} className="space-y-space-xs">
                  <p className="font-label-lg text-label-lg text-on-surface">{t.title}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t.notes}</p>
                  <div className="flex gap-space-xs pt-space-xs">
                    <button onClick={() => rescheduleOverdue(t.id)} className="px-space-sm py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm">Reschedule</button>
                    <button onClick={() => completeTask(t.id)} className="px-space-sm py-1 rounded-lg bg-error text-on-error font-label-sm">Mark Done</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <h2 className="font-display font-semibold text-headline-sm text-on-surface mb-space-md">Workspace Shortcuts</h2>
            <div className="grid grid-cols-2 gap-space-sm">
              <Link to="/tasks" className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-center">
                <span className="material-symbols-outlined text-[20px] text-primary block mb-1">bolt</span>
                <span className="font-label-sm text-label-sm text-on-surface">Quick Task</span>
              </Link>
              <Link to="/focus-timer" className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-center">
                <span className="material-symbols-outlined text-[20px] text-error block mb-1">timer</span>
                <span className="font-label-sm text-label-sm text-on-surface">Focus Session</span>
              </Link>
              <Link to="/calendar" className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-center">
                <span className="material-symbols-outlined text-[20px] text-secondary block mb-1">calendar_view_week</span>
                <span className="font-label-sm text-label-sm text-on-surface">Week View</span>
              </Link>
              <Link to="/performance" className="p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-center">
                <span className="material-symbols-outlined text-[20px] text-tertiary block mb-1">query_stats</span>
                <span className="font-label-sm text-label-sm text-on-surface">Performance</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      </div>
      <p className="font-display font-bold text-headline-lg text-on-surface">{value}</p>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">{sub}</p>
    </div>
  );
}
