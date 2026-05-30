'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/home/hero'
import { AnnouncementBanner } from '@/components/home/announcement-banner'
import { CategoryScroll } from '@/components/home/category-scroll'
import { ProductGrid } from '@/components/home/product-grid'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { fetchProducts } from '@/lib/data'
import type { Product } from '@/lib/types'

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data)
      setIsLoading(false)
    })
  }, [])

  const products = [...allProducts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnnouncementBanner />
        <CategoryScroll />
        <ProductGrid
          products={products}
          title="Últimas novedades"
          isLoading={isLoading}
          skeletonCount={8}
          viewAllHref="/catalogo"
        />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
