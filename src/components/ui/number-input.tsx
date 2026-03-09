"use client"

import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  className?: string
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  required,
  autoFocus,
  className,
}: NumberInputProps) {
  const decimals = step.toString().includes(".")
    ? step.toString().split(".")[1].length
    : 0

  function clamp(v: number) {
    if (min !== undefined && v < min) return min
    if (max !== undefined && v > max) return max
    return v
  }

  function increment() {
    const current = parseFloat(value) || 0
    const next = clamp(parseFloat((current + step).toFixed(decimals)))
    onChange(String(next))
  }

  function decrement() {
    const current = parseFloat(value) || 0
    const next = clamp(parseFloat((current - step).toFixed(decimals)))
    onChange(String(next))
  }

  return (
    <div className={cn("relative flex rounded-lg overflow-hidden", className)}>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute right-0 inset-y-0 flex flex-col w-8 border-l border-zinc-700 rounded-r-lg overflow-hidden">
        <button
          type="button"
          onClick={increment}
          tabIndex={-1}
          className="flex-1 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700/70 transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <div className="h-px bg-zinc-700" />
        <button
          type="button"
          onClick={decrement}
          tabIndex={-1}
          className="flex-1 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700/70 transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
