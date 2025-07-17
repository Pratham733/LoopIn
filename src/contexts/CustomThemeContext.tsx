
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback }
from 'react';
import type { CustomTheme, ThemePalette } from '@/types';
import { THEME_OPTIONS, DEFAULT_THEME_NAME } from '@/lib/themeOptions';

const LOCAL_STORAGE_THEME_KEY = 'loopinchat-custom-theme';

interface CustomThemeContextType {
  currentTheme: CustomTheme;
  applyTheme: (themeName: string) => void;
  availableThemes: CustomTheme[];
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

const getDefaultTheme = (): CustomTheme => {
  return THEME_OPTIONS.find(t => t.name === DEFAULT_THEME_NAME) || THEME_OPTIONS[0];
};

const applyCssVariables = (palette: ThemePalette) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--primary-foreground', palette.primaryForeground);
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--accent-foreground', palette.accentForeground);
  // Update ring color to match new primary
  root.style.setProperty('--ring', palette.primary);
};

export function CustomThemeProvider({ children }: { children: ReactNode }) {
  // 1. Initialize with a non-localStorage value to prevent hydration mismatch.
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(getDefaultTheme());

  // 2. On client-side mount, check localStorage and update the theme.
  useEffect(() => {
    const savedThemeName = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    const savedTheme = THEME_OPTIONS.find(t => t.name === savedThemeName);
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  // 3. Apply changes whenever the theme state is updated.
  useEffect(() => {
    applyCssVariables(currentTheme.palette);
  }, [currentTheme]);

  const applyTheme = useCallback((themeName: string) => {
    const newTheme = THEME_OPTIONS.find(t => t.name === themeName);
    if (newTheme) {
      setCurrentTheme(newTheme);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme.name);
      }
    }
  }, []);

  return (
    <CustomThemeContext.Provider value={{ currentTheme, applyTheme, availableThemes: THEME_OPTIONS }}>
      {children}
    </CustomThemeContext.Provider>
  );
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
}
