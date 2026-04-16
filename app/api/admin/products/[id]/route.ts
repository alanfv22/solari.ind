import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()

  const { data, error } = await db
    .from('products')
    .select(`*, category:categories(id, name), variants:product_variants(*), images:product_images(*)`)
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ data })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()
  const body = await request.json()

  const { variants, ...productData } = body

  const { data: product, error } = await db
    .from('products')
    .update(productData)
    .eq('id', id)
    .eq('store_id', STORE_ID)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Sync variants: delete removed ones, upsert existing/new
  if (variants !== undefined) {
    const incomingWithId = (variants as Record<string, unknown>[]).filter((v) => v.id)
    const incomingWithoutId = (variants as Record<string, unknown>[]).filter((v) => !v.id)

    // Get existing variant IDs
    const { data: existingVariants } = await db
      .from('product_variants')
      .select('id')
      .eq('product_id', id)

    const existingIds = (existingVariants ?? []).map((v: { id: string }) => v.id)
    const keepIds = incomingWithId.map((v) => v.id as string)
    const toDelete = existingIds.filter((eid) => !keepIds.includes(eid))

    if (toDelete.length > 0) {
      await db.from('product_variants').delete().in('id', toDelete)
    }

    // Update existing variants
    for (const v of incomingWithId) {
      const { id: varId, ...varData } = v
      await db.from('product_variants').update(varData).eq('id', varId as string)
    }

    // Insert new variants
    if (incomingWithoutId.length > 0) {
      const newVariants = incomingWithoutId.map((v) => ({ ...v, product_id: id }))
      await db.from('product_variants').insert(newVariants)
    }
  }

  return Response.json({ data: product })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const { id } = await params
  const db = getAdminSupabase()

  // Delete related data first
  await db.from('product_variants').delete().eq('product_id', id)

  // Delete images from storage
  const { data: images } = await db
    .from('product_images')
    .select('url')
    .eq('product_id', id)

  if (images && images.length > 0) {
    const paths = images.map((img: { url: string }) => {
      try {
        const url = new URL(img.url)
        return url.pathname.replace('/storage/v1/object/public/product-images/', '')
      } catch {
        return null
      }
    }).filter(Boolean) as string[]

    if (paths.length > 0) {
      await db.storage.from('product-images').remove(paths)
    }
  }

  await db.from('product_images').delete().eq('product_id', id)

  const { error } = await db.from('products').delete().eq('id', id).eq('store_id', STORE_ID)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
