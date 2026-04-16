'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductForm } from '@/components/admin/product-form'
import type { Category } from '@/lib/types'

export default function NuevoProductoPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setCategories(json.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold font-serif">Nuevo producto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Completá los datos del producto. Podrás subir imágenes una vez creado.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          Error al cargar categorías: {error}
        </div>
      )}

      {/* Form */}
      {loading ? (
        <FormSkeleton />
      ) : (
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          <ProductForm categories={categories} mode="new" />
        </div>
      )}
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
