import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api/client';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Performance() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/performance').then(setData);
  }, []);

  if (!data) return <p className="text-on-surface-variant">Crunching your numbers…</p>;

  const { summary, dailyVelocity, timeAllocation } = data;
  const chartData = dailyVelocity.map((d) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    tasks: d.tasksCompleted,
    focusMin: d.focusMinutes,
  }));

  return (
    <div className="max-w-[1200px] space-y-space-lg">
      <div>
        <h1 className="font-display font-semibold text-headline-lg text-on-surface">Performance & Productivity Analytics</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Objective telemetry on your focus habits, task velocity, and cognitive recovery — last 7 days.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
        <MetricCard label="TASKS COMPLETED" value={summary.tasksCompleted} icon="task_alt" />
        <MetricCard label="TOTAL FOCUS HOURS" value={`${summary.totalFocusHours}h`} icon="bolt" />
        <MetricCard label="ON-TIME RATE" value={`${summary.onTimeRate}%`} icon="verified" />
        <MetricCard label="AVG FOCUS / DAY" value={`${summary.avgFocusPerDay}h`} icon="schedule" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <h2 className="font-display font-semibold text-headline-sm text-on-surface mb-space-xs">Daily Velocity & Focus Curve</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Tasks finalized vs actual deep focus minutes per day</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7ff" />
              <XAxis dataKey="day" stroke="#434655" fontSize={12} />
              <YAxis stroke="#434655" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e7ff' }} />
              <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tasks Completed" />
              <Line type="monotone" dataKey="focusMin" stroke="#2563eb" strokeWidth={2} name="Focus Minutes" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
          <h2 className="font-display font-semibold text-headline-sm text-on-surface mb-space-md">Time Allocation</h2>
          {timeAllocation.length === 0 || timeAllocation.every(t => t.minutes === 0) ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No time logged yet — complete a focus session to see this fill in.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={timeAllocation} dataKey="minutes" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {timeAllocation.map((entry, i) => (
                    <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-space-2xs mt-space-sm">
            {timeAllocation.map((t, i) => (
              <div key={t.category} className="flex items-center justify-between font-body-sm text-body-sm">
                <span className="flex items-center gap-space-xs text-on-surface-variant">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {t.category}
                </span>
                <span className="text-on-surface font-medium">{t.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm">
        <h2 className="font-display font-semibold text-headline-sm text-on-surface mb-space-md">Tasks Completed by Day</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e7ff" />
            <XAxis dataKey="day" stroke="#434655" fontSize={12} />
            <YAxis stroke="#434655" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e7ff' }} />
            <Bar dataKey="tasks" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm">
      <div className="flex items-center justify-between mb-space-xs">
        <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider">{label}</span>
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      </div>
      <p className="font-display font-bold text-headline-lg text-on-surface">{value}</p>
    </div>
  );
}
