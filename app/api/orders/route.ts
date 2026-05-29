import { getAdminSupabase } from '@/lib/supabase-admin'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

type ItemPayload = {
  product_id: string
  variant_id: string | null
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
  subtotal: number
  is_made_to_order: boolean
  is_out_of_stock: boolean
}

export async function POST(request: Request) {
  const db = getAdminSupabase()

  let body: { items: ItemPayload[]; subtotal: number; total: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { items, subtotal, total } = body
  if (!items?.length) return Response.json({ error: 'No items' }, { status: 400 })

  const has_made_to_order = items.some((i) => i.is_made_to_order)
  const has_out_of_stock = items.some((i) => i.is_out_of_stock)

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      store_id: STORE_ID,
      customer_name: 'Sin nombre',
      customer_phone: '',
      customer_email: null,
      subtotal,
      discount_amount: 0,
      total,
      payment_method: null,
      status: 'pendiente',
      notes: null,
      has_made_to_order,
      has_out_of_stock,
    })
    .select()
    .single()

  if (orderError) return Response.json({ error: orderError.message }, { status: 500 })

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product_name,
    variant_label: item.variant_label,
    unit_price: item.unit_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }))

  const { error: itemsError } = await db.from('order_items').insert(orderItems)
  if (itemsError) return Response.json({ error: itemsError.message }, { status: 500 })

  return Response.json({ data: { id: order.id } }, { status: 201 })
}
