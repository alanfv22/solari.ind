'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/mock-data'
import type { Product, ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  )
  const [isHovered, setIsHovered] = useState(false)
  const { addItem } = useCartStore()

  const price = selectedVariant?.price_override ?? product.base_price
  const hasDiscount = product.compare_at_price && product.compare_at_price > price
  const sizeVariants = product.variants?.filter((v) => v.type === 'size') ?? []

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, selectedVariant)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Quick view functionality - could open a modal
    window.location.href = `/producto/${product.slug}`
  }

  const handleVariantSelect = (e: React.MouseEvent, variant: ProductVariant) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariant(variant)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-md/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/producto/${product.slug}`} className="flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              'object-cover transition-all duration-500',
              isHovered && 'scale-105'
            )}
          />
          {/* Second image on hover (if exists) */}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={`${product.name} - vista alternativa`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                'absolute inset-0 object-cover transition-opacity duration-500',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* SALE Badge - Square Terracotta Style */}
          {hasDiscount && (
            <div className="absolute top-3 left-3">
              <span className="flex h-10 w-10 items-center justify-center bg-orange-800 text-[10px] font-bold uppercase tracking-wide text-orange-100">
                SALE
              </span>
            </div>
          )}

          {/* Hover Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute bottom-4 left-4 right-4 flex gap-2"
          >
            <Button
              onClick={handleAddToCart}
              className="flex-1 gap-2 bg-slate-900 text-slate-100 hover:bg-slate-800"
              size="sm"
            >
              <ShoppingBag className="h-4 w-4" />
              Agregar al carrito
            </Button>
            <Button
              onClick={handleQuickView}
              variant="outline"
              size="sm"
              className="border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-2 p-4 pb-5">
          {/* Category */}
          <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {product.category?.name}
          </span>

          {/* Name - Sans-serif, clear */}
          <h3 className="font-sans text-base font-medium text-slate-900 leading-snug">
            {product.name}
          </h3>

          {/* Price - Bold and prominent */}
          <div className="flex items-center gap-3 pt-1">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-slate-900">
                  {formatPrice(price)}
                </span>
                <span className="text-sm font-medium text-slate-400 line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(price)}
              </span>
            )}
          </div>

          {/* Size Variants */}
          {sizeVariants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {sizeVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => handleVariantSelect(e, variant)}
                  className={cn(
                    'flex h-8 min-w-[32px] items-center justify-center border px-2.5 text-xs font-medium transition-all',
                    selectedVariant?.id === variant.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-900 hover:border-slate-900'
                  )}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  )
}
