import { useEffect, useState } from 'react';
import { api } from '../api/client';

const emptyForm = {
  title: '', notes: '', category: 'Work', priority: 'Medium',
  start_time: '', end_time: '', est_minutes: 30, due_date: '', goal_id: '',
};

export default function TaskModal({ open, onClose, onSaved, goals = [], editingTask = null }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        notes: editingTask.notes || '',
        category: editingTask.category || 'Work',
        priority: editingTask.priority || 'Medium',
        start_time: editingTask.start_time || '',
        end_time: editingTask.end_time || '',
        est_minutes: editingTask.est_minutes || 30,
        due_date: editingTask.due_date || '',
        goal_id: editingTask.goal_id || '',
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editingTask, open]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { setError('Please enter a task title.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, goal_id: form.goal_id || null };
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg p-space-xl">
        <div className="flex items-center justify-between mb-space-lg">
          <h2 className="font-display font-semibold text-headline-sm text-on-surface">
            {editingTask ? 'Edit Task' : 'Quick Task'}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-space-md">
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Task title</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Finalize SAP Integration Mapping"
              className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary">
                {['Work', 'Learning', 'Personal', 'Health'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary">
                {['Urgent', 'High', 'Medium', 'Low'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Start time</label>
              <input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">End time</label>
              <input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Due date</label>
              <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Linked Goal</label>
              <select value={form.goal_id} onChange={(e) => set('goal_id', e.target.value)}
                className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary">
                <option value="">None</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-error font-body-sm text-body-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-space-sm mt-space-xl">
          <button onClick={onClose} className="px-space-md py-space-xs rounded-xl text-on-surface-variant hover:bg-surface-container-low font-label-md">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-space-lg py-space-xs rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-md hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingTask ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
