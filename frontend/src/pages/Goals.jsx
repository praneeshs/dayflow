import { useEffect, useState } from 'react';
import { api } from '../api/client';

const colorMap = {
  primary: { bar: 'bg-primary', border: 'border-primary', text: 'text-primary' },
  secondary: { bar: 'bg-secondary', border: 'border-secondary', text: 'text-secondary' },
  tertiary: { bar: 'bg-tertiary', border: 'border-tertiary', text: 'text-tertiary' },
};

export default function Goals({ refreshKey, onRefresh }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Work • Strategic', color: 'primary', due_date: '' });
  const [newMilestone, setNewMilestone] = useState({});

  async function load() {
    setLoading(true);
    const data = await api.get('/goals');
    setGoals(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [refreshKey]);

  async function addGoal() {
    if (!form.title.trim()) return;
    await api.post('/goals', form);
    setForm({ title: '', category: 'Work • Strategic', color: 'primary', due_date: '' });
    setShowForm(false);
    load();
    onRefresh();
  }

  async function toggleMilestone(goalId, m) {
    await api.patch(`/goals/${goalId}/milestones/${m.id}`, { done: !m.done });
    load();
    onRefresh();
  }

  async function addMilestone(goalId) {
    const title = newMilestone[goalId];
    if (!title || !title.trim()) return;
    await api.post(`/goals/${goalId}/milestones`, { title });
    setNewMilestone((s) => ({ ...s, [goalId]: '' }));
    load();
  }

  async function deleteGoal(id) {
    if (!confirm('Delete this goal and all its milestones?')) return;
    await api.del(`/goals/${id}`);
    load();
    onRefresh();
  }

  const overallPct = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="max-w-[1200px] space-y-space-lg">
      <div className="flex items-center justify-between flex-wrap gap-space-sm">
        <div>
          <h1 className="font-display font-semibold text-headline-lg text-on-surface">Goals & OKRs</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Connect daily task execution directly to long-term strategic outcomes.</p>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="bg-surface-container-lowest rounded-xl px-space-md py-space-xs shadow-sm">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Overall Completion</p>
            <p className="font-display font-bold text-headline-sm text-primary">{overallPct}%</p>
          </div>
          <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-sm h-fit">
            <span className="material-symbols-outlined text-[18px]">add</span> Add Goal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-sm">
          <input placeholder="Goal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <input placeholder="Category (e.g. Work • Strategic)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
            <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary">
              <option value="primary">Blue</option>
              <option value="secondary">Green</option>
              <option value="tertiary">Amber</option>
            </select>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-space-xs">
            <button onClick={() => setShowForm(false)} className="px-space-md py-space-xs rounded-xl text-on-surface-variant">Cancel</button>
            <button onClick={addGoal} className="px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-semibold">Save Goal</button>
          </div>
        </div>
      )}

      {loading && <p className="text-on-surface-variant">Loading goals…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {goals.map((g) => {
          const colors = colorMap[g.color] || colorMap.primary;
          return (
            <div key={g.id} className={`bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border-l-4 ${colors.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">{g.category}</span>
                  {g.due_date && <span className="ml-space-xs font-label-sm text-label-sm text-on-surface-variant">· due {g.due_date}</span>}
                </div>
                <button onClick={() => deleteGoal(g.id)} className="text-on-surface-variant hover:text-error">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="flex items-center justify-between mt-space-2xs">
                <h3 className="font-display font-semibold text-headline-sm text-on-surface">{g.title}</h3>
                <span className={`font-display font-bold text-headline-sm ${colors.text}`}>{g.progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden my-space-sm">
                <div className={`h-full ${colors.bar} rounded-full transition-all`} style={{ width: `${g.progress}%` }} />
              </div>

              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-space-xs">
                Key Milestones ({g.milestones_done} of {g.milestones_total} ready)
              </p>
              <div className="space-y-space-2xs mb-space-sm">
                {g.milestones.map((m) => (
                  <label key={m.id} className="flex items-center gap-space-xs p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer">
                    <input type="checkbox" checked={!!m.done} onChange={() => toggleMilestone(g.id, m)}
                      className="w-4 h-4 rounded accent-primary" />
                    <span className={`font-body-md text-body-md flex-1 ${m.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{m.title}</span>
                    {m.is_current === 1 && !m.done && <span className="px-space-xs py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm">Current</span>}
                  </label>
                ))}
              </div>

              {g.linked_tasks?.length > 0 && (
                <div className="mb-space-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Linked Tasks</p>
                  <div className="flex flex-wrap gap-space-xs">
                    {g.linked_tasks.slice(0, 4).map((t) => (
                      <span key={t.id} className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{t.title}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-space-xs pt-space-xs border-t border-outline-variant/30">
                <input
                  placeholder="Add milestone…"
                  value={newMilestone[g.id] || ''}
                  onChange={(e) => setNewMilestone((s) => ({ ...s, [g.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addMilestone(g.id)}
                  className="flex-1 px-space-sm py-1 bg-surface rounded-lg border border-outline-variant text-body-sm focus:outline-none focus:border-primary"
                />
                <button onClick={() => addMilestone(g.id)} className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm ${colors.text}`}>+ Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
