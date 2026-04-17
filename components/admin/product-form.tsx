'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Shuffle, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceInput } from '@/components/ui/price-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, calcularPrecios } from '@/lib/utils'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'
import type { Category, Product } from '@/lib/types'

// ─── Constantes ──────────────────────────────────────────────────────────────

const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const NUMBER_SIZES = ['36', '38', '40', '42', '44', '46']

// ─── Compresión de imagen (cliente) ──────────────────────────────────────────

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      const MAX = 800
      let { width, height } = img

      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas no disponible'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Error al comprimir')),
        'image/webp',
        0.8
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Error al cargar imagen')) }
    img.src = objectUrl
  })
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Requerido'),
  price_override: z.preprocess((v) => (v === '' || v === null || v === undefined ? null : Number(v)), z.number().nullable()),
  stock: z.coerce.number().min(0, 'Stock ≥ 0'),
  active: z.boolean(),
})

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'Requerido'),
  base_price: z.coerce
    .number({ invalid_type_error: 'Ingresá un precio válido' })
    .min(1, 'El precio debe ser mayor a 0'),
  is_on_sale: z.boolean(),
  sale_percent: z.coerce.number().min(0).max(100),
  category_id: z.string().min(1, 'Seleccioná una categoría'),
  gender: z.enum(['mujer', 'hombre', 'unisex']),
  is_made_to_order: z.boolean(),
  active: z.boolean(),
  variants: z.array(variantSchema).min(1, 'Agregá al menos una variante'),
})

