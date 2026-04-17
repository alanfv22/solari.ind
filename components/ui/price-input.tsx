'use client'

import { forwardRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Formats a number using Argentine locale: 3000 → "3.000,00"
function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Parses an Argentine-formatted string back to a number: "3.000,50" → 3000.5
function parseARS(raw: string): number | null {
  // Remove thousand separators (dots) and replace decimal comma with dot
  const cleaned = raw.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

interface PriceInputProps {
  value?: number | null
  onChange?: (value: number | null) => void
  onBlur?: () => void
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, onBlur, placeholder, id, className, disabled }, ref) => {
    const [focused, setFocused] = useState(false)
    // Internal display string while editing
    const [editValue, setEditValue] = useState('')

    const handleFocus = useCallback(() => {
      setFocused(true)
      // Show raw number without formatting so the user can type freely
      setEditValue(value != null ? String(value) : '')
    }, [value])

    const handleBlur = useCallback(() => {
      setFocused(false)
      const parsed = parseARS(editValue)
      onChange?.(parsed)
      onBlur?.()
    }, [editValue, onChange, onBlur])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setEditValue(raw)
      // Update parent with parsed value on every keystroke so validation works
      const parsed = parseARS(raw)
      onChange?.(parsed ?? (raw === '' ? null : undefined as unknown as null))
    }, [onChange])

    const displayValue = focused
      ? editValue
      : value != null
      ? formatARS(value)
      : ''

    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    )
  }
)

PriceInput.displayName = 'PriceInput'
