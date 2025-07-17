"use client"

import { Input } from "./input"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function PasswordInput(props: PasswordInputProps) {
  return (
    <Input
      {...props}
      type="password"
    />
  )
} 