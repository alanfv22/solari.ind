'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'
import type { Product, ProductVariant } from '@/lib/types'
import { cn, calcularPrecios } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  index?: number
}

function parseLabel(label: string): [string, string | null] {
  const idx = label.indexOf(' - ')
  if (idx === -1) return [label, null]
  return [label.slice(0, idx), label.slice(idx + 3)]
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [img1Loaded, setImg1Loaded] = useState(false)
  const [img2Loaded, setImg2Loaded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const { addItem, cashDiscountPercent, items: cartItems } = useCartStore()

  const isPriority = index < 6
  const variants = product.variants ?? []

  const isMultiDim = variants.some((v) => v.label.includes(' - '))
  const talles = isMultiDim
    ? [...new Set(variants.map((v) => parseLabel(v.label)[0]))]
    : []

  const colorsForTalle: { color: string; variant: ProductVariant }[] =
    selectedTalle && isMultiDim
      ? variants
          .filter((v) => parseLabel(v.label)[0] === selectedTalle)
          .map((v) => ({ color: parseLabel(v.label)[1]!, variant: v }))
      : []

  const resolvedVariant: ProductVariant | null = (() => {
    if (isMultiDim) {
      if (!selectedTalle || !selectedColor) return null
      return variants.find((v) => v.label === `${selectedTalle} - ${selectedColor}`) ?? null
    }
    if (!selectedTalle) return null
    return variants.find((v) => v.label === selectedTalle) ?? null
  })()

  // Returns how many units of a given variant are already in the cart
  function getCartQty(variantId: string | null): number {
    const found = cartItems.find(
      (i) => i.product.id === product.id && (i.variant?.id ?? null) === variantId
    )
    return found?.quantity ?? 0
  }

  // Available stock = real stock minus what's already in the cart
  function availableStock(variant: ProductVariant): number {
    if (product.is_made_to_order) return Infinity
    return variant.stock - getCartQty(variant.id)
  }

  const canConfirm = resolvedVariant !== null
  const resolvedAvailable = resolvedVariant ? availableStock(resolvedVariant) : 0
  const resolvedCartQty = resolvedVariant ? getCartQty(resolvedVariant.id) : 0

  const { precioLista, precioTransferencia, precioOferta, precioOfertaTransferencia } =
    calcularPrecios(
      product.base_price,
      cashDiscountPercent,
      product.is_on_sale ?? false,
      product.sale_percent ?? 0
    )

  function isTalleAvailable(talle: string): boolean {
    if (product.is_made_to_order) return true
    if (isMultiDim) return variants.some((v) => parseLabel(v.label)[0] === talle && availableStock(v) > 0)
    return variants.some((v) => v.label === talle && availableStock(v) > 0)
  }

  function openSheet(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSelectedTalle(null)
    setSelectedColor(null)
    setSheetOpen(true)
  }

  function handleSelectTalle(talle: string) {
    setSelectedTalle(talle)
    setSelectedColor(null)
  }

  function handleConfirm() {
    if (!canConfirm) return
    addItem(product, resolvedVariant)
    setSheetOpen(false)
    toast.success('Agregado al carrito')
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.location.href = `/producto/${product.slug}`
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="group relative flex flex-col overflow-hidden rounded-lg bg-white shadow-md/50"
      >
        <Link href={`/producto/${product.slug}`} className="flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
            {!img1Loaded && (
              <div className="absolute inset-0 animate-pulse bg-slate-200" />
            )}
            {product.images?.[0]?.url && (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={isPriority}
                loading={isPriority ? undefined : 'lazy'}
                onLoad={() => setImg1Loaded(true)}
                className={cn(
                  'object-cover transition-all duration-500',
                  // Scale solo en desktop hover
                  'md:group-hover:scale-105'
                )}
              />
            )}

            {/* Segunda imagen: solo en desktop hover */}
            {product.images?.[1]?.url && (
              <Image
                src={product.images[1].url}
                alt={`${product.name} - vista alternativa`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                loading="lazy"
                onLoad={() => setImg2Loaded(true)}
                className={cn(
                  'absolute inset-0 object-cover transition-opacity duration-500 opacity-0',
                  // Solo visible en desktop cuando está cargada
                  img2Loaded && 'md:group-hover:opacity-100'
                )}
              />
            )}

            {/* Badges */}
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

            {/* Action Buttons
                Mobile: siempre visibles (sin opacity-0)
                Desktop: ocultos por defecto, aparecen en hover con transición */}
            <div
              className={cn(
                'absolute bottom-4 left-4 right-4 flex gap-2',
                'md:opacity-0 md:translate-y-2.5 md:transition-all md:duration-200',
                'md:group-hover:opacity-100 md:group-hover:translate-y-0'
              )}
            >
              <Button
                onClick={openSheet}
                className="flex-1 gap-2 bg-slate-900 text-slate-100 hover:bg-slate-800"
                size="sm"
                aria-haspopup="dialog"
              >
                <ShoppingBag className="h-4 w-4" />
                Agregar
              </Button>
              <Button
                onClick={handleQuickView}
                variant="outline"
                size="sm"
                className="border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-2 p-4 pb-5">
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
              {product.category?.name}
            </span>
            <h3 className="font-sans text-base font-medium text-slate-900 leading-snug">
              {product.name}
            </h3>
            <div className="flex flex-col gap-1 pt-1">
              {precioOferta !== null ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-slate-400 line-through">
                    {formatPrice(precioLista)}
                  </span>
                  {(product.sale_percent ?? 0) > 0 && (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1 py-0.5 rounded leading-none">
                      -{product.sale_percent}%
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  {formatPrice(precioLista)}
                </span>
              )}
              {precioOferta !== null && (
                <span className="text-sm font-semibold text-orange-700">
                  {formatPrice(precioOferta)}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold text-emerald-700">
                  {formatPrice(precioOfertaTransferencia ?? precioTransferencia)}
                </span>
                <span className="text-[11px] text-emerald-600">con Transferencia</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>

      {/* Variant selection dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg leading-snug">{product.name}</DialogTitle>
            {product.category?.name && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {product.category.name}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Talle */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-slate-700">Talle</p>
              <div className="flex flex-wrap gap-2">
                {(isMultiDim ? talles : variants.map((v) => v.label)).map((talle) => {
                  const available = isTalleAvailable(talle)
                  const isSelected = selectedTalle === talle
                  return (
                    <button
                      key={talle}
                      onClick={() => handleSelectTalle(talle)}
                      disabled={!available}
                      className={cn(
                        'flex h-10 min-w-[40px] items-center justify-center border px-3.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-700',
                        !available && 'cursor-not-allowed opacity-35 line-through'
                      )}
                    >
                      {talle}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color (solo productos multi-dimensión, siempre visible) */}
            {isMultiDim && (
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-slate-700">Color</p>
                {!selectedTalle ? (
                  <p className="text-xs text-muted-foreground">Primero elegí un talle</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {colorsForTalle.map(({ color, variant }) => {
                      const outOfStock = !product.is_made_to_order && availableStock(variant) <= 0
                      const isSelected = selectedColor === color
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          disabled={outOfStock}
                          className={cn(
                            'flex h-10 min-w-[40px] items-center justify-center border px-3.5 text-sm font-medium transition-all',
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-900 hover:border-slate-700',
                            outOfStock && 'cursor-not-allowed opacity-35 line-through'
                          )}
                        >
                          {color}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {resolvedVariant && !product.is_made_to_order && resolvedAvailable <= 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {resolvedCartQty > 0 && resolvedVariant.stock > 0
                  ? `Ya tenés ${resolvedCartQty} en el carrito — stock agotado`
                  : 'Sin stock disponible'}
              </p>
            )}

            <Button
              onClick={handleConfirm}
              disabled={!canConfirm || (!product.is_made_to_order && resolvedAvailable <= 0)}
              className="w-full gap-2"
              size="lg"
            >
              <ShoppingBag className="h-4 w-4" />
              {canConfirm
                ? !product.is_made_to_order && resolvedAvailable <= 0
                  ? 'Sin stock disponible'
                  : 'Agregar al carrito'
                : !selectedTalle
                  ? 'Elegí un talle'
                  : 'Elegí un color'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
