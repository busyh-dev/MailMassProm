// hooks/useDarkMode.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mailmassprom-theme';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Carica preferenza salvata al mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Usa preferenza salvata, altrimenti segue il sistema
    const shouldBeDark = saved !== null ? saved === 'dark' : prefersDark;
    
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
    setMounted(true);
  }, []);

  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    applyTheme(newValue);
    localStorage.setItem(STORAGE_KEY, newValue ? 'dark' : 'light');
  };

  const setLight = () => {
    setIsDark(false);
    applyTheme(false);
    localStorage.setItem(STORAGE_KEY, 'light');
  };

  const setDark = () => {
    setIsDark(true);
    applyTheme(true);
    localStorage.setItem(STORAGE_KEY, 'dark');
  };

  return { isDark, toggle, setLight, setDark, mounted };
};
