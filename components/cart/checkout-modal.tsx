'use client'

import { useState } from 'react'
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
} from '@/components/ui/dialog'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'

const schema = z
  .object({
    fullName: z.string().min(1, 'Requerido'),
    phone: z.string()
      .min(1, 'Requerido')
      .regex(/^\d+$/, 'Solo se permiten números')
      .min(8, 'Mínimo 8 dígitos'),
    deliveryType: z.enum(['retiro', 'envio']),
    paymentMethod: z.enum(['transferencia', 'tarjeta']),
    email: z.string().optional(),
    street: z.string().optional(),
    locality: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .refine(
    (data) => data.deliveryType !== 'envio' || (data.street && data.street.trim().length > 0),
    { message: 'Ingresá la calle y número', path: ['street'] }
  )
  .refine(
    (data) => data.deliveryType !== 'envio' || (data.locality && data.locality.trim().length > 0),
    { message: 'Ingresá la localidad', path: ['locality'] }
  )
  .refine(
    (data) => data.deliveryType !== 'envio' || (data.email && data.email.trim().length > 0),
    { message: 'Requerido para envío', path: ['email'] }
  )
  .refine(
    (data) => {
      if (data.deliveryType !== 'envio') return true
      if (!data.email?.trim()) return true // caught by previous refine
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    },
    { message: 'Email inválido', path: ['email'] }
  )

type FormData = z.infer<typeof schema>

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeAddress?: string | null
  whatsappDigits: string | null
}

export function CheckoutModal({ open, onOpenChange, storeAddress, whatsappDigits }: CheckoutModalProps) {
  const { items, getSubtotal, generateWhatsAppMessage, clearCart, cashDiscountPercent } = useCartStore()
  const [submitting, setSubmitting] = useState(false)

  const subtotal = getSubtotal()
  const totalTransferencia = Math.round(subtotal * (1 - cashDiscountPercent / 100))

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryType: 'retiro', paymentMethod: 'transferencia' },
  })

  const deliveryType = watch('deliveryType')
  const paymentMethod = watch('paymentMethod')
  const totalFinal = paymentMethod === 'transferencia' ? totalTransferencia : subtotal

  function buildDeliveryAddress(data: FormData): string | null {
    if (data.deliveryType !== 'envio') return null
    const parts = [data.street?.trim()]
    if (data.locality?.trim()) parts.push(data.locality.trim())
    if (data.postalCode?.trim()) parts.push(`CP: ${data.postalCode.trim()}`)
    return parts.filter(Boolean).join(', ')
  }

  async function onSubmit(data: FormData) {
    if (!items.length) return
    setSubmitting(true)

    const deliveryAddress = buildDeliveryAddress(data)
    const orderTotal = data.paymentMethod === 'transferencia' ? totalTransferencia : subtotal
    const discountAmount = data.paymentMethod === 'transferencia' ? subtotal - totalTransferencia : 0

    const nameParts = data.fullName.trim().split(/\s+/)
    const customer_name = nameParts[0]
    const customer_lastname = nameParts.slice(1).join(' ') || ''

    const opts = {
      customerName: data.fullName,
      customerLastname: '',
      customerPhone: data.phone,
      deliveryType: data.deliveryType,
      deliveryAddress,
      storeAddress,
      paymentMethod: data.paymentMethod,
      total: orderTotal,
    }

    try {
      const payload = {
        subtotal,
        discount_amount: discountAmount,
        total: orderTotal,
        payment_method: data.paymentMethod,
        customer_name,
        customer_lastname,
        customer_phone: data.phone,
        customer_email: data.deliveryType === 'envio' ? (data.email?.trim() ?? null) : null,
        delivery_type: data.deliveryType,
        delivery_address: deliveryAddress,
        items: items.map((item) => {
          const unitPrice = item.variant?.price_override ?? item.product.base_price
          return {
            product_id: item.product.id,
            variant_id: item.variant?.id ?? null,
            product_name: item.product.name,
            variant_label: item.variant?.label ?? null,
            unit_price: unitPrice,
            quantity: item.quantity,
            subtotal: unitPrice * item.quantity,
            is_made_to_order: item.product.is_made_to_order,
            is_out_of_stock:
              !item.product.is_made_to_order && (item.variant?.stock ?? 1) <= 0,
          }
        }),
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // fail silently — WhatsApp opens regardless
    }

    const message = generateWhatsAppMessage(opts)
    const url = `https://wa.me/${whatsappDigits ?? '5491160245653'}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')

    clearCart()
    reset()
    onOpenChange(false)
    toast.success('Pedido enviado por WhatsApp')
    setSubmitting(false)
  }

  // Reusable field blocks
  const nameField = (
    <div className="space-y-1.5">
      <Label htmlFor="checkout-fullname">Nombre completo *</Label>
      <Input id="checkout-fullname" {...register('fullName')} />
      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
    </div>
  )

  const phoneField = (
    <div className="space-y-1.5">
      <Label htmlFor="checkout-phone">Teléfono *</Label>
      <Input id="checkout-phone" {...register('phone')} type="tel" inputMode="numeric" />
      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
    </div>
  )

  const deliveryTypeField = (
    <div className="space-y-2">
      <Label>Tipo de entrega *</Label>
      <div className="grid grid-cols-2 gap-2">
        <label className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
          deliveryType === 'retiro'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:border-foreground/30'
        }`}>
          <input type="radio" value="retiro" {...register('deliveryType')} className="sr-only" />
          🏪 Retiro en local
        </label>
        <label className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
          deliveryType === 'envio'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:border-foreground/30'
        }`}>
          <input type="radio" value="envio" {...register('deliveryType')} className="sr-only" />
          🚚 Envío a domicilio
        </label>
      </div>
    </div>
  )

  const addressFields = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="checkout-street">Calle y número *</Label>
        <Input id="checkout-street" {...register('street')} />
        {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-locality">Localidad *</Label>
          <Input id="checkout-locality" {...register('locality')} />
          {errors.locality && <p className="text-xs text-destructive">{errors.locality.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkout-postal">Código postal</Label>
          <Input id="checkout-postal" {...register('postalCode')} />
        </div>
      </div>
    </div>
  )

  const emailField = (
    <div className="space-y-1.5">
      <Label htmlFor="checkout-email">Email *</Label>
      <Input id="checkout-email" {...register('email')} type="email" inputMode="email" />
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
    </div>
  )

  const paymentField = (
    <div className="space-y-2">
      <Label>Medio de pago *</Label>
      <div className="flex flex-col gap-2">
        <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
          paymentMethod === 'transferencia'
            ? 'border-primary bg-primary/5'
            : 'border-border text-muted-foreground hover:border-foreground/30'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <input type="radio" value="transferencia" {...register('paymentMethod')} className="sr-only" />
            <span className="text-sm font-medium truncate">Transferencia</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded leading-none shrink-0">
              -{cashDiscountPercent}%
            </span>
          </div>
          <span className="text-sm font-bold text-emerald-700 tabular-nums shrink-0">
            {formatPrice(totalTransferencia)}
          </span>
        </label>
        <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
          paymentMethod === 'tarjeta'
            ? 'border-primary bg-primary/5'
            : 'border-border text-muted-foreground hover:border-foreground/30'
        }`}>
          <div className="flex items-center gap-2">
            <input type="radio" value="tarjeta" {...register('paymentMethod')} className="sr-only" />
            <span className="text-sm font-medium">Tarjeta de crédito/débito</span>
          </div>
          <span className="text-sm font-medium tabular-nums shrink-0">
            {formatPrice(subtotal)}
          </span>
        </label>
      </div>
    </div>
  )

  const totalRow = (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
      <span className="text-sm font-medium">Total a pagar</span>
      <span className={`text-base font-bold tabular-nums ${paymentMethod === 'transferencia' ? 'text-emerald-700' : ''}`}>
        {formatPrice(totalFinal)}
      </span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { reset(); onOpenChange(v) } }}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Realizar pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 overflow-y-auto pr-1">
          {nameField}
          {phoneField}
          {deliveryTypeField}

          {deliveryType === 'envio' ? (
            <>
              {addressFields}
              {emailField}
              {paymentField}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                📍 {storeAddress ?? 'Ontiveros 30, Maquinista Savio, Escobar, Buenos Aires'}
              </p>
              {paymentField}
            </>
          )}

          {totalRow}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => { reset(); onOpenChange(false) }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
