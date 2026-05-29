'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { ProductCard } from '@/components/product/product-card'
import { ProductCardSkeleton } from '@/components/product/product-card-skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { fetchProductsPaginated, fetchCategories } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { Product, Category } from '@/lib/types'
import { Suspense } from 'react'

type GenderFilter = 'todo' | 'mujer' | 'hombre'
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest'

function CatalogoContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedGender, setSelectedGender] = useState<GenderFilter>('todo')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const PAGE_SIZE = 12

  // Cargar categorías una vez y resolver parámetro de URL
  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats)
      const categoriaParam = searchParams.get('categoria')
      if (categoriaParam) {
        const match = cats.find((c: Category) => c.slug === categoriaParam)
        if (match) setSelectedCategory(match.id)
      }
    })
  }, [searchParams])

  // Fetch server-side al cambiar filtros o página
  useEffect(() => {
    setIsLoading(true)
    fetchProductsPaginated({
      gender: selectedGender !== 'todo' ? selectedGender : undefined,
      categoryId: selectedCategory ?? undefined,
      sortBy,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }).then(({ products: data, total: count }) => {
      setProducts(data)
      setTotal(count)
      setIsLoading(false)
    })
  }, [selectedGender, selectedCategory, sortBy, currentPage])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    if (!isLoading) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [currentPage, isLoading])

  function goToPage(page: number) {
    setCurrentPage(page)
  }

  function handleGenderChange(gender: GenderFilter) {
    setSelectedGender(gender)
    setCurrentPage(1)
  }

  function handleCategoryChange(categoryId: string | null) {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  function handleSortChange(sort: SortOption) {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    selectedGender !== 'todo',
    selectedCategory !== null,
  ].filter(Boolean).length

  const clearFilters = () => {
    setSelectedGender('todo')
    setSelectedCategory(null)
    setCurrentPage(1)
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
                    onClick={() => handleGenderChange(gender)}
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

              {/* Filters Button */}
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
                <SheetContent className="bg-background flex flex-col">
                  <SheetHeader className="shrink-0">
                    <SheetTitle className="text-foreground">Filtros</SheetTitle>
                  </SheetHeader>

                  {/* Scrollable content */}
                  <div className="mt-6 flex-1 overflow-y-auto flex flex-col gap-6 pb-2">
                    {/* Gender - Mobile */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      <span className="text-sm font-medium text-foreground">Género</span>
                      <div className="flex flex-wrap gap-2">
                        {(['todo', 'mujer', 'hombre'] as const).map((gender) => (
                          <button
                            key={gender}
                            onClick={() => handleGenderChange(gender)}
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

                    {/* Categories — select desplegable */}
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">Categoría</span>
                      <select
                        value={selectedCategory ?? ''}
                        onChange={(e) => handleCategoryChange(e.target.value || null)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-medium text-foreground">Ordenar por</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'price-asc' as const, label: 'Menor precio' },
                          { value: 'price-desc' as const, label: 'Mayor precio' },
                          { value: 'newest' as const, label: 'Más nuevos' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
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
                  </div>

                  {/* Sticky footer — siempre visible */}
                  <div className="shrink-0 border-t border-border bg-background pt-4 pb-2">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={activeFiltersCount === 0}
                      className="w-full"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Results Count */}
              {!isLoading && (
                <span className="text-sm text-muted-foreground">
                  {total} producto{total !== 1 ? 's' : ''}
                </span>
              )}
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
                  onClick={() => handleGenderChange('todo')}
                >
                  {selectedGender === 'mujer' ? 'Mujer' : 'Hombre'}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer gap-1 hover:bg-secondary/80"
                  onClick={() => handleCategoryChange(null)}
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
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-muted-foreground">
                No encontramos productos con estos filtros.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CatalogoContent />
    </Suspense>
  )
}
