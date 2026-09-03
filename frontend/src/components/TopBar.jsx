export default function TopBar({ onAddTask, title }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="fixed top-0 left-64 lg:left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.03)] px-space-xl flex items-center justify-between">
      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">event_available</span>
          <span>Today, {dateStr}</span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span>Work Mode: Deep Focus</span>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:opacity-95 transition-opacity active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Task</span>
        </button>
      </div>
    </header>
  );
}
