import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const BUCKET = 'product-images'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()

  const { data: image, error: fetchError } = await db
    .from('product_images')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !image) {
    return Response.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }

  // Extract storage path from URL
  try {
    const url = new URL(image.url)
    const storagePath = url.pathname.replace(`/storage/v1/object/public/${BUCKET}/`, '')
    await db.storage.from(BUCKET).remove([storagePath])
  } catch {
    // Continue even if storage delete fails (URL may be external)
  }

  const { error } = await db.from('product_images').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // If deleted image was primary, promote the next one
  if (image.is_primary) {
    const { data: remaining } = await db
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .order('sort_order')
      .limit(1)

    if (remaining && remaining.length > 0) {
      await db.from('product_images').update({ is_primary: true }).eq('id', remaining[0].id)
    }
  }

  return Response.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()
  const body = await request.json()

  // If setting as primary, unset all others for this product
  if (body.is_primary === true) {
    const { data: image } = await db.from('product_images').select('product_id').eq('id', id).single()
    if (image) {
      await db.from('product_images').update({ is_primary: false }).eq('product_id', image.product_id)
    }
  }

  const { data, error } = await db.from('product_images').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ data })
}
