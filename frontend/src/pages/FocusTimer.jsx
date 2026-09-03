import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer({ refreshKey, onRefresh }) {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [label, setLabel] = useState('Deep Work Session');
  const [duration, setDuration] = useState(45);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const tickRef = useRef(null);

  async function loadAll() {
    const [active, taskList, sessions] = await Promise.all([
      api.get('/focus-sessions/active'),
      api.get('/tasks?filter=today'),
      api.get('/focus-sessions/today'),
    ]);
    setSession(active);
    setTasks(taskList.filter((t) => t.status !== 'completed'));
    setTodaySessions(sessions);
    if (active) setDisplayElapsed(active.live_elapsed_seconds);
  }

  useEffect(() => { loadAll(); }, [refreshKey]);

  // Local ticking for smooth countdown; resync with server periodically
  useEffect(() => {
    clearInterval(tickRef.current);
    if (session && session.status === 'running') {
      tickRef.current = setInterval(() => {
        setDisplayElapsed((e) => e + 1);
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [session]);

  // Resync with server every 10s to correct drift
  useEffect(() => {
    const t = setInterval(async () => {
      if (session && session.status === 'running') {
        const active = await api.get('/focus-sessions/active');
        if (active) { setSession(active); setDisplayElapsed(active.live_elapsed_seconds); }
      }
    }, 10000);
    return () => clearInterval(t);
  }, [session]);

  async function startSession() {
    const s = await api.post('/focus-sessions/start', {
      task_id: selectedTaskId || null,
      label: selectedTaskId ? tasks.find((t) => t.id === Number(selectedTaskId))?.title : label,
      duration_minutes: Number(duration),
    });
    setSession(s);
    setDisplayElapsed(0);
    loadAll();
    onRefresh();
  }

  async function pause() {
    const s = await api.post(`/focus-sessions/${session.id}/pause`);
    setSession(s);
    setDisplayElapsed(s.live_elapsed_seconds);
    onRefresh();
  }

  async function resume() {
    const s = await api.post(`/focus-sessions/${session.id}/resume`);
    setSession(s);
    onRefresh();
  }

  async function extend(mins) {
    const s = await api.post(`/focus-sessions/${session.id}/extend`, { minutes: mins });
    setSession(s);
  }

  async function complete() {
    await api.post(`/focus-sessions/${session.id}/complete`);
    setSession(null);
    setDisplayElapsed(0);
    loadAll();
    onRefresh();
  }

  async function endLog() {
    await api.post(`/focus-sessions/${session.id}/end`);
    setSession(null);
    setDisplayElapsed(0);
    loadAll();
    onRefresh();
  }

  const totalSeconds = session ? session.duration_minutes * 60 : duration * 60;
  const remaining = Math.max(0, totalSeconds - displayElapsed);
  const pct = session ? Math.min(100, Math.round((displayElapsed / totalSeconds) * 100)) : 0;
  const circumference = 2 * Math.PI * 90;
  const dashoffset = circumference - (pct / 100) * circumference;

  const todayFocusSeconds = todaySessions.reduce((sum, s) => sum + (s.status === 'running' ? displayElapsed : s.elapsed_seconds), 0);
  const completedSessions = todaySessions.filter((s) => s.status === 'completed');

  useEffect(() => {
    if (session && session.status === 'running' && remaining === 0) {
      complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  return (
    <div className="max-w-[1200px] space-y-space-lg">
      <div>
        <h1 className="font-display font-semibold text-headline-lg text-on-surface">Focus Sanctuary</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Real working timer — pauses and progress persist on the server.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-space-lg">
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-2xl p-space-xl shadow-sm flex flex-col items-center">
          {!session && (
            <div className="w-full max-w-md space-y-space-md mb-space-lg">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Attach to a task (optional)</label>
                <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary">
                  <option value="">No task — freeform session</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              {!selectedTaskId && (
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Session label</label>
                  <input value={label} onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-space-sm py-space-xs bg-surface rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:border-primary" />
                </div>
              )}
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Duration (minutes)</label>
                <div className="flex gap-space-xs">
                  {[25, 45, 60, 90].map((d) => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`px-space-md py-space-xs rounded-xl font-label-md ${duration === d ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {session && (
            <div className="mb-space-md text-center">
              <span className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm mb-space-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> CURRENT FOCUS SESSION
              </span>
              <h2 className="font-display font-semibold text-headline-md text-on-surface">{session.label}</h2>
            </div>
          )}

          <div className="relative w-72 h-72 flex items-center justify-center my-space-lg">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e7ff" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="90" fill="none" stroke="url(#grad)" strokeWidth="12"
                strokeDasharray={circumference} strokeDashoffset={session ? dashoffset : circumference}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <p className="font-display font-bold text-5xl text-on-surface">{fmt(session ? remaining : duration * 60)}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant tracking-wider mt-1">
                {session ? `${session.duration_minutes} MIN BLOCK` : 'READY TO START'}
              </p>
              {session && (
                <span className="inline-block mt-space-xs px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                  {pct}% complete
                </span>
              )}
            </div>
          </div>

          {!session && (
            <button onClick={startSession} className="px-space-xl py-space-sm rounded-xl bg-primary text-on-primary font-label-lg font-semibold shadow-md hover:opacity-95 active:scale-[0.98] flex items-center gap-space-xs">
              <span className="material-symbols-outlined">play_arrow</span> Start Focus Session
            </button>
          )}

          {session && (
            <div className="flex flex-col items-center gap-space-sm w-full">
              <div className="flex gap-space-sm">
                {session.status === 'running' ? (
                  <button onClick={pause} className="px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg font-semibold flex items-center gap-space-xs">
                    <span className="material-symbols-outlined">pause</span> Pause Focus
                  </button>
                ) : (
                  <button onClick={resume} className="px-space-lg py-space-sm rounded-xl bg-primary text-on-primary font-label-lg font-semibold flex items-center gap-space-xs">
                    <span className="material-symbols-outlined">play_arrow</span> Resume
                  </button>
                )}
                <button onClick={complete} className="px-space-lg py-space-sm rounded-xl bg-secondary-container text-on-secondary-container font-label-lg font-semibold flex items-center gap-space-xs">
                  <span className="material-symbols-outlined">check_circle</span> Complete
                </button>
                <button onClick={endLog} className="px-space-lg py-space-sm rounded-xl bg-surface-container text-on-surface-variant font-label-lg font-semibold flex items-center gap-space-xs">
                  <span className="material-symbols-outlined">stop_circle</span> End & Log
                </button>
              </div>
              <div className="flex items-center gap-space-sm text-label-sm">
                <span className="text-on-surface-variant font-label-md">Quick extend:</span>
                <button onClick={() => extend(5)} className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant">+5 Min</button>
                <button onClick={() => extend(15)} className="px-space-sm py-1 rounded-lg bg-surface-container text-on-surface-variant">+15 Min</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-space-lg">
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <div className="flex items-center justify-between mb-space-sm">
              <h3 className="font-label-lg text-label-lg text-on-surface">Daily Focus Meter</h3>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                {Math.round((todayFocusSeconds / (4 * 3600)) * 100)}% Today
              </span>
            </div>
            <p className="font-display font-bold text-headline-lg text-on-surface">
              {Math.floor(todayFocusSeconds / 3600)}h {Math.floor((todayFocusSeconds % 3600) / 60)}m
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">Target: 4h 00m</p>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (todayFocusSeconds / (4 * 3600)) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
            <h3 className="font-label-lg text-label-lg text-on-surface mb-space-sm">Today's Focus Log</h3>
            <div className="space-y-space-xs">
              {todaySessions.length === 0 && <p className="font-body-sm text-body-sm text-on-surface-variant">No sessions yet today.</p>}
              {todaySessions.slice().reverse().map((s) => (
                <div key={s.id} className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-space-xs">
                    <span className={`w-2 h-2 rounded-full ${s.status === 'completed' ? 'bg-secondary' : s.status === 'running' ? 'bg-primary animate-pulse' : 'bg-outline-variant'}`} />
                    <span className="font-label-md text-label-md text-on-surface">{s.label}</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {Math.floor((s.status === 'running' ? displayElapsed : s.elapsed_seconds) / 60)}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
