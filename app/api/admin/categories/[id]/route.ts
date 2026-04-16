import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()
  const body = await request.json()

  const { data, error } = await db
    .from('categories')
    .update(body)
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()

  const { error } = await db.from('categories').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
