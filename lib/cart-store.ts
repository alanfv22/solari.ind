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
  generateWhatsAppMessage: () => string
  getWhatsAppUrl: () => string
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      whatsappDigits: null,
      setWhatsappDigits: (digits) => set({ whatsappDigits: digits }),
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

      generateWhatsAppMessage: () => {
        const { items } = get()
        if (items.length === 0) return ''

        const inStock     = items.filter(i => !i.product.is_made_to_order && (i.variant?.stock ?? 1) > 0)
        const outOfStock  = items.filter(i => !i.product.is_made_to_order && (i.variant?.stock ?? 1) <= 0)
        const madeToOrder = items.filter(i => i.product.is_made_to_order)

        let message = 'Hola! Me interesa hacer el siguiente pedido:\n'

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
          message += `\nTotal estimado: ${formatPrice(billableSubtotal)}`
          if (outOfStock.length > 0) message += ' _(sujeto a disponibilidad de stock)_'
        }

        message += '\n\n¡Gracias!'
        return message
      },

      getWhatsAppUrl: () => {
        const message = get().generateWhatsAppMessage()
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
