"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import "./interactive-hover-button.css";

interface InteractiveHoverButtonProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  className?: string;
}

export const InteractiveHoverButton = ({
  children,
  className,
  ...props
}: InteractiveHoverButtonProps) => {
  return (
    <Link className={cn("interactive-button", className)} {...props}>
      <span className="interactive-button-content">{children}</span>
    </Link>
  );
};
