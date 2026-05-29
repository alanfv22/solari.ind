import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import type { OrderStatus } from '@/lib/types'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

// Status where stock has already been deducted
const STOCK_DEDUCTED_STATUSES: OrderStatus[] = [
  'confirmado',
  'en_preparacion',
  'enviado',
  'entregado',
]

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()
  const { data, error } = await db
    .from('orders')
    .select(
      `*, items:order_items(
        *,
        product:products(is_made_to_order, images:product_images(url, is_primary)),
        variant:product_variants(stock)
      )`
    )
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()
  const body = await request.json()
  const newStatus: OrderStatus = body.status

  // Fetch current order with items to handle stock logic
  const { data: order, error: fetchError } = await db
    .from('orders')
    .select(
      `status, items:order_items(
        id, variant_id, quantity,
        product:products(is_made_to_order),
        variant:product_variants(id, stock)
      )`
    )
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .single()

  if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 })

  const prevStatus: OrderStatus = order.status
  // Supabase returns joined rows as arrays; normalise to single objects
  type RawItem = {
    id: string
    variant_id: string | null
    quantity: number
    product: { is_made_to_order: boolean }[] | { is_made_to_order: boolean } | null
    variant: { id: string; stock: number }[] | { id: string; stock: number } | null
  }
  const rawItems: RawItem[] = order.items ?? []
  const items = rawItems.map((item) => ({
    ...item,
    product: Array.isArray(item.product) ? item.product[0] ?? null : item.product,
    variant: Array.isArray(item.variant) ? item.variant[0] ?? null : item.variant,
  }))

  // Deduct stock when moving to 'confirmado'
  if (newStatus === 'confirmado' && prevStatus === 'pendiente') {
    for (const item of items) {
      const isMadeToOrder = item.product?.is_made_to_order ?? false
      const variantId = item.variant_id
      const currentStock = item.variant?.stock ?? 0

      if (!isMadeToOrder && variantId && currentStock > 0) {
        const newStock = Math.max(0, currentStock - item.quantity)
        await db.from('product_variants').update({ stock: newStock }).eq('id', variantId)
      }
    }
  }

  // Restore stock when cancelling, only if stock was previously deducted
  if (newStatus === 'cancelado' && STOCK_DEDUCTED_STATUSES.includes(prevStatus)) {
    for (const item of items) {
      const isMadeToOrder = item.product?.is_made_to_order ?? false
      const variantId = item.variant_id

      if (!isMadeToOrder && variantId) {
        const { data: variant } = await db
          .from('product_variants')
          .select('stock')
          .eq('id', variantId)
          .single()

        if (variant) {
          await db
            .from('product_variants')
            .update({ stock: variant.stock + item.quantity })
            .eq('id', variantId)
        }
      }
    }
  }

  // Update order status
  const { data, error } = await db
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
