import { useEffect, useState } from 'react';
import { api } from '../api/client';

const categoryColor = {
  Work: 'bg-primary-fixed border-primary/30 text-on-primary-fixed-variant',
  Personal: 'bg-secondary-container border-secondary/20 text-on-secondary-container',
  Learning: 'bg-tertiary-fixed border-tertiary/20 text-on-tertiary-fixed-variant',
  Health: 'bg-secondary-container border-secondary/20 text-on-secondary-container',
};

const hours = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00 - 20:00

function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Work', start_time: '09:00', end_time: '10:00' });
  const today = new Date().toISOString().slice(0, 10);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get(`/calendar-events?date=${today}`);
      setEvents(data || []);
    } catch (e) {
      console.error(e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleDone(ev) {
    await api.patch(`/calendar-events/${ev.id}`, { done: ev.done ? 0 : 1 });
    load();
  }

  async function deleteEvent(id) {
    if (!confirm('Remove this time block?')) return;
    await api.del(`/calendar-events/${id}`);
    load();
  }

  async function addEvent() {
    if (!form.title.trim()) return;
    await api.post('/calendar-events', { ...form, event_date: today });
    setForm({ title: '', description: '', category: 'Work', start_time: '09:00', end_time: '10:00' });
    setShowForm(false);
    load();
  }

  const startHour = hours[0] * 60;
  const totalMinutesRange = (hours[hours.length - 1] + 1 - hours[0]) * 60;

  return (
    <div className="max-w-[1200px] space-y-space-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-headline-lg text-on-surface">Calendar & Time Blocking</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Intelligent time allocation to protect focus, learning, and life balance.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Time Block
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <input placeholder="Block title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary">
              {['Work', 'Personal', 'Learning', 'Health'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-space-sm">
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant focus:outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-space-xs">
            <button onClick={() => setShowForm(false)} className="px-space-md py-space-xs rounded-xl text-on-surface-variant">Cancel</button>
            <button onClick={addEvent} className="px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-semibold">Save Block</button>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
        <h2 className="font-display font-semibold text-headline-sm text-on-surface mb-space-md">Timeline Master — Today</h2>
        {loading && <p className="text-on-surface-variant">Loading…</p>}
        <div className="relative flex" style={{ minHeight: hours.length * 64 }}>
          <div className="w-16 flex-shrink-0">
            {hours.map((h) => (
              <div key={h} className="h-16 text-right pr-space-sm font-body-sm text-body-sm text-on-surface-variant -mt-2">
                {h % 12 === 0 ? 12 : h % 12}:00 {h < 12 ? 'AM' : 'PM'}
              </div>
            ))}
          </div>
          <div className="relative flex-1 border-l border-outline-variant/40">
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-outline-variant/20" style={{ top: i * 64 }} />
            ))}
            {today && nowMinutes >= startHour && nowMinutes <= startHour + totalMinutesRange && (
              <div className="absolute left-0 right-0 border-t-2 border-error z-20" style={{ top: ((nowMinutes - startHour) / 60) * 64 }}>
                <span className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-error" />
              </div>
            )}
            {events.map((ev) => {
              const top = ((toMinutes(ev.start_time) - startHour) / 60) * 64;
              const height = Math.max(28, ((toMinutes(ev.end_time) - toMinutes(ev.start_time)) / 60) * 64);
              return (
                <div
                  key={ev.id}
                  className={`absolute left-2 right-2 rounded-xl border px-space-sm py-space-xs overflow-hidden ${categoryColor[ev.category] || categoryColor.Work} ${ev.done ? 'opacity-50' : ''}`}
                  style={{ top, height }}
                >
                  <div className="flex items-center justify-between gap-space-xs">
                    <p className={`font-label-md text-label-md truncate ${ev.done ? 'line-through' : ''}`}>{ev.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleDone(ev)} title="Toggle done">
                        <span className="material-symbols-outlined text-[16px]">{ev.done ? 'undo' : 'check'}</span>
                      </button>
                      <button onClick={() => deleteEvent(ev.id)} title="Delete">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                  {height > 40 && <p className="font-body-sm text-body-sm opacity-80 truncate">{ev.description}</p>}
                  <p className="font-label-sm text-label-sm opacity-70">{ev.start_time} – {ev.end_time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
