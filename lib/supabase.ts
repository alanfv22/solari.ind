import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Singleton: una sola instancia compartida en todo el módulo
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  _client = createClient(url!, key!, {
    auth: {
      // No usamos autenticación — deshabilitamos todo para evitar
      // el warning de gotrue-js y el doble-lock de React Strict Mode
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  return _client
}

export const supabase = getClient()
