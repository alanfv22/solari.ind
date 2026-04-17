import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? ''

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()
  const { data, error } = await db
    .from('products')
    .select(
      `*, category:categories(id, name), variants:product_variants(*), images:product_images(*)`
    )
    .eq('store_id', STORE_ID)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  const db = getAdminSupabase()
  const body = await request.json()

  const { variants, ...productData } = body

  // Auto-generate slug from name if not provided
  if (!productData.slug && productData.name) {
    productData.slug = generateSlug(productData.name)
  }

  // Get max sort_order
  const { data: lastProduct } = await db
    .from('products')
    .select('sort_order')
    .eq('store_id', STORE_ID)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (lastProduct?.sort_order ?? 0) + 1

  const { data: product, error } = await db
    .from('products')
    .insert({ ...productData, store_id: STORE_ID, sort_order })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Insert variants
  if (variants && variants.length > 0) {
    const variantRows = variants.map((v: Record<string, unknown>) => ({
      ...v,
      product_id: product.id,
    }))
    const { error: varError } = await db.from('product_variants').insert(variantRows)
    if (varError) return Response.json({ error: varError.message }, { status: 500 })
  }

  return Response.json({ data: product }, { status: 201 })
}
