import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function PUT(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const body: { id: string; sort_order: number }[] = await request.json()
  if (!Array.isArray(body) || body.length === 0) {
    return Response.json({ error: 'Se esperaba un array de { id, sort_order }' }, { status: 400 })
  }

  const db = getAdminSupabase()
  const updates = body.map(({ id, sort_order }) =>
    db.from('categories').update({ sort_order }).eq('id', id).eq('store_id', STORE_ID)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return Response.json({ error: failed.error.message }, { status: 500 })

  return Response.json({ success: true })
}
