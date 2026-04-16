import { supabase } from '@/lib/supabase'

/**
 * Función para limpiar los dígitos del número de teléfono.
 */
export function normalizeWhatsAppDigits(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

export interface StoreContact {
  whatsappDigits: string | null
  cashDiscountPercent: number
}

/**
 * Obtiene el contacto y configuración de precios de la tienda desde Supabase.
 */
export async function fetchStoreContact(): Promise<StoreContact> {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  if (!storeId) {
    console.error('[stores] Falta NEXT_PUBLIC_STORE_ID')
    return { whatsappDigits: null, cashDiscountPercent: 20 }
  }

  const { data, error } = await supabase
    .from('stores')
    .select('whatsapp_number, cash_discount_percent')
    .eq('id', storeId)
    .maybeSingle()

  if (error) {
    console.error('[stores] Supabase Error:', error.message)
    return { whatsappDigits: null, cashDiscountPercent: 20 }
  }

  return {
    whatsappDigits: normalizeWhatsAppDigits(data?.whatsapp_number ?? null),
    cashDiscountPercent: data?.cash_discount_percent ?? 20,
  }
}

/**
 * @deprecated Usar fetchStoreContact() en su lugar.
 */
export async function fetchStoreWhatsAppNumber(): Promise<string | null> {
  const { whatsappDigits } = await fetchStoreContact()
  return whatsappDigits
}

/**
 * Fallback vacío cuando Supabase aún no respondió o falló.
 * El número real se carga vía StoreContactSync al montar la app.
 */
export function getFallbackWhatsAppDigits(): string {
  return ''
}