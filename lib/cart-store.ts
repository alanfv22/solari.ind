'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductVariant } from './types'
import { formatPrice } from './data'


function normalizeWhatsAppDigits(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

interface CartStore {
  items: CartItem[]
  /** Dígitos para wa.me; se actualiza desde Supabase en el cliente. */
  whatsappDigits: string | null
  setWhatsappDigits: (digits: string | null) => void
  /** Dirección física del local, traída desde stores. */
  storeAddress: string | null
  setStoreAddress: (address: string | null) => void
  /** Descuento por pago en efectivo/transferencia, traído desde stores. */
  cashDiscountPercent: number
  setCashDiscountPercent: (percent: number) => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (product: Product, variant: ProductVariant | null, quantity?: number) => void
  removeItem: (productId: string, variantId: string | null) => void
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  generateWhatsAppMessage: (opts?: {
    customerName: string
    customerLastname: string
    customerPhone: string
    deliveryType: 'retiro' | 'envio'
    deliveryAddress: string | null
    storeAddress?: string | null
    paymentMethod?: 'transferencia' | 'tarjeta'
    total?: number
  }) => string
  getWhatsAppUrl: (opts?: {
    customerName: string
    customerLastname: string
    customerPhone: string
    deliveryType: 'retiro' | 'envio'
    deliveryAddress: string | null
    storeAddress?: string | null
    paymentMethod?: 'transferencia' | 'tarjeta'
    total?: number
  }) => string
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      whatsappDigits: null,
      setWhatsappDigits: (digits) => set({ whatsappDigits: digits }),
      storeAddress: null,
      setStoreAddress: (address) => set({ storeAddress: address }),
      cashDiscountPercent: 20,
      setCashDiscountPercent: (percent) => set({ cashDiscountPercent: percent }),

      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              (item.variant?.id ?? null) === (variant?.id ?? null)
          )

          if (existingIndex > -1) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += quantity
            return { items: newItems, isOpen: true }
          }

          return {
            items: [...state.items, { product, variant, quantity }],
            isOpen: true,
          }
        })
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId &&
                (item.variant?.id ?? null) === variantId)
          ),
        }))
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }

        // Clamp to available stock for non-made-to-order products
        const existingItem = get().items.find(
          (i) => i.product.id === productId && (i.variant?.id ?? null) === variantId
        )
        if (existingItem && !existingItem.product.is_made_to_order) {
          const maxStock = existingItem.variant?.stock ?? 1
          quantity = Math.min(quantity, maxStock)
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            (item.variant?.id ?? null) === variantId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.variant?.price_override ?? item.product.base_price
          return total + price * item.quantity
        }, 0)
      },

      generateWhatsAppMessage: (opts) => {
        const { items } = get()
        if (items.length === 0) return ''

        const inStock     = items.filter(i => !i.product.is_made_to_order && (i.variant?.stock ?? 1) > 0)
        const outOfStock  = items.filter(i => !i.product.is_made_to_order && (i.variant?.stock ?? 1) <= 0)
        const madeToOrder = items.filter(i => i.product.is_made_to_order)

        let message = 'Hola! Me interesa hacer el siguiente pedido:\n'

        if (opts) {
          const fullName = opts.customerLastname ? `${opts.customerName} ${opts.customerLastname}` : opts.customerName
          message += `\n👤 *Cliente:* ${fullName}`
          message += `\n📞 *Teléfono:* ${opts.customerPhone}`
          if (opts.deliveryType === 'envio') {
            message += `\n🚚 *Entrega:* Envío a domicilio`
            if (opts.deliveryAddress) message += ` — ${opts.deliveryAddress}`
          } else {
            message += `\n🏪 *Entrega:* Retiro en local`
            if (opts.storeAddress) message += ` — ${opts.storeAddress}`
          }
          if (opts.paymentMethod) {
            const paymentLabel = opts.paymentMethod === 'transferencia'
              ? 'Transferencia bancaria'
              : 'Tarjeta de crédito/débito'
            message += `\n💳 *Pago:* ${paymentLabel}`
          }
          message += '\n'
        }

        if (inStock.length > 0) {
          message += '\n✅ *Disponibles:*\n'
          inStock.forEach((item) => {
            const label = item.variant ? ` - ${item.variant.label}` : ''
            const price = item.variant?.price_override ?? item.product.base_price
            message += `• ${item.product.name}${label} x${item.quantity} — ${formatPrice(price * item.quantity)}\n`
          })
        }

        if (outOfStock.length > 0) {
          message += '\n⏳ *Consulta de disponibilidad (sin stock):*\n'
          outOfStock.forEach((item) => {
            const label = item.variant ? ` - ${item.variant.label}` : ''
            message += `• ${item.product.name}${label} x${item.quantity} — ¿cuándo ingresaría?\n`
          })
        }

        if (madeToOrder.length > 0) {
          message += '\n🧵 *A pedido:*\n'
          madeToOrder.forEach((item) => {
            const label = item.variant ? ` - ${item.variant.label}` : ''
            message += `• ${item.product.name}${label} x${item.quantity}\n`
          })
        }

        const billableSubtotal = [...inStock, ...madeToOrder].reduce((total, item) => {
          const price = item.variant?.price_override ?? item.product.base_price
          return total + price * item.quantity
        }, 0)

        if (billableSubtotal > 0) {
          const displayTotal = opts?.total ?? billableSubtotal
          message += `\nTotal estimado: ${formatPrice(displayTotal)}`
          if (outOfStock.length > 0) message += ' _(sujeto a disponibilidad de stock)_'
        }

        message += '\n\n¡Gracias!'
        return message
      },

      getWhatsAppUrl: (opts) => {
        const message = get().generateWhatsAppMessage(opts)
        const encodedMessage = encodeURIComponent(message)
        const digits = get().whatsappDigits ?? ''
        return `https://wa.me/${digits}?text=${encodedMessage}`
      },
    }),
    {
      name: 'solari-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
