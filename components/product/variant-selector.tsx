'use client'

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
  // Show all variants if none have type set (Supabase products without type column)
  const filteredVariants = variants.filter((v) =>
    type === 'size' ? (!v.type || v.type === 'size') : v.type === type
  )

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
              title={isOutOfStock ? 'Sin stock en este talle' : variant.label}
              className={cn(
                'relative flex h-12 min-w-[48px] items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all overflow-hidden',
                isSelected && !isOutOfStock
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isSelected && isOutOfStock
                  ? 'border-destructive/60 bg-destructive/10 text-destructive'
                  : isOutOfStock
                  ? 'border-border bg-background text-muted-foreground hover:border-muted-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary'
              )}
            >
              {/* Diagonal strike for out-of-stock */}
              {isOutOfStock && (
                <span className="pointer-events-none absolute inset-0">
                  <svg className="h-full w-full" preserveAspectRatio="none">
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
                  </svg>
                </span>
              )}
              <span className="relative z-10">{variant.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
