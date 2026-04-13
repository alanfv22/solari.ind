'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/home/hero'
import { AnnouncementBanner } from '@/components/home/announcement-banner'
import { GenderFilter } from '@/components/home/gender-filter'
import { CategoryScroll } from '@/components/home/category-scroll'
import { ProductGrid } from '@/components/home/product-grid'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { getProductsByGender } from '@/lib/mock-data'

export default function HomePage() {
  const [selectedGender, setSelectedGender] = useState<'mujer' | 'hombre' | 'todo'>('todo')
  const products = getProductsByGender(selectedGender)

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnnouncementBanner />
        <div className="relative">
          <GenderFilter selected={selectedGender} onChange={setSelectedGender} />
          <CategoryScroll />
          <ProductGrid products={products} title="Productos destacados" />
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
