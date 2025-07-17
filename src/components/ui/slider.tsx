import * as React from "react"

interface SliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({ value, min = 0, max = 100, step = 1, onChange, className }: SliderProps) {
  return (
    <input
      type="range"
      className={className}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
    />
  )
} 