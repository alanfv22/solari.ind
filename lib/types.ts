export type Gender = 'mujer' | 'hombre' | 'unisex'

export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  image_url?: string | null
  sort_order: number
  active?: boolean
  created_at?: string
}

export interface Brand {
  id: string
  store_id: string
  name: string
  slug: string
  logo_url: string | null
  sort_order: number
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  is_primary: boolean
  sort_order: number
}

export interface ProductVariant {
  id: string
  product_id: string
  type?: string
  label: string
  value?: string
  price_override: number | null
  stock: number
  active: boolean
  sort_order?: number
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
  is_on_sale?: boolean
  sale_percent?: number
  active: boolean
  sort_order: number
  gender: Gender
  is_made_to_order: boolean
  created_at: string
  updated_at?: string
  // Joined data
  category?: Category
  brand?: Brand
  variants?: ProductVariant[]
  images?: ProductImage[]
}

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
  subtotal: number
  // Joined data
  product?: {
    is_made_to_order: boolean
    images?: { url: string; is_primary: boolean }[]
  }
  variant?: {
    stock: number
  } | null
}

export interface Order {
  id: string
  store_id: string
  order_number: number
  created_at: string
  customer_name: string
  customer_lastname: string | null
  customer_phone: string | null
  customer_email: string | null
  delivery_type: 'retiro' | 'envio' | null
  delivery_address: string | null
  subtotal: number
  discount_amount: number
  total: number
  payment_method: string | null
  status: OrderStatus
  notes: string | null
  has_made_to_order: boolean
  has_out_of_stock: boolean
  // Joined data
  items?: OrderItem[]
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
  whatsapp_message_template?: string
  primary_color?: string
  active: boolean
  cash_discount_percent?: number
  instagram_url?: string | null
  address?: string | null
  currency?: string
}