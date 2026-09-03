import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskModal from './components/TaskModal';
import { api } from './api/client';

import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import FocusTimer from './pages/FocusTimer';
import Performance from './pages/Performance';
import Goals from './pages/Goals';
import Settings from './pages/Settings';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [taskCount, setTaskCount] = useState(0);
  const [focusActive, setFocusActive] = useState(false);
  const [profile, setProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const loadSidebarData = useCallback(async () => {
    try {
      const [counts, goalsData, activeSession, settings] = await Promise.all([
        api.get('/tasks/counts'),
        api.get('/goals'),
        api.get('/focus-sessions/active'),
        api.get('/settings'),
      ]);
      setTaskCount(counts.counts.today);
      setGoals(goalsData);
      setFocusActive(!!activeSession && activeSession.status === 'running');
      setProfile(settings);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadSidebarData(); }, [loadSidebarData, refreshKey]);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar taskCount={taskCount} focusActive={focusActive} profile={profile} />
      <div className="pl-64 lg:pl-72">
        <TopBar onAddTask={() => setModalOpen(true)} />
        <main className="relative pt-16 bg-surface w-full px-space-lg lg:px-space-xl py-space-xl min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard refreshKey={refreshKey} onRefresh={bumpRefresh} onAddTask={() => setModalOpen(true)} />} />
            <Route path="/tasks" element={<MyTasks refreshKey={refreshKey} onRefresh={bumpRefresh} goals={goals} onAddTask={() => setModalOpen(true)} />} />
            <Route path="/calendar" element={<Calendar refreshKey={refreshKey} onRefresh={bumpRefresh} />} />
            <Route path="/focus-timer" element={<FocusTimer refreshKey={refreshKey} onRefresh={bumpRefresh} />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/goals" element={<Goals refreshKey={refreshKey} onRefresh={bumpRefresh} />} />
            <Route path="/settings" element={<Settings onSaved={bumpRefresh} profile={profile} />} />
          </Routes>
        </main>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={bumpRefresh}
        goals={goals}
      />
    </div>
  );
}
