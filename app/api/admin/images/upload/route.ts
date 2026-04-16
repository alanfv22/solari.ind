import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const BUCKET = 'product-images'

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null
    const isPrimary = formData.get('isPrimary') === 'true'

    if (!file || !productId) {
      return Response.json({ error: 'Faltan datos: file y productId son requeridos' }, { status: 400 })
    }

    const db = getAdminSupabase()

    const ext = file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const storagePath = `${productId}/${filename}`

    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath)
    const publicUrl = urlData.publicUrl

    // Get next sort_order
    const { data: existingImages } = await db
      .from('product_images')
      .select('sort_order')
      .eq('product_id', productId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = (existingImages?.[0]?.sort_order ?? 0) + 1

    // If this is primary, unset others
    if (isPrimary) {
      await db.from('product_images').update({ is_primary: false }).eq('product_id', productId)
    }

    // Check if there are existing images to decide if this should be primary by default
    const { count: imageCount } = await db
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)

    const shouldBePrimary = isPrimary || (imageCount ?? 0) === 0

    const { data: newImage, error: insertError } = await db
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        is_primary: shouldBePrimary,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 })
    }

    return Response.json({ data: newImage }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return Response.json({ error: message }, { status: 500 })
  }
}
