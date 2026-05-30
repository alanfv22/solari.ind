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

  console.log(`[PUT /orders/${id}] newStatus received:`, JSON.stringify(newStatus), typeof newStatus)

  // 1. Fetch only the current status (no joins)
  const { data: order, error: fetchError } = await db
    .from('orders')
    .select('status')
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .single()

  if (fetchError) {
    console.error('[PUT] fetch order error:', fetchError)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  const prevStatus: OrderStatus = order.status
  console.log(`[PUT] prevStatus=${prevStatus} newStatus=${newStatus} match=${newStatus === 'confirmado'}`)

  // 2. Fetch order_items directly by order_id — no FK join dependency
  const { data: rawItems, error: itemsError } = await db
    .from('order_items')
    .select('id, variant_id, quantity, product_id')
    .eq('order_id', id)

  if (itemsError) {
    console.error('[PUT] fetch order_items error:', itemsError)
    return Response.json({ error: itemsError.message }, { status: 500 })
  }

  console.log('[PUT] order_items:', JSON.stringify(rawItems))

  // Deduct stock when moving to 'confirmado'
  if (newStatus === 'confirmado' && prevStatus === 'pendiente') {
    console.log(`[stock-deduct] entering deduction loop for ${rawItems?.length ?? 0} items`)

    for (const item of rawItems ?? []) {
      console.log(`[stock-deduct] item: variant_id=${item.variant_id} product_id=${item.product_id} qty=${item.quantity}`)

      if (!item.variant_id) {
        // No variant — check if the product is made-to-order
        const { data: product } = await db
          .from('products')
          .select('is_made_to_order')
          .eq('id', item.product_id)
          .single()
        console.log(`[stock-deduct] no variant_id, product.is_made_to_order=${product?.is_made_to_order}`)
        continue
      }

      // Check if product is made-to-order (skip stock deduction if so)
      const { data: product } = await db
        .from('products')
        .select('is_made_to_order')
        .eq('id', item.product_id)
        .single()

      if (product?.is_made_to_order) {
        console.log(`[stock-deduct] skipped — product ${item.product_id} is_made_to_order`)
        continue
      }

      // Fetch current stock
      const { data: variant, error: variantErr } = await db
        .from('product_variants')
        .select('id, stock')
        .eq('id', item.variant_id)
        .single()

      console.log(`[stock-deduct] variant fetch: id=${item.variant_id}`, JSON.stringify(variant), 'error:', variantErr)

      if (!variant) {
        console.error(`[stock-deduct] variant not found for id=${item.variant_id}`)
        continue
      }

      const newStock = Math.max(0, variant.stock - item.quantity)
      const { data: updated, error: updateErr } = await db
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', item.variant_id)
        .select('id, stock')

      console.log(`[stock-deduct] UPDATE result: ${variant.stock} → ${newStock}`, JSON.stringify(updated), 'error:', updateErr)
    }
  }

  // Restore stock when cancelling, only if stock was previously deducted
  if (newStatus === 'cancelado' && STOCK_DEDUCTED_STATUSES.includes(prevStatus)) {
    for (const item of rawItems ?? []) {
      if (!item.variant_id) continue

      const { data: product } = await db
        .from('products')
        .select('is_made_to_order')
        .eq('id', item.product_id)
        .single()
      if (product?.is_made_to_order) continue

      const { data: variant } = await db
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single()

      if (variant) {
        await db
          .from('product_variants')
          .update({ stock: variant.stock + item.quantity })
          .eq('id', item.variant_id)
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

  if (error) {
    console.error('[PUT] update order status error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  console.log(`[PUT] order ${id} status updated to ${newStatus} ✓`)
  return Response.json({ data })
}
