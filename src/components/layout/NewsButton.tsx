
"use client";

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';

export function NewsButton() {
  return (
    <Link
      href="/chat/interests"
      className={cn(
        "group/news relative flex items-center justify-center drop-shadow-xl text-white font-semibold",
        "bg-[#3b82f6]", // A blue color for news
        "transition-all duration-500 ease-in-out",
        "w-[38px] h-[38px] rounded-md",
        "group-hover/main-sidebar:hidden:hover:rounded-full",
        "group-hover/main-sidebar:hidden:hover:-translate-y-1",
        "group-hover/main-sidebar:hidden:hover:bg-gradient-to-r group-hover/main-sidebar:hidden:hover:from-blue-500 group-hover/main-sidebar:hidden:hover:to-indigo-600",
        "group-hover/main-sidebar:w-full group-hover/main-sidebar:justify-start group-hover/main-sidebar:rounded-lg group-hover/main-sidebar:px-3 group-hover/main-sidebar:py-0 group-hover/main-sidebar:h-[50px]",
        "group-hover/main-sidebar:hover:bg-sidebar-accent/70 group-hover/main-sidebar:hover:text-sidebar-accent-foreground"
      )}
      aria-label="Open News Feed"
    >
      <span className="link-icon-style">
        <Newspaper
          className={cn(
            "h-5 w-5",
            "transition-all duration-500 ease-in-out shrink-0"
          )}
        />
      </span>

      <span className={cn(
        "link-title-style"
      )}>
        News Feed
      </span>

      <span
        className={cn(
          "absolute opacity-0 text-xs -top-8 left-1/2 -translate-x-1/2 pointer-events-none",
          "group-hover/news:opacity-100 group-hover/news:text-popover-foreground",
          "transition-all duration-300 ease-in-out delay-75",
          "bg-popover border border-border p-1.5 rounded-md shadow-lg whitespace-nowrap",
          "group-hover/main-sidebar:group-hover/news:opacity-0"
        )}
      >
        News Feed
      </span>
    </Link>
  );
}
