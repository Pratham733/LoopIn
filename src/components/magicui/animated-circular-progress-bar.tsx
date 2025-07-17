
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface AnimatedCircularProgressBarProps extends React.SVGProps<SVGSVGElement> {
  value: number;
  max?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  circleWidth?: number;
  strokeWidth?: number;
  label?: string;
  showValueText?: boolean;
  valueSuffix?: string;
  animationSpeed?: number; // Duration of animation in ms
}

export function AnimatedCircularProgressBar({
  value,
  max = 100,
  min = 0,
  gaugePrimaryColor = "stroke-primary",
  gaugeSecondaryColor = "stroke-muted",
  circleWidth = 100, // Diameter of the circle
  strokeWidth = 8,
  label,
  showValueText = true,
  className,
  valueSuffix = "%",
  animationSpeed = 1000, // Default animation duration: 1 second
  ...props
}: AnimatedCircularProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(min);

  useEffect(() => {
    let startTime: number | null = null;
    const initialValue = animatedValue;
    const targetValue = Math.max(min, Math.min(value, max));

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / animationSpeed, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

      setAnimatedValue(initialValue + (targetValue - initialValue) * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(targetValue); // Ensure it ends exactly on target
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, max, min, animationSpeed]);


  const radius = (circleWidth - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const displayPercentage = Math.round(((animatedValue - min) / (max - min)) * 100);
  const offset = circumference - (displayPercentage / 100) * circumference;

  const viewBox = `0 0 ${circleWidth} ${circleWidth}`;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-2", className)}>
      <svg width={circleWidth} height={circleWidth} viewBox={viewBox} {...props}>
        <circle
          cx={circleWidth / 2}
          cy={circleWidth / 2}
          r={radius}
          className={cn("fill-transparent", gaugeSecondaryColor)}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={circleWidth / 2}
          cy={circleWidth / 2}
          r={radius}
          className={cn("fill-transparent", gaugePrimaryColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${circleWidth / 2} ${circleWidth / 2})`}
          style={{ transition: `stroke-dashoffset ${animationSpeed / 1000}s ease-out` }}
        />
        {showValueText && (
          <text
            x="50%"
            y="50%"
            dy="0.3em" 
            textAnchor="middle"
            className="text-lg font-semibold fill-foreground"
          >
            {`${displayPercentage}${valueSuffix}`}
          </text>
        )}
      </svg>
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
    </div>
  );
}
