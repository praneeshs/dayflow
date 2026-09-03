import { useEffect, useState } from 'react';
import { api } from '../api/client';
import TaskModal from '../components/TaskModal';

const priorityColors = {
  Urgent: 'bg-error-container text-on-error-container',
  High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Medium: 'bg-secondary-container text-on-secondary-container',
  Low: 'bg-surface-container text-on-surface-variant',
};

const filters = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'all', label: 'All Tasks' },
];

export default function MyTasks({ refreshKey, onRefresh, goals, onAddTask }) {
  const [filter, setFilter] = useState('today');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ filter, category, priority });
    const [taskData, countData] = await Promise.all([
      api.get(`/tasks?${params.toString()}`),
      api.get('/tasks/counts'),
    ]);
    setTasks(taskData);
    setCounts(countData);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, category, priority, refreshKey]);

  async function toggleComplete(task) {
    if (task.status === 'completed') {
      await api.post(`/tasks/${task.id}/reopen`);
    } else {
      await api.post(`/tasks/${task.id}/complete`);
    }
    load();
    onRefresh();
  }

  async function startTask(id) {
    await api.post(`/tasks/${id}/start`);
    load();
    onRefresh();
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await api.del(`/tasks/${id}`);
    load();
    onRefresh();
  }

  function editTask(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  const categoryCounts = {};
  (counts?.byCategory || []).forEach((c) => { categoryCounts[c.category] = c.c; });
  const priorityCounts = {};
  (counts?.byPriority || []).forEach((c) => { priorityCounts[c.priority] = c.c; });

  return (
    <div className="max-w-[1200px] space-y-space-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-headline-lg text-on-surface">My Tasks</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your daily execution, categorize workflows, and prioritize what matters.</p>
        </div>
        <button onClick={onAddTask} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-space-xs bg-surface-container-lowest rounded-2xl p-space-xs shadow-sm">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-space-md py-space-xs rounded-xl font-label-md text-label-md transition-all ${
              filter === f.key ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {f.label} {counts ? `(${counts.counts[f.key]})` : ''}
          </button>
        ))}
      </div>

      {/* Category / priority filters */}
      <div className="flex flex-wrap items-center gap-space-md bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="font-label-md text-label-md text-on-surface-variant mr-1">Category:</span>
          {['All', 'Work', 'Learning', 'Personal', 'Health'].map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm ${category === c ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container text-on-surface-variant'}`}>
              {c}{c !== 'All' && categoryCounts[c] ? ` (${categoryCounts[c]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="font-label-md text-label-md text-on-surface-variant mr-1">Priority:</span>
          {['All', 'Urgent', 'High', 'Medium', 'Low'].map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={`px-space-sm py-1 rounded-full font-label-sm text-label-sm ${priority === p ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container text-on-surface-variant'}`}>
              {p}{p !== 'All' && priorityCounts[p] ? ` (${priorityCounts[p]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-space-sm">
        {loading && <p className="text-on-surface-variant font-body-md">Loading tasks…</p>}
        {!loading && tasks.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl text-center text-on-surface-variant">
            No tasks here. Add one to get started.
          </div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-md ${t.status === 'completed' ? 'opacity-60' : ''} ${t.status === 'overdue' ? 'border border-error/30' : ''}`}>
            <div className="flex items-start gap-space-sm flex-1 min-w-0">
              <button
                onClick={() => toggleComplete(t)}
                className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${t.status === 'completed' ? 'bg-secondary border-secondary' : 'border-outline-variant hover:border-primary'}`}
              >
                {t.status === 'completed' && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
              </button>
              <div className="min-w-0">
                <p className={`font-label-lg text-label-lg text-on-surface truncate ${t.status === 'completed' ? 'line-through' : ''}`}>{t.title}</p>
                {t.notes && <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{t.notes}</p>}
                <div className="flex items-center gap-space-xs mt-space-xs flex-wrap">
                  <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{t.category}</span>
                  <span className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm ${priorityColors[t.priority] || priorityColors.Medium}`}>{t.priority}</span>
                  {t.goal_title && <span className="font-label-sm text-label-sm text-primary">🎯 {t.goal_title}</span>}
                  {t.start_time && <span className="font-body-sm text-body-sm text-on-surface-variant">⏱ {t.start_time}–{t.end_time}</span>}
                  {t.status === 'overdue' && <span className="px-space-xs py-0.5 rounded-full bg-error text-on-error font-label-sm text-label-sm">OVERDUE</span>}
                  {t.status === 'in_progress' && <span className="px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm">In Progress</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-xs flex-shrink-0">
              {t.status === 'planned' && (
                <button onClick={() => startTask(t.id)} className="px-space-sm py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm">Start</button>
              )}
              <button onClick={() => editTask(t)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button onClick={() => deleteTask(t.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSaved={() => { load(); onRefresh(); }}
        goals={goals}
        editingTask={editingTask}
      />
    </div>
  );
}
