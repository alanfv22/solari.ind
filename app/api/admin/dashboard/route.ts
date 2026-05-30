import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()

  const [
    { count: totalProducts },
    { data: productsData },
    { data: orderTotals },
    { data: lastOrders },
  ] = await Promise.all([
    db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', STORE_ID)
      .eq('active', true),
    db
      .from('products')
      .select('base_price, variants:product_variants(stock)')
      .eq('store_id', STORE_ID)
      .eq('active', true),
    db
      .from('orders')
      .select('total')
      .eq('store_id', STORE_ID)
      .eq('status', 'entregado'),
    db
      .from('orders')
      .select('order_number, customer_name, total, status, created_at')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const valorCatalogo = (productsData ?? []).reduce(
    (sum, p) => sum + (p.base_price ?? 0),
    0
  )

  const valorInventario = (productsData ?? []).reduce((sum, p) => {
    const totalStock = ((p.variants as { stock: number }[]) ?? []).reduce(
      (s, v) => s + (v.stock ?? 0),
      0
    )
    return sum + (p.base_price ?? 0) * totalStock
  }, 0)

  const totalVentas = (orderTotals ?? []).reduce(
    (sum, o) => sum + (o.total ?? 0),
    0
  )

  return Response.json({
    totalProducts: totalProducts ?? 0,
    valorCatalogo,
    valorInventario,
    totalVentas,
    lastOrders: lastOrders ?? [],
  })
}
