import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Toast from './components/Toast';
import { initTheme, applyTheme } from './utils/theme';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import RegisterEvent from './pages/RegisterEvent';
import UserDashboard from './pages/UserDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import {
  initializeStorage,
  saveEvents,
  savePasses,
  saveRegistrations,
  saveUsers,
  resetAllData,
} from './utils/storage';
import './App.css';

/**
 * App
 * Top-level router shell. Holds shared application state (events, passes,
 * registrations, users) and passes it down to pages.
 *
 * Sign-in has been removed: the app is public by default and organizer
 * features are available to everyone on this device.
 *
 * State:
 *   events        - all created events
 *   passes        - all generated passes
 *   registrations - all event registrations
 *   users         - all user accounts (legacy compat; no longer used for auth)
 *   toasts        - active toast notifications
 *
 * Concepts used: useState, useEffect, props, routing.
 */
export default function App() {
  const [events, setEvents] = useState([]);
  const [passes, setPasses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [users, setUsers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  /* Apply theme before first paint (no flash) */
  useEffect(() => {
    const initial = initTheme();
    setTheme(initial);
  }, []);

  /* Load everything from localStorage (with legacy migration) on startup */
  useEffect(() => {
    const {
      events: loadedEvents,
      passes: loadedPasses,
      registrations: loadedRegistrations,
      users: loadedUsers,
    } = initializeStorage();
    setEvents(loadedEvents);
    setPasses(loadedPasses);
    setRegistrations(loadedRegistrations);
    setUsers(loadedUsers);
    setLoading(false);
  }, []);

  const handleThemeChange = (next) => {
    const applied = applyTheme(next);
    setTheme(applied);
  };

  const handleSaveEvents = (next) => {
    if (!saveEvents(next)) {
      addToast({ type: 'error', message: 'Storage full — could not save events.' });
      return;
    }
    setEvents(next);
  };

  const handleSavePasses = (next) => {
    if (!savePasses(next)) {
      addToast({ type: 'error', message: 'Storage full — could not save passes.' });
      return;
    }
    setPasses(next);
  };

  const handleSaveRegistrations = (next) => {
    if (!saveRegistrations(next)) {
      addToast({ type: 'error', message: 'Storage full — could not save registrations.' });
      return;
    }
    setRegistrations(next);
  };

  const handleSaveUsers = (next) => {
    if (!saveUsers(next)) {
      addToast({ type: 'error', message: 'Storage full — could not save users.' });
      return;
    }
    setUsers(next);
  };

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetData = () => {
    if (
      !window.confirm(
        'WARNING: This will delete ALL data (users, events, passes, registrations). This cannot be undone. Continue?'
      )
    ) {
      return;
    }
    const next = resetAllData();
    setEvents(next.events);
    setPasses(next.passes);
    setRegistrations(next.registrations);
    setUsers(next.users);
    addToast({ type: 'success', message: 'All data has been reset.' });
  };

  if (loading) {
    return null;
  }

  return (
    <Router>
      <div className="app">
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <Header onResetData={handleResetData} theme={theme} onThemeChange={handleThemeChange} />
        <main className="container">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  events={events}
                  passes={passes}
                  registrations={registrations}
                  onSavePasses={handleSavePasses}
                  onSaveRegistrations={handleSaveRegistrations}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <EventDetails
                  events={events}
                  registrations={registrations}
                  onSaveRegistrations={handleSaveRegistrations}
                  onSaveEvents={handleSaveEvents}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/register/:eventId"
              element={
                <RegisterEvent
                  events={events}
                  registrations={registrations}
                  passes={passes}
                  users={users}
                  onSaveRegistrations={handleSaveRegistrations}
                  onSavePasses={handleSavePasses}
                  onSaveEvents={handleSaveEvents}
                  onSaveUsers={handleSaveUsers}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/user-dashboard"
              element={
                <UserDashboard
                  events={events}
                  passes={passes}
                  registrations={registrations}
                  onSavePasses={handleSavePasses}
                  addToast={addToast}
                />
              }
            />
            <Route
              path="/organizer"
              element={
                <OrganizerDashboard
                  events={events}
                  passes={passes}
                  registrations={registrations}
                  users={users}
                  onSaveEvents={handleSaveEvents}
                  onSavePasses={handleSavePasses}
                  onSaveRegistrations={handleSaveRegistrations}
                  onSaveUsers={handleSaveUsers}
                  addToast={addToast}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace={true} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
