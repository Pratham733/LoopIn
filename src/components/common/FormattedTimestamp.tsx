
"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

interface FormattedTimestampProps {
  timestamp: Date | string | number;
  className?: string;
}

export function FormattedTimestamp({ timestamp, className }: FormattedTimestampProps) {
  const [formattedTime, setFormattedTime] = useState<string>(""); // Render nothing or a placeholder initially

  useEffect(() => {
    // This effect runs only on the client, after hydration
    try {
      // Validate timestamp before formatting
      if (!timestamp) {
        setFormattedTime("Just now");
        return;
      }
      
      const date = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp provided to FormattedTimestamp:', timestamp);
        setFormattedTime("Just now");
        return;
      }
      
      setFormattedTime(formatDistanceToNowStrict(date, { addSuffix: true }));
    } catch (error) {
      console.error('Error formatting timestamp:', error, 'Timestamp:', timestamp);
      setFormattedTime("Just now");
    }
  }, [timestamp]);

  if (!formattedTime) {
    // Optionally return a placeholder or null while waiting for client-side render
    // For example, a few dots to indicate loading, or match server render (empty)
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formattedTime}</span>;
}
