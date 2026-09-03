import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Settings({ onSaved }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get('/settings').then(setForm);
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    await api.patch('/settings', form);
    setDirty(false);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2500);
  }

  if (!form) return <p className="text-on-surface-variant">Loading settings…</p>;

  return (
    <div className="max-w-[1000px] space-y-space-lg pb-24">
      <div>
        <h1 className="font-display font-semibold text-headline-lg text-on-surface">Settings & Preferences</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Tailor your workday boundaries and productivity rituals.</p>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-md">
        <h2 className="font-label-sm text-label-sm text-primary uppercase tracking-wide">Identity</h2>
        <h3 className="font-display font-semibold text-headline-sm text-on-surface">Profile & Personalization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <Field label="Full Name">
            <input value={form.full_name || ''} onChange={(e) => set('full_name', e.target.value)} className="input" />
          </Field>
          <Field label="Job Title / Role">
            <input value={form.job_title || ''} onChange={(e) => set('job_title', e.target.value)} className="input" />
          </Field>
          <Field label="Timezone">
            <input value={form.timezone || ''} onChange={(e) => set('timezone', e.target.value)} className="input" />
          </Field>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-md">
        <h2 className="font-label-sm text-label-sm text-secondary uppercase tracking-wide">Cap & Guardrails</h2>
        <h3 className="font-display font-semibold text-headline-sm text-on-surface">Working Hours & Daily Limits</h3>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-label-md text-label-md text-on-surface-variant">Daily Max Deep Work Limit</label>
            <span className="font-display font-bold text-primary">{form.daily_max_deep_work}.0 Hours/day</span>
          </div>
          <input type="range" min="4" max="11" step="0.5" value={form.daily_max_deep_work}
            onChange={(e) => set('daily_max_deep_work', e.target.value)} className="w-full accent-primary" />
        </div>
        <div className="grid grid-cols-2 gap-space-md">
          <Field label="Core Work Start">
            <input type="time" value={form.core_work_start || ''} onChange={(e) => set('core_work_start', e.target.value)} className="input" />
          </Field>
          <Field label="Core Work End">
            <input type="time" value={form.core_work_end || ''} onChange={(e) => set('core_work_end', e.target.value)} className="input" />
          </Field>
        </div>
        <ToggleRow
          label="Evening Hard-Stop"
          desc="Automatically silence workspace notifications and deflect late syncs."
          checked={form.evening_hard_stop === '1'}
          onChange={(v) => set('evening_hard_stop', v ? '1' : '0')}
        />
      </section>

      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-md">
        <h2 className="font-label-sm text-label-sm text-tertiary uppercase tracking-wide">Flow Structure</h2>
        <h3 className="font-display font-semibold text-headline-sm text-on-surface">Default Task & Focus Cadence</h3>
        <div className="grid grid-cols-2 gap-space-md">
          <Field label="Default Task Duration (min)">
            <input type="number" value={form.default_task_duration || ''} onChange={(e) => set('default_task_duration', e.target.value)} className="input" />
          </Field>
          <Field label="Meeting Transition Buffer (min)">
            <input type="number" value={form.meeting_buffer || ''} onChange={(e) => set('meeting_buffer', e.target.value)} className="input" />
          </Field>
        </div>
        <div>
          <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Focus Technique Protocol</label>
          <div className="grid grid-cols-3 gap-space-sm">
            {[
              { key: 'pomodoro', label: 'Classic Pomodoro', sub: '25m Flow / 5m Rest' },
              { key: 'flowmodoro', label: 'Flowmodoro', sub: '45m Deep / 10m Break' },
              { key: 'ultradian', label: 'Ultradian Cycle', sub: '90m Focus / 20m Rest' },
            ].map((opt) => (
              <button key={opt.key} onClick={() => set('focus_protocol', opt.key)}
                className={`p-space-sm rounded-xl border text-left ${form.focus_protocol === opt.key ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant bg-surface'}`}>
                <p className="font-label-md text-label-md text-on-surface">{opt.label}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-sm">
        <h2 className="font-label-sm text-label-sm text-secondary uppercase tracking-wide">Health Protocols</h2>
        <h3 className="font-display font-semibold text-headline-sm text-on-surface mb-space-xs">Break & Wellness Reminders</h3>
        <ToggleRow label="Hydration Nudges" desc="Gentle reminder to drink water every 60 minutes." checked={form.hydration_nudges === '1'} onChange={(v) => set('hydration_nudges', v ? '1' : '0')} />
        <ToggleRow label="20-20-20 Eye Relief" desc="Look at 20ft distance for 20 seconds every 45 minutes." checked={form.eye_relief === '1'} onChange={(v) => set('eye_relief', v ? '1' : '0')} />
        <ToggleRow label="Lunch Hour Sacred Lock" desc="Auto-locked from incoming calendar invites." checked={form.lunch_lock === '1'} onChange={(v) => set('lunch_lock', v ? '1' : '0')} />
      </section>

      <section className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-space-sm">
        <h2 className="font-label-sm text-label-sm text-primary uppercase tracking-wide">Appearance</h2>
        <h3 className="font-display font-semibold text-headline-sm text-on-surface mb-space-xs">Theme & Display</h3>
        <div className="flex gap-space-sm">
          {['light', 'dark', 'system'].map((t) => (
            <button key={t} onClick={() => set('theme', t)}
              className={`px-space-lg py-space-sm rounded-xl border capitalize ${form.theme === t ? 'border-primary bg-primary-fixed/30 text-primary' : 'border-outline-variant text-on-surface-variant'}`}>
              {t}
            </button>
          ))}
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Dark mode preference is saved; full theming can be wired up next.</p>
      </section>

      {(dirty || saved) && (
        <div className="fixed bottom-0 left-64 lg:left-72 right-0 bg-inverse-surface text-inverse-on-surface px-space-xl py-space-md flex items-center justify-between z-30">
          <span className="font-label-md text-label-md">{saved ? 'Preferences saved.' : 'You have unsaved changes.'}</span>
          {!saved && (
            <button onClick={save} className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary font-label-md font-semibold">
              <span className="material-symbols-outlined text-[18px]">check</span> Save Preferences
            </button>
          )}
        </div>
      )}

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; background: #faf8ff; border-radius: 0.75rem; border: 1px solid #c3c6d7; color: #131b2e; } .input:focus { outline: none; border-color: #004ac6; }`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low">
      <div>
        <p className="font-label-md text-label-md text-on-surface">{label}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${checked ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'}`}
      >
        <span className="w-5 h-5 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
