'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { fetchStoreContact } from '@/lib/store-contact'

/** Sincroniza el número de WhatsApp y el descuento de transferencia con Supabase. */
export function StoreContactSync() {
  const setDigits = useCartStore((s) => s.setWhatsappDigits)
  const setCashDiscountPercent = useCartStore((s) => s.setCashDiscountPercent)
  const setStoreAddress = useCartStore((s) => s.setStoreAddress)

  useEffect(() => {
    fetchStoreContact().then(({ whatsappDigits, cashDiscountPercent, storeAddress }) => {
      if (whatsappDigits) setDigits(whatsappDigits)
      setCashDiscountPercent(cashDiscountPercent)
      setStoreAddress(storeAddress)
    })
  }, [setDigits, setCashDiscountPercent, setStoreAddress])

  return null
}
