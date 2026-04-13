'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { fetchStoreWhatsAppNumber, getFallbackWhatsAppDigits } from '@/lib/store-contact'

/** Sincroniza el número de WhatsApp del carrito con Supabase (mismo origen que el FAB). */
export function StoreContactSync() {
  const setDigits = useCartStore((s) => s.setWhatsappDigits)

  useEffect(() => {
    fetchStoreWhatsAppNumber().then((fromDb) => {
      const resolved = fromDb ?? getFallbackWhatsAppDigits()
      if (resolved) setDigits(resolved)
    })
  }, [setDigits])

  return null
}
