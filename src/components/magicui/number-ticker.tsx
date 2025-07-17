
import * as React from "react"

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
}

export function NumberTicker({ value, duration = 1000, className }: NumberTickerProps) {
  // Simple static display for now
  return <span className={className}>{value}</span>
}
