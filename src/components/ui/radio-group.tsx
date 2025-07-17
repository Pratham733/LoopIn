import * as React from "react"

interface RadioGroupProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function RadioGroup({ options, value, onChange, className }: RadioGroupProps) {
  return (
    <div className={className}>
      {options.map(opt => (
        <label key={opt.value}>
          <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  )
} 