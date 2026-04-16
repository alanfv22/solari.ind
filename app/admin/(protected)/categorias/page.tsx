'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { CategoryDialog } from '@/components/admin/category-dialog'
import type { Category } from '@/lib/types'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCategories(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function openNew() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setDialogOpen(true)
  }

  function handleSaved(saved: Category) {
    setCategories((prev) => {
      const existing = prev.find((c) => c.id === saved.id)
      if (existing) return prev.map((c) => (c.id === saved.id ? saved : c))
      return [...prev, saved]
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast.success('Categoría eliminada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Categorías</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '...' : `${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva categoría
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <CategoriesSkeleton />
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No hay categorías aún.</p>
          <Button className="mt-4" variant="outline" onClick={openNew}>
            Crear la primera
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Slug
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Orden
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Ícono
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 text-muted-foreground">
                    <GripVertical className="h-4 w-4 opacity-40 group-hover:opacity-70" />
                  </td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Badge variant="secondary" className="tabular-nums">
                      {cat.sort_order}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {cat.icon_url ? (
                      <a
                        href={cat.icon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline-offset-2 hover:underline truncate max-w-[160px] block"
                      >
                        {cat.icon_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editTarget}
        onSaved={handleSaved}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.name}</strong>. Los productos que tengan esta
              categoría asignada quedarán sin categoría. Esta acción no se puede deshacer.
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

function CategoriesSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-6 w-8 hidden sm:block ml-auto" />
          <div className="flex gap-1 ml-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
