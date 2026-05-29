import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('orders')
    .select(
      `id, store_id, order_number, created_at, customer_name, customer_phone, customer_email,
       subtotal, discount_amount, total, payment_method, status, notes,
       has_made_to_order, has_out_of_stock,
       items:order_items(id)`
    )
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
