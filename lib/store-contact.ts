import { supabase } from '@/lib/supabase' // Importamos la constante, no la función
import { store } from '@/lib/mock-data'

/**
 * Función para limpiar los dígitos del número de teléfono.
 */
export function normalizeWhatsAppDigits(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

/**
 * Obtiene el número de WhatsApp real desde Supabase.
 */
export async function fetchStoreWhatsAppNumber(): Promise<string | null> {
  // Ya no llamamos a createSupabaseClient(), usamos 'supabase' directamente
  const { data, error } = await supabase
    .from('stores')
    .select('whatsapp_number')
    .eq('id', 'f7568beb-76c8-416e-afba-b693bd49d699') 
    .maybeSingle()

  if (error) {
    console.error('[stores] Supabase Error:', error.message)
    return null
  }

  return normalizeWhatsAppDigits(data?.whatsapp_number ?? null)
}

/**
 * Para enlaces cuando Supabase aún no respondió o falló.
 */
export function getFallbackWhatsAppDigits(): string {
  return normalizeWhatsAppDigits(store.whatsapp_number) ?? ''
}