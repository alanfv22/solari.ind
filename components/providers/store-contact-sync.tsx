'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { fetchStoreContact } from '@/lib/store-contact'

/** Sincroniza el número de WhatsApp y el descuento de transferencia con Supabase. */
export function StoreContactSync() {
  const setDigits = useCartStore((s) => s.setWhatsappDigits)
  const setCashDiscountPercent = useCartStore((s) => s.setCashDiscountPercent)

  useEffect(() => {
    fetchStoreContact().then(({ whatsappDigits, cashDiscountPercent }) => {
      if (whatsappDigits) setDigits(whatsappDigits)
      setCashDiscountPercent(cashDiscountPercent)
    })
  }, [setDigits, setCashDiscountPercent])

  return null
}
