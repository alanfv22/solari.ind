'use client'

import { useRef, useState, DragEvent } from 'react'
import { Upload, Trash2, Star, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ProductImage } from '@/lib/types'

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      const maxSize = 800
      let { width, height } = img

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No se pudo obtener contexto 2D'))
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Error al comprimir imagen'))
        },
        'image/webp',
        0.8
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Error al cargar imagen'))
    }

    img.src = objectUrl
  })
}

export function ImageUploader({ productId, images, onImagesChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return
    setUploading(true)

    let current = [...images]
    for (const file of fileArray) {
      try {
        const compressed = await compressImage(file)
        const formData = new FormData()
        formData.append('file', compressed, 'image.webp')
        formData.append('productId', productId)

        const res = await fetch('/api/admin/images/upload', {
          method: 'POST',
          body: formData,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al subir imagen')

        current = [...current, json.data]
        onImagesChange(current)
        toast.success('Imagen subida')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (!uploading) uploadFiles(e.dataTransfer.files)
  }

  async function handleDelete(image: ProductImage) {
    setDeletingId(image.id)
    try {
      const res = await fetch(`/api/admin/images/${image.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      onImagesChange(images.filter((img) => img.id !== image.id))
      toast.success('Imagen eliminada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar imagen')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetPrimary(image: ProductImage) {
    try {
      const res = await fetch(`/api/admin/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary: true }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      onImagesChange(images.map((img) => ({ ...img, is_primary: img.id === image.id })))
      toast.success('Imagen principal actualizada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar imagen')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors select-none',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {uploading
              ? 'Subiendo imágenes...'
              : isDragging
              ? 'Soltá las imágenes aquí'
              : 'Arrastrá imágenes o hacé clic para seleccionar'}
          </p>
          <p className="text-xs text-muted-foreground">
            Se comprimen a 800px máx · WebP 80% · Múltiples archivos
          </p>
        </div>
      </div>

      {/* Images grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted"
              >
                {image.url && (
                  <Image src={image.url} alt="Producto" fill className="object-cover" unoptimized />
                )}

                {image.is_primary && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                    Principal
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                  {!image.is_primary && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(image) }}
                      title="Establecer como principal"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleDelete(image) }}
                    disabled={deletingId === image.id}
                    title="Eliminar imagen"
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sin imágenes. Subí la primera imagen del producto.
        </p>
      )}
    </div>
  )
}
