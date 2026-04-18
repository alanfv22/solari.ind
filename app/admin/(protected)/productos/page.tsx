'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatPrice } from '@/lib/data'
import type { Product } from '@/lib/types'

type ProductRow = Pick<
  Product,
  'id' | 'name' | 'base_price' | 'active' | 'is_on_sale' | 'gender' | 'is_made_to_order' | 'created_at'
> & {
  category: { name: string } | null
  images: { url: string; is_primary: boolean }[]
  variants: { id: string }[]
}

export default function ProductosPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [togglingOnSaleId, setTogglingOnSaleId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchCategory, setSearchCategory] = useState('__all__')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setProducts(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  async function handleToggleActive(product: ProductRow) {
    setTogglingId(product.id)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
      )
      toast.success(product.active ? 'Producto desactivado' : 'Producto activado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleOnSale(product: ProductRow) {
    setTogglingOnSaleId(product.id)
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_on_sale: !product.is_on_sale }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_on_sale: !p.is_on_sale } : p))
      )
      toast.success(product.is_on_sale ? 'Quitado de oferta' : 'Puesto en oferta')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setTogglingOnSaleId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Producto eliminado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Categorías únicas para el dropdown
  const uniqueCategories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category!.name, p.category!.name])
    ).values()
  ).sort()

  // Filtrado en memoria
  const filtered = products.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchName.toLowerCase())
    const matchesCategory = searchCategory === '__all__' || p.category?.name === searchCategory
    return matchesName && matchesCategory
  })

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '...' : `${filtered.length} de ${products.length} producto${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      {!loading && products.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Buscar por nombre..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="max-w-xs"
          />
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las categorías</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <ProductsSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No hay productos aún.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/admin/productos/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">No se encontraron productos con esos filtros.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12">
                    Img
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Género
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Precio
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Variantes
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Activo
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Oferta
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                          {primaryImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryImage.url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{product.name}</span>
                          {product.is_made_to_order && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              A pedido
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {product.category?.name ?? '—'}
                      </td>

                      {/* Gender */}
                      <td className="px-4 py-3 text-muted-foreground capitalize hidden md:table-cell">
                        {product.gender}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell">
                        {formatPrice(product.base_price)}
                      </td>

                      {/* Variants count */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <Badge variant="secondary" className="tabular-nums">
                          {product.variants?.length ?? 0}
                        </Badge>
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(product)}
                          disabled={togglingId === product.id}
                          className="inline-flex items-center justify-center disabled:opacity-50"
                          title={product.active ? 'Desactivar' : 'Activar'}
                        >
                          {togglingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : product.active ? (
                            <ToggleRight className="h-5 w-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </td>

                      {/* On sale toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleOnSale(product)}
                          disabled={togglingOnSaleId === product.id}
                          className="inline-flex items-center justify-center disabled:opacity-50"
                          title={product.is_on_sale ? 'Quitar oferta' : 'Poner en oferta'}
                        >
                          {togglingOnSaleId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : product.is_on_sale ? (
                            <ToggleRight className="h-5 w-5 text-orange-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                            <Link href={`/admin/productos/${product.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.name}</strong>. Esta acción no se puede
              deshacer. Se eliminarán también todas sus variantes e imágenes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductsSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
          <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-20 hidden sm:block" />
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-6 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
