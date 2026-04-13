'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { products, categories } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type GenderFilter = 'todo' | 'mujer' | 'hombre'
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

export default function CatalogoPage() {
  const [selectedGender, setSelectedGender] = useState<GenderFilter>('todo')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Gender filter
    if (selectedGender !== 'todo') {
      filtered = filtered.filter(
        (p) => p.gender === selectedGender || p.gender === 'unisex'
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.base_price - b.base_price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.base_price - a.base_price)
        break
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      default:
        filtered.sort((a, b) => a.sort_order - b.sort_order)
    }

    return filtered
  }, [selectedGender, selectedCategory, sortBy])

  const activeFiltersCount = [
    selectedGender !== 'todo',
    selectedCategory !== null,
  ].filter(Boolean).length

  const clearFilters = () => {
    setSelectedGender('todo')
    setSelectedCategory(null)
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-4xl font-medium text-foreground sm:text-5xl">
              Catálogo
            </h1>
            <p className="mt-2 text-muted-foreground">
              Explorá toda nuestra colección de moda premium
            </p>
          </motion.div>
        </div>

        {/* Filters Bar */}
        <div className="sticky top-[72px] z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-center justify-between gap-4 py-4">
              {/* Gender Pills - Desktop */}
              <div className="hidden items-center gap-1 rounded-full border border-border bg-background p-1 sm:flex">
                {(['todo', 'mujer', 'hombre'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setSelectedGender(gender)}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      selectedGender === gender
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {selectedGender === gender && (
                      <motion.span
                        layoutId="catalog-gender-filter"
                        className="absolute inset-0 rounded-full bg-primary"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10 capitalize">
                      {gender === 'todo' ? 'Todo' : gender === 'mujer' ? 'Mujer' : 'Hombre'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filters Button - Mobile & Desktop */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 sm:ml-auto">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-background">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-6">
                    {/* Gender - Mobile */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <span className="text-sm font-medium text-foreground">Género</span>
                      <div className="flex flex-wrap gap-2">
                        {(['todo', 'mujer', 'hombre'] as const).map((gender) => (
                          <button
                            key={gender}
                            onClick={() => setSelectedGender(gender)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                              selectedGender === gender
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:border-primary'
                            )}
                          >
                            {gender === 'todo' ? 'Todo' : gender === 'mujer' ? 'Mujer' : 'Hombre'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-medium text-foreground">Categoría</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                            selectedCategory === null
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:border-primary'
                          )}
                        >
                          Todas
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                              selectedCategory === cat.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:border-primary'
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-medium text-foreground">Ordenar por</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'featured' as const, label: 'Destacados' },
                          { value: 'price-asc' as const, label: 'Menor precio' },
                          { value: 'price-desc' as const, label: 'Mayor precio' },
                          { value: 'newest' as const, label: 'Más nuevos' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                              sortBy === option.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:border-primary'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearFilters}>
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Results Count */}
              <span className="text-sm text-muted-foreground">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory || selectedGender !== 'todo') && (
          <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {selectedGender !== 'todo' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 capitalize hover:bg-secondary/80"
                  onClick={() => setSelectedGender('todo')}
                >
                  {selectedGender === 'mujer' ? 'Mujer' : 'Hombre'}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 hover:bg-secondary/80"
                  onClick={() => setSelectedCategory(null)}
                >
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Limpiar todo
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-muted-foreground">
                No encontramos productos con estos filtros.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
