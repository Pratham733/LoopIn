import * as React from "react"

interface ProgressProps {
  value: number
  max?: number
  className?: string
}

export function Progress({ value, max = 100, className }: ProgressProps) {
  return (
    <div className={className}>
      <div style={{ width: `${(value / max) * 100}%`, background: "#888", height: 8 }} />
    </div>
  )
} 