'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Gender } from '@/lib/types'

interface GenderFilterProps {
  selected: 'mujer' | 'hombre' | 'todo'
  onChange: (gender: 'mujer' | 'hombre' | 'todo') => void
}

const filters: { value: 'mujer' | 'hombre' | 'todo'; label: string }[] = [
  { value: 'mujer', label: 'Mujer' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'todo', label: 'Todo' },
]

export function GenderFilter({ selected, onChange }: GenderFilterProps) {
  return (
    <div className="sticky top-[72px] z-30 border-b border-foreground bg-background">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-center justify-center gap-0 py-4 sm:justify-start">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onChange(filter.value)}
              className={cn(
                'relative px-6 py-2.5 text-sm font-medium uppercase tracking-wider transition-all',
                selected === filter.value
                  ? 'bg-foreground text-background'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {selected === filter.value && (
                <motion.span
                  layoutId="gender-filter-bg"
                  className="absolute inset-0 bg-foreground"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
