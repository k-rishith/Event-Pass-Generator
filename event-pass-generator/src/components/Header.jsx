import { Link, useNavigate } from 'react-router-dom';

/**
 * Header
 * Displays the app title, short description, and main navigation.
 * Navigation is public; no sign-in is required to browse, register, or
 * organize events on this device.
 *
 * Props:
 *   onResetData   - called to reset all app data (with confirmation)
 *   theme         - current theme ('light' | 'dark')
 *   onThemeChange - handler to switch theme
 *
 * Concepts used: props, JSX, routing links, event handlers.
 */
export default function Header({ onResetData, theme, onThemeChange }) {
  const navigate = useNavigate();

  const handleResetData = (event) => {
    event.preventDefault();
    onResetData();
  };

  const handleToggleTheme = () => {
    onThemeChange(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>Event Pass Platform</h1>
        <p>Discover events, register, and manage your digital passes</p>
      </div>
      <nav className="header-nav">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/user-dashboard" className="nav-link">My Passes</Link>
        <Link to="/organizer" className="nav-link">Organize Event</Link>
        <button
          type="button"
          className="nav-link theme-toggle"
          onClick={handleToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
        <button
          type="button"
          className="nav-link btn-danger-outline"
          onClick={handleResetData}
          title="Reset all demo data"
        >
          ⚠ Reset Data
        </button>
      </nav>
    </header>
  );
}
