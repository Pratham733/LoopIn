
"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';
import { FormattedTimestamp } from '@/components/common/FormattedTimestamp';

interface NotificationMarqueeCardProps {
  notification: NotificationType;
  className?: string;
}

export function NotificationMarqueeCard({ notification, className }: NotificationMarqueeCardProps) {
  const cardContent = (
    <figure
      className={cn(
        "relative flex flex-col h-full w-72 cursor-pointer overflow-hidden rounded-xl border p-4 transition-colors",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        !notification.isRead && "border-primary/30 ring-1 ring-primary/20",
        className
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-2">
        {notification.icon && <notification.icon className={cn("h-7 w-7 flex-shrink-0", notification.isRead ? "text-muted-foreground" : "text-primary")} />}
        <div className="flex-1 min-w-0">
          <figcaption className={cn("text-sm font-semibold dark:text-white truncate", notification.isRead ? "text-foreground" : "text-primary")}>
            {notification.title}
          </figcaption>
          <FormattedTimestamp
            timestamp={notification.timestamp}
            className="text-xs font-medium dark:text-white/40 text-muted-foreground"
          />
        </div>
        {!notification.isRead && (
          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 self-start" aria-label="Unread notification"></div>
        )}
      </div>
      <blockquote className="mt-auto text-sm text-muted-foreground dark:text-white/80 line-clamp-3">
        {notification.message}
      </blockquote>
    </figure>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}
