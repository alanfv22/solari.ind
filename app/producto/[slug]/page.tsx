'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Truck, Clock } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { ProductGallery } from '@/components/product/product-gallery'
import { VariantSelector } from '@/components/product/variant-selector'
import { QuantitySelector } from '@/components/product/quantity-selector'
import { ProductGrid } from '@/components/home/product-grid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/lib/cart-store'
import { fetchProductBySlug, fetchRelatedProducts, formatPrice } from '@/lib/data'
import { calcularPrecios } from '@/lib/utils'
import type { Product, ProductVariant } from '@/lib/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)

  const { addItem, cashDiscountPercent } = useCartStore()

  useEffect(() => {
    setIsLoading(true)
    fetchProductBySlug(resolvedParams.slug).then((p) => {
      setProduct(p)
      if (p) {
        const firstAvailable =
          p.variants?.find((v) => (!v.type || v.type === 'size') && v.stock > 0) ??
          p.variants?.find((v) => v.stock > 0) ??
          p.variants?.[0] ??
          null
        setSelectedVariant(firstAvailable)
        fetchRelatedProducts(p.gender, p.id).then(setRelatedProducts)
      }
      setIsLoading(false)
    })
  }, [resolvedParams.slug])

  if (!isLoading && !product) {
    notFound()
  }

  const basePrice = selectedVariant?.price_override ?? product?.base_price ?? 0
  const { precioLista, precioTransferencia, precioOferta, precioOfertaTransferencia } =
    calcularPrecios(basePrice, cashDiscountPercent, product?.is_on_sale ?? false, product?.sale_percent ?? 0)
  const selectedOutOfStock = selectedVariant !== null && selectedVariant.stock <= 0
  const canAddToCart = product ? product.is_made_to_order || !selectedOutOfStock : false

  const handleAddToCart = () => {
    if (!product || !canAddToCart) return
    addItem(product, selectedVariant, quantity)
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </div>

        {/* Product Details */}
        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              ) : product ? (
                <ProductGallery
                  images={(product.images ?? []).map((img) => img.url).filter(Boolean) as string[]}
                  productName={product.name}
                />
              ) : null}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              {isLoading ? (
                <>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-12" />)}
                  </div>
                  <Skeleton className="h-12 w-full" />
                </>
              ) : product ? (
                <>
                  {/* Category & Gender */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category?.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.gender === 'mujer' ? 'Mujer' : product.gender === 'hombre' ? 'Hombre' : 'Unisex'}
                    </Badge>
                    {product.is_made_to_order && (
                      <Badge variant="outline" className="gap-1 border-amber-600 text-xs text-amber-700">
                        <Clock className="h-3 w-3" />
                        Por encargo
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="font-serif text-3xl font-medium text-foreground sm:text-4xl text-balance">
                    {product.name}
                  </h1>

                  {/* Price */}
                  <div className="flex flex-col gap-1">
                    {/* Lista tachado */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base text-muted-foreground line-through">
                        {formatPrice(precioLista)}
                      </span>
                      <span className="text-xs text-muted-foreground">lista</span>
                      {product.is_on_sale && (
                        <Badge variant="destructive" className="ml-1">
                          -{product.sale_percent}%
                        </Badge>
                      )}
                    </div>
                    {/* Precio oferta (si aplica) */}
                    {precioOferta !== null && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-semibold text-orange-700">
                          {formatPrice(precioOferta)}
                        </span>
                        <span className="text-xs text-orange-600">oferta</span>
                      </div>
                    )}
                    {/* Precio transferencia (siempre) */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-emerald-700">
                        {formatPrice(precioOfertaTransferencia ?? precioTransferencia)}
                      </span>
                      <span className="text-sm text-emerald-600 font-medium">transferencia / efectivo</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <VariantSelector
                      variants={product.variants}
                      selected={selectedVariant}
                      onChange={setSelectedVariant}
                      type="size"
                    />
                  )}

                  {/* Quantity Selector */}
                  <QuantitySelector
                    quantity={quantity}
                    onChange={setQuantity}
                    max={selectedVariant?.stock ?? 10}
                  />

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    size="lg"
                    className="mt-2 gap-2"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {selectedOutOfStock && !product.is_made_to_order
                      ? 'Sin stock en este talle'
                      : 'Agregar al carrito'}
                  </Button>

                  {/* Made to order notice */}
                  {product.is_made_to_order && (
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <Clock className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">Producto por encargo</p>
                        <p className="text-amber-700">
                          Se confecciona a pedido. Consultá el plazo de entrega por WhatsApp.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shipping Info */}
                  <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-4">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Envíos a todo el país</p>
                      <p className="text-muted-foreground">
                        Consultá el costo por WhatsApp
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* Related Products */}
        {!isLoading && relatedProducts.length > 0 && (
          <div className="border-t border-border py-16">
            <ProductGrid products={relatedProducts} title="Productos relacionados" />
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
