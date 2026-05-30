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
  } = useCartStore()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const subtotal = getSubtotal()

  return (
    <>
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-lg">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingBag className="h-5 w-5" />
            Tu carrito
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
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
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const price =
                    item.variant?.price_override ?? item.product.base_price
                  return (
                    <motion.div
                      key={`${item.product.id}-${item.variant?.id ?? 'no-variant'}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`mb-4 flex gap-4 border-b border-border pb-4 last:border-0 ${
                        !item.product.is_made_to_order && (item.variant?.stock ?? 1) <= 0
                          ? 'opacity-75'
                          : ''
                      }`}
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
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-foreground leading-tight">
                              {item.product.name}
                            </h4>
                            {item.variant && (
                              <p className="text-sm text-muted-foreground">
                                {item.variant.label}
                              </p>
                            )}
                            {!item.product.is_made_to_order && (item.variant?.stock ?? 1) <= 0 && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Sin stock · consulta
                              </span>
                            )}
                            {item.product.is_made_to_order && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                A pedido
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              removeItem(
                                item.product.id,
                                item.variant?.id ?? null
                              )
                            }
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.variant?.id ?? null,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                            >
                              <Minus className="h-3 w-3" />
                              <span className="sr-only">Reducir cantidad</span>
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.variant?.id ?? null,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                            >
                              <Plus className="h-3 w-3" />
                              <span className="sr-only">Aumentar cantidad</span>
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-semibold text-foreground">
                            {formatPrice(price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Cart Footer */}
            <div className="border-t border-border pt-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between pb-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-semibold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Checkout CTA */}
              <Button
                onClick={() => setCheckoutOpen(true)}
                className="w-full"
                size="lg"
              >
                Realizar pedido
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Te contactaremos para coordinar el pago y envío
              </p>
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
