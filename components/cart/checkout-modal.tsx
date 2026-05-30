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
    name: z.string().min(1, 'Requerido'),
    lastname: z.string().min(1, 'Requerido'),
    phone: z.string().min(6, 'Teléfono inválido'),
    deliveryType: z.enum(['retiro', 'envio']),
    address: z.string().optional(),
  })
  .refine(
    (data) => data.deliveryType !== 'envio' || (data.address && data.address.trim().length > 0),
    { message: 'Ingresá la dirección de entrega', path: ['address'] }
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

  async function onSubmit(data: FormData) {
    if (!items.length) return
    setSubmitting(true)

    const subtotal = getSubtotal()
    const opts = {
      customerName: data.name,
      customerLastname: data.lastname,
      customerPhone: data.phone,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryType === 'envio' ? (data.address ?? null) : null,
      storeAddress,
    }

    try {
      const payload = {
        subtotal,
        total: subtotal,
        customer_name: data.name,
        customer_lastname: data.lastname,
        customer_phone: data.phone,
        delivery_type: data.deliveryType,
        delivery_address: data.deliveryType === 'envio' ? (data.address ?? null) : null,
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
          {/* Nombre y apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-name">Nombre *</Label>
              <Input id="checkout-name" {...register('name')} placeholder="Ana" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-lastname">Apellido *</Label>
              <Input id="checkout-lastname" {...register('lastname')} placeholder="García" />
              {errors.lastname && <p className="text-xs text-destructive">{errors.lastname.message}</p>}
            </div>
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

          {/* Dirección (solo envío) */}
          {deliveryType === 'envio' && (
            <div className="space-y-1.5">
              <Label htmlFor="checkout-address">Dirección de entrega *</Label>
              <Input id="checkout-address" {...register('address')} placeholder="Calle, número, localidad" />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
          )}

          {/* Dirección de local (solo retiro) */}
          {deliveryType === 'retiro' && storeAddress && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              📍 {storeAddress}
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
