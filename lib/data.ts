import { supabase } from './supabase'
import type { Category, Product, Store, ProductVariant, ProductImage } from './types'

function getStoreId(): string {
  const id = process.env.NEXT_PUBLIC_STORE_ID
  if (!id) throw new Error('Falta NEXT_PUBLIC_STORE_ID en las variables de entorno')
  return id
}

export async function fetchStore(): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', getStoreId())
    .maybeSingle()

  if (error) {
    console.error('[fetchStore]', error.message)
    return null
  }
  return data as Store | null
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('store_id', getStoreId())
    .order('sort_order')

  if (error) {
    console.error('[fetchCategories]', error.message)
    return []
  }
  return (data ?? []) as Category[]
}

export async function fetchProducts(gender?: 'mujer' | 'hombre'): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('store_id', getStoreId())
    .eq('active', true)
    .order('sort_order')

  if (gender) {
    query = query.in('gender', [gender, 'unisex'])
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchProducts]', error.message)
    return []
  }

  return ((data ?? []) as Product[]).map((product) => ({
    ...product,
    variants: (product.variants ?? []) as ProductVariant[],
    images: ((product.images ?? []) as ProductImage[]).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))
}

export async function fetchProductsPaginated({
  gender,
  categoryId,
  sortBy = 'featured',
  page = 1,
  pageSize = 12,
}: {
  gender?: 'mujer' | 'hombre'
  categoryId?: string
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'newest'
  page?: number
  pageSize?: number
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select(
      `*, category:categories(*), variants:product_variants(*), images:product_images(*)`,
      { count: 'exact' }
    )
    .eq('store_id', getStoreId())
    .eq('active', true)

  if (gender) query = query.in('gender', [gender, 'unisex'])
  if (categoryId) query = query.eq('category_id', categoryId)

  switch (sortBy) {
    case 'price-asc':  query = query.order('base_price', { ascending: true });  break
    case 'price-desc': query = query.order('base_price', { ascending: false }); break
    case 'newest':     query = query.order('created_at', { ascending: false }); break
    default:           query = query.order('sort_order')
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('[fetchProductsPaginated]', error.message)
    return { products: [], total: 0 }
  }

  const products = ((data ?? []) as Product[]).map((product) => ({
    ...product,
    variants: (product.variants ?? []) as ProductVariant[],
    images: ((product.images ?? []) as ProductImage[]).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))

  return { products, total: count ?? 0 }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('store_id', getStoreId())
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    console.error('[fetchProductBySlug]', error.message)
    return null
  }

  if (!data) return null

  const product = data as Product

  return {
    ...product,
    variants: (product.variants ?? []) as ProductVariant[],
    images: ((product.images ?? []) as ProductImage[]).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }
}

export async function fetchRelatedProducts(
  gender: string,
  excludeId: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('store_id', getStoreId())
    .eq('active', true)
    .in('gender', [gender, 'unisex'])
    .neq('id', excludeId)
    .order('sort_order')
    .limit(4)

  if (error) {
    console.error('[fetchRelatedProducts]', error.message)
    return []
  }

  return ((data ?? []) as Product[]).map((product) => ({
    ...product,
    variants: (product.variants ?? []) as ProductVariant[],
    images: ((product.images ?? []) as ProductImage[]).sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}