type ProductFormData = z.infer<typeof productSchema>

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductFormProps {
  product?: Product
  categories: Category[]
  mode: 'new' | 'edit'
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const cashDiscountPercent = useCartStore((s) => s.cashDiscountPercent)

  // Estado local para descuentos bidireccionales
  const [transferDiscountPercent, setTransferDiscountPercent] = useState(20)
  const [saleDiscountPercent, setSaleDiscountPercent] = useState(10)

  // Funciones de utilidad para cálculo bidireccional
  const calculateDiscountedPrice = (basePrice: number, percent: number) => {
    return basePrice * (1 - percent / 100)
  }

  const calculatePercentFromPrice = (basePrice: number, discountedPrice: number) => {
    if (basePrice === 0) return 0
    const percent = ((basePrice - discountedPrice) / basePrice) * 100
    return Math.max(0, Math.min(100, Math.round(percent)))
  }

  // Generador de variantes
  const [sizeType, setSizeType] = useState<'letters' | 'numbers'>('letters')
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [hasColors, setHasColors] = useState(() => {
    // In edit mode, detect color variants by checking if any label contains ' - '
    if (product?.variants && product.variants.length > 0) {
      return product.variants.some((v) => v.label.includes(' - '))
    }
    return false
  })
  const [colorsInput, setColorsInput] = useState('')
  // Cuando el usuario usa el generador en modo edición, los existentes quedan obsoletos
  const [variantsRegenerated, setVariantsRegenerated] = useState(false)

  // Imágenes por variante (keyed por índice del fieldArray)
  const [variantImageFiles, setVariantImageFiles] = useState<Record<number, File>>({})
  const [variantPreviews, setVariantPreviews] = useState<Record<number, string>>({})

  // Imágenes existentes del producto (modo edición), ordenadas por sort_order
  const existingImages = (product?.images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, submitCount },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      base_price: product?.base_price ?? 0,
      is_on_sale: product?.is_on_sale ?? false,
      sale_percent: product?.sale_percent ?? 10,
      category_id: product?.category_id ?? '',
      gender: product?.gender ?? 'unisex',
      is_made_to_order: product?.is_made_to_order ?? false,
      active: product?.active ?? true,
      variants:
        product?.variants?.map((v) => ({
          id: v.id,
          label: v.label,
          price_override: v.price_override,
          stock: v.stock,
          active: v.active,
        })) ?? [],
    },
  })

  const { fields, remove, replace } = useFieldArray({ control, name: 'variants' })

  // Valores en tiempo real para el preview de precios
  const watchedBasePrice = watch('base_price')
  const watchedIsOnSale = watch('is_on_sale')
  const watchedSalePercent = watch('sale_percent')
  const previewPrecios = calcularPrecios(
    watchedBasePrice || 0,
    cashDiscountPercent,
    watchedIsOnSale,
    watchedSalePercent || 0
  )

  // ─── Manejo de imágenes por variante ───────────────────────────────────────

  function handleImageSelect(index: number, file: File) {
    // Revocar preview anterior si existe
    if (variantPreviews[index]) URL.revokeObjectURL(variantPreviews[index])
    setVariantImageFiles((prev) => ({ ...prev, [index]: file }))
    setVariantPreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }))
  }

  function handleImageRemove(index: number) {
    if (variantPreviews[index]) URL.revokeObjectURL(variantPreviews[index])
    setVariantImageFiles((prev) => { const n = { ...prev }; delete n[index]; return n })
    setVariantPreviews((prev) => { const n = { ...prev }; delete n[index]; return n })
  }

  // Al eliminar una variante hay que re-indexar el mapa de imágenes
  function handleRemoveVariant(index: number) {
    handleImageRemove(index)

    const newFiles: Record<number, File> = {}
    const newPreviews: Record<number, string> = {}
    Object.entries(variantImageFiles).forEach(([i, file]) => {
      const idx = parseInt(i)
      if (idx === index) return
      newFiles[idx > index ? idx - 1 : idx] = file
    })
    Object.entries(variantPreviews).forEach(([i, url]) => {
      const idx = parseInt(i)
      if (idx === index) return
      newPreviews[idx > index ? idx - 1 : idx] = url
    })
    setVariantImageFiles(newFiles)
    setVariantPreviews(newPreviews)
    remove(index)
  }

  // ─── Generador de variantes ────────────────────────────────────────────────

  function handleSizeTypeChange(type: 'letters' | 'numbers') {
    setSizeType(type)
    setSelectedSizes([])
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    )
  }

  function handleGenerate() {
    if (selectedSizes.length === 0) { toast.warning('Seleccioná al menos un talle'); return }

    const ordered = (sizeType === 'letters' ? LETTER_SIZES : NUMBER_SIZES).filter((s) =>
      selectedSizes.includes(s)
    )
    const colors = hasColors
      ? colorsInput.split(',').map((c) => c.trim()).filter(Boolean)
      : []

    type NewVariant = { label: string; price_override: null; stock: number; active: boolean }
    const newVariants: NewVariant[] = []

    if (colors.length === 0) {
      ordered.forEach((size) => newVariants.push({ label: size, price_override: null, stock: 0, active: true }))
    } else {
      ordered.forEach((size) =>
        colors.forEach((color) =>
          newVariants.push({ label: `${size} - ${color}`, price_override: null, stock: 0, active: true })
        )
      )
    }

    // Limpiar todas las imágenes (las variantes cambiaron completamente)
    Object.values(variantPreviews).forEach((url) => URL.revokeObjectURL(url))
    setVariantImageFiles({})
    setVariantPreviews({})
    setVariantsRegenerated(true)

    replace(newVariants)
    toast.success(`${newVariants.length} variante${newVariants.length !== 1 ? 's' : ''} generada${newVariants.length !== 1 ? 's' : ''}`)
  }

  const colorCount = hasColors ? colorsInput.split(',').map((c) => c.trim()).filter(Boolean).length : 0
  const previewCount = selectedSizes.length > 0
    ? colorCount > 0 ? selectedSizes.length * colorCount : selectedSizes.length
    : 0

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(data: ProductFormData) {
    setSaving(true)
    try {
      // 1. Crear o actualizar producto
      const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${product!.id}`
      const res = await fetch(url, {
        method: mode === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar producto')

      const productId: string = mode === 'new' ? json.data.id : product!.id
      const hasNewImages = Object.keys(variantImageFiles).length > 0

      if (hasNewImages || (mode === 'edit' && variantsRegenerated)) {
        // 2. En modo edición: eliminar imágenes antiguas que serán reemplazadas
        if (mode === 'edit' && existingImages.length > 0) {
          const toDelete = variantsRegenerated
            ? existingImages // regenerado → borrar todas
            : existingImages.filter((_, i) => variantImageFiles[i] !== undefined)

          await Promise.all(
            toDelete.map((img) =>
              fetch(`/api/admin/images/${img.id}`, { method: 'DELETE' })
            )
          )
        }

        // 3. Subir nuevas imágenes en orden de variante
        let isPrimary = true // primera imagen = principal
        for (let i = 0; i < data.variants.length; i++) {
          const file = variantImageFiles[i]
          if (!file) continue

          try {
            const compressed = await compressImage(file)
            const formData = new FormData()
            formData.append('file', compressed, 'image.webp')
            formData.append('productId', productId)
            formData.append('isPrimary', isPrimary ? 'true' : 'false')

            const imgRes = await fetch('/api/admin/images/upload', { method: 'POST', body: formData })
            if (!imgRes.ok) {
              const imgJson = await imgRes.json()
              toast.error(`Error en imagen "${data.variants[i].label}": ${imgJson.error}`)
            } else {
              isPrimary = false
            }
          } catch {
            toast.error(`No se pudo comprimir la imagen de "${data.variants[i].label}"`)
          }
        }
      }

      toast.success(mode === 'new' ? 'Producto creado' : 'Producto actualizado')
      router.push(mode === 'new' ? `/admin/productos/${productId}` : '/admin/productos')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Información básica ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Información básica
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register('name')} placeholder="Remera Essential" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción *</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descripción del producto..."
            rows={3}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="base_price">Precio lista (ARS) *</Label>
            <Controller
              name="base_price"
              control={control}
              render={({ field }) => (
                <PriceInput
                  id="base_price"
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? 0)}
                  onBlur={field.onBlur}
                  placeholder="25.000,00"
                />
              )}
            />
            {errors.base_price && (
              <p className="text-xs text-destructive">{errors.base_price.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Categoría *</Label>
            <Select
              defaultValue={product?.category_id ?? ''}
              onValueChange={(v) => setValue('category_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Género *</Label>
            <Select
              defaultValue={product?.gender ?? 'unisex'}
              onValueChange={(v) => setValue('gender', v as 'mujer' | 'hombre' | 'unisex')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mujer">Mujer</SelectItem>
                <SelectItem value="hombre">Hombre</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Descuentos - Transferencia y Oferta */}
        <div className="space-y-4">
          {/* Transferencia */}
          <div className="flex items-center gap-4">
            <div className="w-24 space-y-1.5">
              <Label>% Desc</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={transferDiscountPercent}
                onChange={(e) => setTransferDiscountPercent(Number(e.target.value))}
                placeholder="20"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Precio Transferencia</Label>
              <Input
                value={watchedBasePrice ? formatPrice(calculateDiscountedPrice(watchedBasePrice, transferDiscountPercent)) : ''}
                readOnly
                className="bg-muted"
                placeholder="20.000,00"
              />
            </div>
          </div>

          {/* Oferta */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="is_on_sale"
                defaultChecked={product?.is_on_sale ?? false}
                onCheckedChange={(v) => setValue('is_on_sale', v)}
              />
              <Label htmlFor="is_on_sale" className="cursor-pointer">En oferta</Label>
            </div>
            {watchedIsOnSale && (
              <>
                <div className="w-24 space-y-1.5">
                  <Label>% Desc</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={saleDiscountPercent}
                    onChange={(e) => setSaleDiscountPercent(Number(e.target.value))}
                    placeholder="10"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label>Precio Oferta</Label>
                  <Input
                    value={watchedBasePrice ? formatPrice(calculateDiscountedPrice(watchedBasePrice, saleDiscountPercent)) : ''}
                    readOnly
                    className="bg-muted"
                    placeholder="20.000,00"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview de precios en tiempo real */}
        {(watchedBasePrice || 0) > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview de precios
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Precio lista</span>
                <span className="font-medium text-slate-500">
                  {formatPrice(previewPrecios.precioLista)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Transferencia ({transferDiscountPercent}%)</span>
                <span className="font-semibold text-emerald-700">
                  {formatPrice(calculateDiscountedPrice(watchedBasePrice || 0, transferDiscountPercent))}
                </span>
              </div>
              {watchedIsOnSale && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Oferta ({saleDiscountPercent}% descuento)</span>
                    <span className="font-medium text-orange-700">
                      {formatPrice(calculateDiscountedPrice(watchedBasePrice || 0, saleDiscountPercent))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Oferta + transferencia</span>
                    <span className="font-bold text-emerald-700">
                      {formatPrice(calculateDiscountedPrice(calculateDiscountedPrice(watchedBasePrice || 0, saleDiscountPercent), transferDiscountPercent))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6 pt-1">
          <div className="flex items-center gap-3">
            <Switch
              id="is_made_to_order"
              defaultChecked={product?.is_made_to_order ?? false}
              onCheckedChange={(v) => setValue('is_made_to_order', v)}
            />
            <Label htmlFor="is_made_to_order" className="cursor-pointer">A pedido</Label>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Variantes ──────────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Variantes
        </h2>

        {/* Toggle LETRAS / NÚMEROS */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo de talle</Label>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
            {(['letters', 'numbers'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleSizeTypeChange(type)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  sizeType === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type === 'letters' ? 'LETRAS' : 'NÚMEROS'}
              </button>
            ))}
          </div>
        </div>

        {/* Pills de talles */}
        <div className="flex flex-wrap gap-2">
          {(sizeType === 'letters' ? LETTER_SIZES : NUMBER_SIZES).map((size) => {
            const active = selectedSizes.includes(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  'h-9 min-w-[44px] px-3 rounded-md text-sm font-medium border transition-all',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary/60 hover:bg-accent'
                )}
              >
                {size}
              </button>
            )
          })}
        </div>

        {/* Toggle colores */}
        <div className="flex items-center gap-3">
          <Switch
            id="has_colors"
            checked={hasColors}
            onCheckedChange={(v) => {
              setHasColors(v)
              if (!v) {
                setColorsInput('')
                // Clear all pending image files when removing colors
                Object.values(variantPreviews).forEach((url) => URL.revokeObjectURL(url))
                setVariantImageFiles({})
                setVariantPreviews({})
              }
            }}
          />
          <Label htmlFor="has_colors" className="cursor-pointer">¿Tiene colores?</Label>
        </div>

        {hasColors && (
          <div className="space-y-1.5">
            <Label htmlFor="colors_input" className="text-sm">
              Colores{' '}
              <span className="text-muted-foreground font-normal">(separados por coma)</span>
            </Label>
            <Input
              id="colors_input"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Negro, Blanco, Rosa palo"
            />
          </div>
        )}

        {/* Botón generar */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={selectedSizes.length === 0}
            className="gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Generar variantes
            {previewCount > 0 && (
              <Badge variant="secondary" className="ml-1 tabular-nums">{previewCount}</Badge>
            )}
          </Button>
          {fields.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Se reemplazarán las {fields.length} variante{fields.length !== 1 ? 's' : ''} actuales
            </span>
          )}
        </div>

        {/* Tabla de variantes */}
        {fields.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Variante
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-32">
                      Stock *
                    </th>
                    {hasColors && (
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-20">
                        Imagen
                      </th>
                    )}
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((field, index) => {
                    // URL a mostrar: preview nueva > imagen existente (si no se regeneró)
                    const displayUrl =
                      variantPreviews[index] ??
                      (!variantsRegenerated ? existingImages[index]?.url : undefined)
                    const isNew = !!variantPreviews[index]

                    return (
                      <tr key={field.id} className="hover:bg-muted/20 transition-colors">
                        {/* Label */}
                        <td className="px-4 py-2.5 font-medium">{field.label}</td>

                        {/* Stock */}
                        <td className="px-4 py-2.5">
                          <Input
                            {...register(`variants.${index}.stock`)}
                            type="number"
                            min="0"
                            className="h-8 w-24 text-sm"
                          />
                          {errors.variants?.[index]?.stock && (
                            <p className="text-xs text-destructive mt-0.5">
                              {errors.variants[index]?.stock?.message}
                            </p>
                          )}
                        </td>


                        {/* Imagen — only for color variants */}
                        {hasColors && (
                          <td className="px-4 py-2.5">
                            <div className="flex justify-center">
                              {displayUrl ? (
                                <div className="relative group/img">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={displayUrl}
                                    alt={field.label}
                                    className="h-10 w-10 rounded object-cover border border-border"
                                  />
                                  {/* Botón quitar — solo para selecciones nuevas */}
                                  {isNew && (
                                    <button
                                      type="button"
                                      onClick={() => handleImageRemove(index)}
                                      className="absolute -top-1.5 -right-1.5 hidden group-hover/img:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                                      title="Quitar imagen"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                  {/* Badge si es imagen existente (no nueva) */}
                                  {!isNew && (
                                    <label
                                      className="absolute -top-1.5 -right-1.5 hidden group-hover/img:flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                                      title="Reemplazar imagen"
                                    >
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0]
                                          if (f) handleImageSelect(index, f)
                                          e.target.value = ''
                                        }}
                                      />
                                      <ImagePlus className="h-2.5 w-2.5" />
                                    </label>
                                  )}
                                </div>
                              ) : (
                                <label
                                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-dashed border-border hover:border-primary/60 hover:bg-accent transition-colors"
                                  title="Subir imagen"
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0]
                                      if (f) handleImageSelect(index, f)
                                      e.target.value = ''
                                    }}
                                  />
                                  <ImagePlus className="h-4 w-4 text-muted-foreground" />
                                </label>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Eliminar variante */}
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveVariant(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'rounded-lg border border-dashed p-6 text-center transition-colors',
              submitCount > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-border'
            )}
          >
            <p className={cn('text-sm', submitCount > 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {submitCount > 0
                ? 'Agregá al menos una variante antes de guardar'
                : 'Seleccioná talles y hacé clic en Generar variantes'}
            </p>
          </div>
        )}
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving || fields.length === 0}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === 'new' ? 'Crear producto' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/productos')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
