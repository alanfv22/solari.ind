'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'
import type { Product, ProductVariant } from '@/lib/types'
import { cn, calcularPrecios } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  index?: number
}

function firstAvailableVariant(variants: ProductVariant[] | undefined): ProductVariant | null {
  if (!variants || variants.length === 0) return null
  return variants.find((v) => v.type === 'size' && v.stock > 0) ?? variants[0] ?? null
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    firstAvailableVariant(product.variants)
  )
  const [isHovered, setIsHovered] = useState(false)
  const { addItem, cashDiscountPercent } = useCartStore()

  const basePrice = selectedVariant?.price_override ?? product.base_price
  const { precioLista, precioTransferencia, precioOferta, precioOfertaTransferencia } =
    calcularPrecios(basePrice, cashDiscountPercent, product.is_on_sale ?? false, product.sale_percent ?? 0)
  const sizeVariants = product.variants?.filter((v) => v.type === 'size') ?? []

  const selectedOutOfStock = selectedVariant !== null && selectedVariant.stock <= 0
  const canAddToCart = (product.is_made_to_order ?? false) || !selectedOutOfStock

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canAddToCart) return
    addItem(product, selectedVariant)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
          {product.images?.[0]?.url && (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                'object-cover transition-all duration-500',
                isHovered && 'scale-105'
              )}
            />
          )}
          {/* Second image on hover (if exists) */}
          {product.images?.[1]?.url && (
            <Image
              src={product.images[1].url}
              alt={`${product.name} - vista alternativa`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                'absolute inset-0 object-cover transition-opacity duration-500',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}

          {/* Badges (top-left, stacked) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_on_sale && (
              <span className="flex h-10 w-10 items-center justify-center bg-orange-800 text-[10px] font-bold uppercase tracking-wide text-orange-100">
                {(product.sale_percent ?? 0) >= 30 ? 'LIQD.' : 'OFERTA'}
              </span>
            )}
            {product.is_made_to_order && (
              <span className="flex items-center gap-1 rounded bg-slate-800/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                <Clock className="h-2.5 w-2.5" />
                Por encargo
              </span>
            )}
          </div>

          {/* Hover Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="absolute bottom-4 left-4 right-4 flex gap-2"
          >
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={cn(
                'flex-1 gap-2 text-slate-100',
                canAddToCart
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : 'cursor-not-allowed bg-slate-400'
              )}
              size="sm"
            >
              <ShoppingBag className="h-4 w-4" />
              {selectedOutOfStock && !product.is_made_to_order ? 'Sin stock' : 'Agregar'}
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

          {/* Name */}
          <h3 className="font-sans text-base font-medium text-slate-900 leading-snug">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex flex-col gap-0.5 pt-1">
            {/* Precio lista tachado (solo si hay oferta) */}
            {precioOferta !== null && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(precioLista)}
              </span>
            )}
            {/* Precio de oferta o precio lista */}
            {precioOferta !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-orange-700">
                  {formatPrice(precioOferta)}
                </span>
                <span className="text-[11px] text-slate-500">lista</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-slate-500 line-through">
                  {formatPrice(precioLista)}
                </span>
                <span className="text-[11px] text-slate-500">lista</span>
              </div>
            )}
            {/* Precio transferencia (siempre resaltado) */}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-emerald-700">
                {formatPrice(precioOfertaTransferencia ?? precioTransferencia)}
              </span>
              <span className="text-[11px] text-emerald-600">transferencia</span>
            </div>
          </div>

          {/* Size Variants */}
          {sizeVariants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {sizeVariants.map((variant) => {
                const outOfStock = variant.stock <= 0
                const isSelected = selectedVariant?.id === variant.id
                return (
                  <button
                    key={variant.id}
                    onClick={(e) => handleVariantSelect(e, variant)}
                    disabled={outOfStock && !product.is_made_to_order}
                    title={outOfStock ? 'Sin stock' : undefined}
                    className={cn(
                      'relative flex h-8 min-w-[32px] items-center justify-center border px-2.5 text-xs font-medium transition-all',
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-900 hover:border-slate-900',
                      outOfStock && !product.is_made_to_order && 'cursor-not-allowed opacity-40',
                      outOfStock && !isSelected && 'line-through'
                    )}
                  >
                    {variant.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  )
}
