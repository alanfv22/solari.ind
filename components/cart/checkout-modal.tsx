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

const schema = z
  .object({
    fullName: z.string().min(1, 'Requerido'),
    phone: z.string().min(6, 'Teléfono inválido'),
    deliveryType: z.enum(['retiro', 'envio']),
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

type FormData = z.infer<typeof schema>

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeAddress?: string | null
  whatsappDigits: string | null
}

export function CheckoutModal({ open, onOpenChange, storeAddress, whatsappDigits }: CheckoutModalProps) {
  const { items, getSubtotal, generateWhatsAppMessage, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { deliveryType: 'retiro' },
  })

  const deliveryType = watch('deliveryType')

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

    const subtotal = getSubtotal()
    const deliveryAddress = buildDeliveryAddress(data)

    // Split fullName into name + lastname for storage
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
    }

    try {
      const payload = {
        subtotal,
        total: subtotal,
        customer_name,
        customer_lastname,
        customer_phone: data.phone,
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
    const url = `https://wa.me/${whatsappDigits ?? ''}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')

    clearCart()
    reset()
    onOpenChange(false)
    toast.success('Pedido enviado por WhatsApp')
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { reset(); onOpenChange(v) } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Nombre completo */}
          <div className="space-y-1.5">
            <Label htmlFor="checkout-fullname">Nombre completo *</Label>
            <Input id="checkout-fullname" {...register('fullName')} placeholder="Ana García" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone">Teléfono *</Label>
            <Input id="checkout-phone" {...register('phone')} placeholder="+54 9 11 1234-5678" type="tel" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          {/* Tipo de entrega */}
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

          {/* Dirección desglosada (solo envío) */}
          {deliveryType === 'envio' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-street">Calle y número *</Label>
                <Input id="checkout-street" {...register('street')} placeholder="Lavalle 2078" />
                {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-locality">Localidad *</Label>
                  <Input id="checkout-locality" {...register('locality')} placeholder="Maquinista Savio" />
                  {errors.locality && <p className="text-xs text-destructive">{errors.locality.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-postal">Código postal</Label>
                  <Input id="checkout-postal" {...register('postalCode')} placeholder="1620" />
                </div>
              </div>
            </div>
          )}

          {/* Dirección de local (solo retiro) */}
          {deliveryType === 'retiro' && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              📍 {storeAddress ?? 'Ontiveros 30, Maquinista Savio, Escobar, Buenos Aires'}
            </p>
          )}

          <div className="flex gap-2 pt-2">
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
