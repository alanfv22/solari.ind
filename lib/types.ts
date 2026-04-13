// Types matching Supabase schema for easy migration

export type Gender = 'mujer' | 'hombre' | 'unisex'

export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export interface Brand {
  id: string
  store_id: string
  name: string
  slug: string
  logo_url: string | null
  active: boolean
  created_at: string
}

export interface Product {
  id: string
  store_id: string
  category_id: string
  brand_id: string | null
  name: string
  slug: string
  description: string
  base_price: number
  compare_at_price: number | null
  active: boolean
  sort_order: number
  gender: Gender
  images: string[]
  created_at: string
  updated_at: string
  // Joined data
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: string
  product_id: string
  type: 'size' | 'color'
  label: string
  value: string
  price_override: number | null
  stock: number
  active: boolean
  sort_order: number
}

export interface CartItem {
  product: Product
  variant: ProductVariant | null
  quantity: number
}

export interface Store {
  id: string
  name: string
  slug: string
  logo_url: string | null
  whatsapp_number: string
  instagram_url: string | null
  address: string | null
  currency: string
  active: boolean
}
