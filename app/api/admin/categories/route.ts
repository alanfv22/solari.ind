import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('categories')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()
  const body = await request.json()

  const { data: last } = await db
    .from('categories')
    .select('sort_order')
    .eq('store_id', STORE_ID)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { data, error } = await db
    .from('categories')
    .insert({ ...body, store_id: STORE_ID, sort_order })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data }, { status: 201 })
}
