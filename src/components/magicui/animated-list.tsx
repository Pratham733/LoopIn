"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedList({ 
  children, 
  className,
  delay = 1000 
}: AnimatedListProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const childrenArray = Array.isArray(children) ? children : [children];
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    // Animate items in sequence
    childrenArray.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * delay);
      timeoutRefs.current.push(timeout);
    });

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [childrenArray, delay]);

  return (
    <div className={cn("space-y-2", className)}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-500 ease-out",
            visibleItems.includes(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
          style={{
            transitionDelay: `${index * 100}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}