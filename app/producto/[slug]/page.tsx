'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Truck } from 'lucide-react'
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
import { useCartStore } from '@/lib/cart-store'
import { getProductBySlug, products, formatPrice } from '@/lib/mock-data'
import type { ProductVariant } from '@/lib/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = use(params)
  const product = getProductBySlug(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartStore()

  const price = selectedVariant?.price_override ?? product.base_price
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > price

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity)
  }

  // Get related products (same gender, different product)
  const relatedProducts = products
    .filter((p) => p.gender === product.gender && p.id !== product.id)
    .slice(0, 4)

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
              <ProductGallery images={product.images} productName={product.name} />
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              {/* Category & Gender */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {product.category?.name}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {product.gender === 'mujer' ? 'Mujer' : product.gender === 'hombre' ? 'Hombre' : 'Unisex'}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl font-medium text-foreground sm:text-4xl text-balance">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-foreground">
                  {formatPrice(price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price!)}
                    </span>
                    <Badge variant="destructive">
                      -{Math.round((1 - price / product.compare_at_price!) * 100)}%
                    </Badge>
                  </>
                )}
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
                size="lg"
                className="mt-2 gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Agregar al carrito
              </Button>

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
            </motion.div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
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
