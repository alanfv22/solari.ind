'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/data'

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getWhatsAppUrl,
  } = useCartStore()

  const subtotal = getSubtotal()

  return (
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

              {/* WhatsApp CTA */}
              <Button
                asChild
                className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#20BD5A]"
                size="lg"
              >
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar por WhatsApp
                </a>
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Te contactaremos para coordinar el pago y envío
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
