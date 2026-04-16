'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/home/hero'
import { AnnouncementBanner } from '@/components/home/announcement-banner'
import { GenderFilter } from '@/components/home/gender-filter'
import { CategoryScroll } from '@/components/home/category-scroll'
import { ProductGrid } from '@/components/home/product-grid'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { fetchProducts } from '@/lib/data'
import type { Product } from '@/lib/types'

export default function HomePage() {
  const [selectedGender, setSelectedGender] = useState<'mujer' | 'hombre' | 'todo'>('todo')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data)
      setIsLoading(false)
    })
  }, [])

  const products =
    selectedGender === 'todo'
      ? allProducts
      : allProducts.filter(
          (p) => p.gender === selectedGender || p.gender === 'unisex'
        )

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnnouncementBanner />
        <div className="relative">
          <GenderFilter selected={selectedGender} onChange={setSelectedGender} />
          <CategoryScroll />
          <ProductGrid
            products={products}
            title="Productos destacados"
            isLoading={isLoading}
            skeletonCount={8}
          />
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
