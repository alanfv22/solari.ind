'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { fetchStoreContact } from '@/lib/store-contact'

/** Sincroniza el número de WhatsApp y el descuento de transferencia con Supabase. */
export function StoreContactSync() {
  const setDigits = useCartStore((s) => s.setWhatsappDigits)
  const setCashDiscountPercent = useCartStore((s) => s.setCashDiscountPercent)
  const setStoreAddress = useCartStore((s) => s.setStoreAddress)
  const validateCart = useCartStore((s) => s.validateCart)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    fetchStoreContact().then(({ whatsappDigits, cashDiscountPercent, storeAddress }) => {
      if (whatsappDigits) setDigits(whatsappDigits)
      setCashDiscountPercent(cashDiscountPercent)
      setStoreAddress(storeAddress)
    })
    if (items.length > 0) validateCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
