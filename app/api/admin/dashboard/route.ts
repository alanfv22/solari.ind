import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalCategories },
    { data: recentProducts },
  ] = await Promise.all([
    db.from('products').select('id', { count: 'exact', head: true }).eq('store_id', STORE_ID),
    db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', STORE_ID)
      .eq('active', true),
    db.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', STORE_ID),
    db
      .from('products')
      .select('id, name, base_price, active, gender, created_at, category:categories(name)')
      .eq('store_id', STORE_ID)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return Response.json({
    totalProducts: totalProducts ?? 0,
    activeProducts: activeProducts ?? 0,
    totalCategories: totalCategories ?? 0,
    recentProducts: recentProducts ?? [],
  })
}
