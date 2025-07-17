import React, { useEffect, useRef, useState } from "react";
import "./SocialShareClock.css";

interface SocialShareClockProps {
  size?: number;
  time?: Date;
}

export const SocialShareClock: React.FC<SocialShareClockProps> = ({ size = 64, time }) => {
  const [now, setNow] = useState<Date>(time || new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!time) {
      intervalRef.current = setInterval(() => setNow(new Date()), 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [time]);

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = (hours + minutes / 60) * 30;
  const minDeg = (minutes + seconds / 60) * 6;
  const secDeg = seconds * 6;

  return (
    <div
      className="social-share-clock"
      style={{ width: size, height: size }}
      title={now.toLocaleTimeString()}
    >
      <svg viewBox="0 0 100 100" className="clock-face">
        <circle cx="50" cy="50" r="48" className="clock-bg" />
        <g className="clock-ticks">
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x="48"
              y="6"
              width="4"
              height="12"
              rx="2"
              fill="#fff"
              opacity={i % 3 === 0 ? 1 : 0.5}
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </g>
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="24"
          className="clock-hour"
          stroke="#fff"
          strokeWidth={4}
          strokeLinecap="round"
          transform={`rotate(${hourDeg} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="16"
          className="clock-minute"
          stroke="#fff"
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={`rotate(${minDeg} 50 50)`}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="10"
          className="clock-second"
          stroke="#ff4d4f"
          strokeWidth={1.5}
          strokeLinecap="round"
          transform={`rotate(${secDeg} 50 50)`}
        />
        <circle cx="50" cy="50" r="3" fill="#fff" />
      </svg>
    </div>
  );
};

export default SocialShareClock; 