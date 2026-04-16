'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/admin/product-form'
import type { Category, Product } from '@/lib/types'

export default function EditarProductoPage() {
  const params = useParams()
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [productRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/products/${id}`),
        fetch('/api/admin/categories'),
      ])

      const productJson = await productRes.json()
      const categoriesJson = await categoriesRes.json()

      if (!productRes.ok) throw new Error(productJson.error || 'Producto no encontrado')
      if (!categoriesRes.ok) throw new Error(categoriesJson.error || 'Error al cargar categorías')

      setProduct(productJson.data)
      setCategories(categoriesJson.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <EditSkeleton />

  if (error) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!product) return null

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
        <h1 className="text-2xl font-bold font-serif">{product.name}</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant={product.active ? 'default' : 'secondary'}>
            {product.active ? 'Activo' : 'Inactivo'}
          </Badge>
          {product.is_made_to_order && <Badge variant="outline">A pedido</Badge>}
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-6 md:p-8">
        <ProductForm product={product} categories={categories} mode="edit" />
      </div>
    </div>
  )
}

function EditSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
