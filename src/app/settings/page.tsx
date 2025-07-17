"use client";

import { ChangePasswordForm } from '../../components/settings/ChangePasswordForm';
import { useCustomTheme } from '@/contexts/CustomThemeContext';
import Particles from '@/components/magicui/particles';
import { useMemo } from 'react';

export default function SecurityPage() {
  const { currentTheme } = useCustomTheme();

  const particleColor = useMemo(() => {
    if (currentTheme && currentTheme.palette.primaryHex) {
      // Make the color darker for better visibility
      const color = currentTheme.palette.primaryHex;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      // Reduce brightness by a factor
      const factor = 0.4;
      const darkR = Math.floor(r * factor);
      const darkG = Math.floor(g * factor);
      const darkB = Math.floor(b * factor);
      return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    }
    return '#000000'; // Default to black if theme color is not available
  }, [currentTheme]);

  return (
    <div className="space-y-6 relative">
      <Particles
        className="absolute inset-0 -z-10"
        particleCount={80}
        particleColors={[particleColor]}
      />
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security settings.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
