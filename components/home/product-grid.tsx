'use client'

import { motion } from 'framer-motion'
import { ProductCard } from '@/components/product/product-card'
import { ProductCardSkeleton } from '@/components/product/product-card-skeleton'
import type { Product } from '@/lib/types'

interface ProductGridProps {
  products: Product[]
  title?: string
  isLoading?: boolean
  skeletonCount?: number
}

export function ProductGrid({ products, title, isLoading = false, skeletonCount = 8 }: ProductGridProps) {
  return (
    <section className="bg-slate-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 font-serif text-2xl font-medium text-foreground sm:text-3xl lg:mb-12"
          >
            {title}
          </motion.h2>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No hay productos para mostrar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
