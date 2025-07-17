
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useMemo } from "react";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  vertical?: boolean;
  repeat?: number; // Number of times to repeat the content, e.g., 4 for a typical setup
  speed?: "slow" | "normal" | "fast" | string; // Predefined speeds or custom duration string
  fade?: boolean; // Whether to apply a fade effect at the edges
  [key: string]: any;
}

export default function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4, // Sensible default for horizontal marquees
  speed = "normal", // Default speed
  fade = false,
  ...props
}: MarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (marqueeRef.current && contentRef.current) {
      const calculateWidths = () => {
        setContainerWidth(marqueeRef.current!.offsetWidth);
        setContentWidth(contentRef.current!.offsetWidth);
      };
      calculateWidths();
      window.addEventListener("resize", calculateWidths);
      return () => window.removeEventListener("resize", calculateWidths);
    }
  }, []);

  const durationMap = {
    slow: "80s",
    normal: "40s",
    fast: "20s",
  };
  const animationDuration = typeof speed === "string" && durationMap[speed as keyof typeof durationMap]
    ? durationMap[speed as keyof typeof durationMap]
    : typeof speed === 'string'
    ? speed
    : durationMap.normal;

  // Calculate dynamic repeat count based on content
  const dynamicRepeat = useMemo(() => {
    if (!contentWidth || !containerWidth) return repeat;
    
    // If content is wider than container, we need at least 2 repeats for seamless loop
    if (contentWidth > containerWidth) {
      // Calculate how many repeats we need to fill the container plus some buffer
      const neededRepeats = Math.ceil((containerWidth * 2) / contentWidth);
      return Math.max(neededRepeats, 2);
    }
    
    // If content is smaller than container, we need more repeats to fill it
    const neededRepeats = Math.ceil(containerWidth / contentWidth);
    return Math.max(neededRepeats, 3); // Minimum 3 repeats for smooth appearance
  }, [contentWidth, containerWidth, repeat]);


  if (!isMounted) {
    return null; // Avoid SSR issues with width calculations
  }

  return (
    <div
      ref={marqueeRef}
      className={cn(
        "group flex overflow-hidden p-2 [--gap:1rem] [--duration:40s]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
      style={{ '--duration': animationDuration } as React.CSSProperties}
      {...props}
    >
      {Array(dynamicRepeat) // Use dynamic repeat count
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? contentRef : null} // Only need ref for the first instance to measure
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee-horizontal group-hover:[animation-play-state:paused]": pauseOnHover && !vertical,
              "animate-marquee-horizontal": !pauseOnHover && !vertical,
              "animate-marquee-vertical group-hover:[animation-play-state:paused]": pauseOnHover && vertical,
              "animate-marquee-vertical": !pauseOnHover && vertical,
              "flex-col": vertical,
              "flex-row": !vertical,
              "animation-reverse": reverse,
            })}
          >
            {children}
          </div>
        ))}
        {fade && (
            <>
            <div className={cn("pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background via-background/80 to-transparent", vertical && "hidden")}></div>
            <div className={cn("pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background via-background/80 to-transparent", vertical && "hidden")}></div>
            <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background via-background/80 to-transparent", !vertical && "hidden")}></div>
            <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent", !vertical && "hidden")}></div>
            </>
        )}
    </div>
  );
}

// Ensure keyframes are defined in tailwind.config.ts or globals.css
// If not, you might need to add them. For now, assuming they exist or will be added.
// Keyframes typically look like:
/*
@keyframes marquee-horizontal {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-100% - var(--gap))); }
}
@keyframes marquee-vertical {
  from { transform: translateY(0); }
  to { transform: translateY(calc(-100% - var(--gap))); }
}
*/
// And in tailwind.config.ts:
/*
theme: {
  extend: {
    animation: {
      "marquee-horizontal": "marquee-horizontal var(--duration) linear infinite",
      "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
    },
    keyframes: {
      "marquee-horizontal": {
        from: { transform: "translateX(0)" },
        to: { transform: "translateX(calc(-100% - var(--gap)))" },
      },
      "marquee-vertical": {
        from: { transform: "translateY(0)" },
        to: { transform: "translateY(calc(-100% - var(--gap)))" },
      },
    },
  },
},
*/
