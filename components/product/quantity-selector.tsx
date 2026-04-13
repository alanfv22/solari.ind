'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantitySelectorProps {
  quantity: number
  onChange: (quantity: number) => void
  max?: number
  min?: number
}

export function QuantitySelector({
  quantity,
  onChange,
  max = 10,
  min = 1,
}: QuantitySelectorProps) {
  const decrease = () => {
    if (quantity > min) {
      onChange(quantity - 1)
    }
  }

  const increase = () => {
    if (quantity < max) {
      onChange(quantity + 1)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Cantidad</span>
      <div className="flex items-center gap-4">
        <button
          onClick={decrease}
          disabled={quantity <= min}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors',
            quantity <= min
              ? 'cursor-not-allowed opacity-40'
              : 'hover:bg-secondary'
          )}
          aria-label="Disminuir cantidad"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="w-8 text-center text-lg font-medium text-foreground">
          {quantity}
        </span>

        <button
          onClick={increase}
          disabled={quantity >= max}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors',
            quantity >= max
              ? 'cursor-not-allowed opacity-40'
              : 'hover:bg-secondary'
          )}
          aria-label="Aumentar cantidad"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
