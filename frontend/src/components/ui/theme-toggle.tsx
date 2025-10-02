'use client';

import { useAtom } from 'jotai';
import { themeAtom, toggleThemeAtom, initializeThemeAtom } from '@/stores/theme.store';
import { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme] = useAtom(themeAtom);
  const [, toggleTheme] = useAtom(toggleThemeAtom);
  const [, initializeTheme] = useAtom(initializeThemeAtom);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      <div className="relative overflow-hidden">
        <Sun 
          className={`h-5 w-5 transition-all duration-500 ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`absolute top-0 left-0 h-5 w-5 transition-all duration-500 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25' 
          : 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 shadow-lg shadow-yellow-400/25'
      } opacity-0 group-hover:opacity-100`} />
    </button>
  );
}
