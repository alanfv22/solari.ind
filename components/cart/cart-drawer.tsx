'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'
import { CheckoutModal } from '@/components/cart/checkout-modal'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    whatsappDigits,
    storeAddress,
    cashDiscountPercent,
  } = useCartStore()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const subtotal = getSubtotal()
  const totalTransferencia = Math.round(subtotal * (1 - cashDiscountPercent / 100))

  return (
    <>
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-lg p-0">
        {/* Header */}
        <SheetHeader className="border-b border-border px-4 py-4 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5" />
            Tu carrito
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Tu carrito está vacío</p>
            <Button onClick={closeCart} asChild>
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items — scrollable */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => {
                  const price = item.variant?.price_override ?? item.product.base_price
                  const outOfStock = !item.product.is_made_to_order && (item.variant?.stock ?? 1) <= 0
                  const maxStock = item.variant?.stock ?? 1
                  const atMaxStock = !item.product.is_made_to_order && item.quantity >= maxStock
                  return (
                    <motion.div
                      key={`${item.product.id}-${item.variant?.id ?? 'no-variant'}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`flex gap-3 px-4 py-4 ${idx < items.length - 1 ? 'border-b border-border' : ''} ${outOfStock ? 'opacity-75' : ''}`}
                    >
                      {/* Product Image */}
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                        {item.product.images?.[0]?.url && (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col min-w-0">
                        {/* Name + delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm text-foreground leading-tight">
                              {item.product.name}
                            </h4>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.variant.label}
                              </p>
                            )}
                            {outOfStock && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                Sin stock · consulta
                              </span>
                            )}
                            {item.product.is_made_to_order && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                                A pedido
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, item.variant?.id ?? null)}
                            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </button>
                        </div>

                        {/* Quantity + Price */}
                        <div className="mt-auto pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                              >
                                <Minus className="h-3 w-3" />
                                <span className="sr-only">Reducir cantidad</span>
                              </button>
                              <span className="w-5 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity + 1)}
                                disabled={atMaxStock}
                                className={cn(
                                  'flex h-7 w-7 items-center justify-center rounded-full border border-border transition-colors',
                                  atMaxStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary'
                                )}
                              >
                                <Plus className="h-3 w-3" />
                                <span className="sr-only">Aumentar cantidad</span>
                              </button>
                            </div>

                            <span className="text-base font-bold text-foreground tabular-nums">
                              {formatPrice(price * item.quantity)}
                            </span>
                          </div>
                          {atMaxStock && (
                            <p className="text-[10px] text-amber-700 mt-1.5">
                              Stock máximo: {maxStock} {maxStock === 1 ? 'unidad' : 'unidades'}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Cart Footer — sticky al fondo */}
            <div className="shrink-0 border-t border-border bg-background px-4 pb-6 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 pb-4">
                <span className="text-sm text-emerald-700 font-medium">
                  Con transferencia ({cashDiscountPercent}% off)
                </span>
                <span className="text-lg font-bold text-emerald-700 tabular-nums">
                  {formatPrice(totalTransferencia)}
                </span>
              </div>

              <Button
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-4 text-base h-auto"
                size="lg"
              >
                Realizar pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>

    <CheckoutModal
      open={checkoutOpen}
      onOpenChange={setCheckoutOpen}
      storeAddress={storeAddress}
      whatsappDigits={whatsappDigits}
    />
    </>
  )
}
