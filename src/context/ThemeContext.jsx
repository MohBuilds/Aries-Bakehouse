'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
const ThemeContext = createContext(null);
const STORAGE_KEY = 'aries-theme';
let sessionPreference;
function getTheme() {
  let preference = sessionPreference;
  try { preference = window.localStorage.getItem(STORAGE_KEY) || preference; } catch { /* Use the session preference. */ }
  return preference === 'light' || preference === 'dark' ? preference : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme() {
  const theme = getTheme();
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
function subscribe(callback) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => { applyTheme(); callback(); };
  const storage = (event) => { if (event.key === STORAGE_KEY || event.key === null) { sessionPreference = undefined; update(); } };
  applyTheme();
  media.addEventListener('change', update);
  window.addEventListener('storage', storage);
  window.addEventListener('aries-theme-change', update);
  return () => { media.removeEventListener('change', update); window.removeEventListener('storage', storage); window.removeEventListener('aries-theme-change', update); };
}
function setTheme(next) {
  if (next !== 'light' && next !== 'dark') return;
  sessionPreference = next;
  try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* The switch works without storage. */ }
  applyTheme();
  window.dispatchEvent(new Event('aries-theme-change'));
}
export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');
  const value = useMemo(() => ({ theme, setTheme, toggleTheme: () => setTheme(getTheme() === 'dark' ? 'light' : 'dark') }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
