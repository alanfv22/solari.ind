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

  let body: {
    items: ItemPayload[]
    subtotal: number
    discount_amount: number
    total: number
    payment_method: 'transferencia' | 'tarjeta'
    customer_name: string
    customer_lastname: string
    customer_phone: string
    customer_email: string | null
    delivery_type: 'retiro' | 'envio'
    delivery_address: string | null
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { items, subtotal, discount_amount, total, payment_method, customer_name, customer_lastname, customer_phone, customer_email, delivery_type, delivery_address } = body
  if (!items?.length) return Response.json({ error: 'No items' }, { status: 400 })

  const has_made_to_order = items.some((i) => i.is_made_to_order)
  const has_out_of_stock = items.some((i) => i.is_out_of_stock)

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      store_id: STORE_ID,
      customer_name,
      customer_lastname,
      customer_phone,
      customer_email: customer_email ?? null,
      delivery_type,
      delivery_address: delivery_address ?? null,
      subtotal,
      discount_amount: discount_amount ?? 0,
      total,
      payment_method: payment_method ?? null,
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

  console.log('[create-order] inserting order_items:', orderItems.map(i => ({
    order_id: i.order_id,
    product_id: i.product_id,
    variant_id: i.variant_id,
    product_name: i.product_name,
    quantity: i.quantity,
  })))

  const { error: itemsError } = await db.from('order_items').insert(orderItems)
  if (itemsError) {
    console.error('[create-order] order_items insert error:', itemsError)
    return Response.json({ error: itemsError.message }, { status: 500 })
  }

  console.log('[create-order] order_items inserted successfully for order', order.id)
  return Response.json({ data: { id: order.id } }, { status: 201 })
}
