'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/lib/types'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selected: ProductVariant | null
  onChange: (variant: ProductVariant) => void
  type?: 'size' | 'color'
}

export function VariantSelector({
  variants,
  selected,
  onChange,
  type = 'size',
}: VariantSelectorProps) {
  const filteredVariants = variants.filter((v) => v.type === type)

  if (filteredVariants.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {type === 'size' ? 'Talle' : 'Color'}
        </span>
        {selected && (
          <span className="text-sm text-muted-foreground">{selected.label}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filteredVariants.map((variant) => {
          const isSelected = selected?.id === variant.id
          const isOutOfStock = variant.stock <= 0

          return (
            <button
              key={variant.id}
              onClick={() => onChange(variant)}
              disabled={isOutOfStock}
              className={cn(
                'relative flex h-12 min-w-[48px] items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary',
                isOutOfStock && 'cursor-not-allowed opacity-40'
              )}
            >
              {isSelected && (
                <motion.span
                  layoutId={`variant-${type}-bg`}
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className={cn('relative z-10', isOutOfStock && 'line-through')}>
                {variant.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
