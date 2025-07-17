
"use client";

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { CustomThemeProvider } from '@/contexts/CustomThemeContext';
import { AlertProvider } from '@/components/AlertProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <CustomThemeProvider>
        <AuthProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}
