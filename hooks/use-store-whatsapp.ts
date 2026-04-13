'use client'

import { useEffect, useState } from 'react'
import { fetchStoreWhatsAppNumber, getFallbackWhatsAppDigits } from '@/lib/store-contact'

export function useStoreWhatsApp() {
  const [whatsappDigits, setWhatsappDigits] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchStoreWhatsAppNumber().then((fromDb) => {
      if (cancelled) return
      const fallback = getFallbackWhatsAppDigits()
      setWhatsappDigits((fromDb ?? fallback) || null)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { whatsappDigits, loading }
}
