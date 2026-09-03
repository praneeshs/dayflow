import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'space_dashboard' },
  { path: '/tasks', label: 'My Tasks', icon: 'check_circle' },
  { path: '/calendar', label: 'Calendar', icon: 'calendar_today' },
  { path: '/focus-timer', label: 'Focus Timer', icon: 'timer' },
  { path: '/performance', label: 'Performance', icon: 'insights' },
  { path: '/goals', label: 'Goals', icon: 'flag' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar({ taskCount, focusActive, profile }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 lg:w-72 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col">
        <div className="h-16 px-space-lg flex items-center gap-space-sm">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-display font-bold text-lg">D</div>
          <div className="flex flex-col">
            <span className="font-display font-semibold text-headline-sm text-on-surface tracking-tight leading-none">DayFlow</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Personal Assistant</span>
          </div>
        </div>
        <nav className="px-space-md py-space-sm space-y-space-2xs flex flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-space-md py-space-sm transition-all rounded-xl font-label-lg text-label-lg ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.path === '/tasks' && taskCount > 0 && (
                <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                  {taskCount}
                </span>
              )}
              {item.path === '/focus-timer' && focusActive && (
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="px-space-md py-space-md space-y-space-md">
        <div className="flex items-center justify-between pt-space-xs">
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-semibold text-sm">
                {(profile?.full_name || 'P')[0]}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{profile?.full_name || 'Praneesh'}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{profile?.job_title || 'Product & Tech'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
