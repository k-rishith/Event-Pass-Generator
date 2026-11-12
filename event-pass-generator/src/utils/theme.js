/* Theme helpers — persist user's theme choice in localStorage */
export const STORAGE_KEY = 'epg_theme';
export const THEMES = ['light', 'dark'];

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && THEMES.includes(value)) {
      return value;
    }
  } catch {}
  return null;
}

export function applyTheme(theme) {
  const safe = THEMES.includes(theme) ? theme : 'light';
  document.documentElement.dataset.theme = safe;
  try {
    localStorage.setItem(STORAGE_KEY, safe);
  } catch {}
  return safe;
}

export function initTheme() {
  const stored = getStoredTheme();
  if (stored) {
    return applyTheme(stored);
  }
  // Follow system preference on first visit
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return applyTheme('dark');
  }
  return applyTheme('light');
}
