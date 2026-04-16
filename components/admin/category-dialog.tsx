'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Category } from '@/lib/types'

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  slug: z.string().min(1, 'Requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  icon_url: z.string().url('URL inválida').or(z.literal('')).optional(),
})

type FormData = z.infer<typeof schema>

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSaved: (category: Category) => void
}

export function CategoryDialog({ open, onOpenChange, category, onSaved }: CategoryDialogProps) {
  const [saving, setSaving] = useState(false)
  const isEdit = !!category

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        icon_url: category?.icon_url ?? '',
      })
    }
  }, [open, category, reset])

  const name = watch('name')
  useEffect(() => {
    if (!isEdit && name) setValue('slug', toSlug(name))
  }, [name, isEdit, setValue])

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/categories/${category!.id}` : '/api/admin/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, slug: data.slug, icon_url: data.icon_url || null }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar categoría')

      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada')
      onSaved(json.data)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nombre *</Label>
            <Input id="cat-name" {...register('name')} placeholder="Remeras" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input id="cat-slug" {...register('slug')} placeholder="remeras" />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-icon">URL del ícono (opcional)</Label>
            <Input id="cat-icon" {...register('icon_url')} placeholder="https://..." type="url" />
            {errors.icon_url && (
              <p className="text-xs text-destructive">{errors.icon_url.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
