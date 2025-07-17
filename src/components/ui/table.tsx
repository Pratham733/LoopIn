import * as React from "react"

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return <table className={className}>{children}</table>
} 