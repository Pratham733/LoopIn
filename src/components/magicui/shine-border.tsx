
"use client";

import React, { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string | string[]; // Can be a single color or an array of colors for the gradient
  children: React.ReactNode;
  className?: string;
}

/**
 * @name ShineBorder
 * @description A component that adds an animated shine border effect to its children.
 * @author Dillion
 * @param {number} borderRadius - The border radius of the shine effect.
 * @param {number} borderWidth - The width of the shine border.
 * @param {number} duration - The duration of the shine animation in seconds.
 * @param {string | string[]} color - The color or colors for the shine gradient. Defaults to ['#A07CFE', '#FE8FB5', '#FFBE7B'].
 * @param {React.ReactNode} children - The content to be wrapped by the shine border.
 * @param {string} className - Additional CSS classes for the wrapper.
 */
export default function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 5,
  color = ['#A07CFE', '#FE8FB5', '#FFBE7B'], // Default gradient from Magic UI examples
  children,
  className,
  ...props
}: ShineBorderProps) {
  const reactId = useId();
  const uniqueId = useMemo(() => `shine-border-${reactId.replace(/:/g, "")}`, [reactId]);

  const gradientColors = Array.isArray(color) ? color : [color];
  const gradientStops = gradientColors
    .map((c, i) => `${c} ${ (i * 100) / (gradientColors.length > 1 ? gradientColors.length -1 : 1) }%`)
    .join(', ');

  const keyframes = useMemo(() => `
    @keyframes ${uniqueId}-anim {
      0% { --shine-angle: 0deg; }
      100% { --shine-angle: 360deg; }
    }
  `, [uniqueId]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div
        className={cn(
          "relative overflow-hidden group",
          className
        )}
        style={{
          borderRadius: `${borderRadius}px`,
          '--shine-border-width': `${borderWidth}px`,
          '--shine-duration': `${duration}s`,
          '--shine-angle': '0deg',
          '--shine-gradient': `conic-gradient(from var(--shine-angle), transparent 0%, transparent 40%, ${gradientStops}, transparent 60%, transparent 100%)`,
        } as React.CSSProperties}
        {...props}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            borderRadius: 'inherit',
            border: `var(--shine-border-width) solid transparent`,
            animation: `${uniqueId}-anim var(--shine-duration) linear infinite`,
            backgroundClip: 'padding-box, border-box',
            backgroundOrigin: 'padding-box, border-box',
            backgroundImage: `linear-gradient(hsl(var(--card)), hsl(var(--card))), var(--shine-gradient)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        <div className="relative z-10 w-full h-full">
            {children}
        </div>
      </div>
    </>
  );
}

