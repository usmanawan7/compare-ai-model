import { atom } from 'jotai';

export type Theme = 'light' | 'dark';

export const themeAtom = atom<Theme>('light');

export const toggleThemeAtom = atom(
  null,
  (get, set) => {
    const currentTheme = get(themeAtom);
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    set(themeAtom, newTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  }
);

// Initialize theme from localStorage
export const initializeThemeAtom = atom(
  null,
  (get, set) => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        set(themeAtom, savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
    }
  }
);
