'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Eye, CircleDot, CheckCircle2, Clock, Truck, PackageCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice } from '@/lib/data'
import type { Order, OrderItem, OrderStatus } from '@/lib/types'

// ─── Status config ───────────────────────────────────────────────────────────

type StatusConfig = {
  label: string
  badgeClass: string
  icon: React.ReactNode
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <CircleDot className="h-3 w-3" />,
  },
  confirmado: {
    label: 'Confirmado',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  en_preparacion: {
    label: 'En preparación',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <Clock className="h-3 w-3" />,
  },
  enviado: {
    label: 'Enviado',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: <Truck className="h-3 w-3" />,
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    icon: <PackageCheck className="h-3 w-3" />,
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pendiente: 'confirmado',
  confirmado: 'en_preparacion',
  en_preparacion: 'enviado',
  enviado: 'entregado',
}

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  pendiente: 'Confirmar pedido',
  confirmado: 'Iniciar preparación',
  en_preparacion: 'Marcar como enviado',
  enviado: 'Marcar como entregado',
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as OrderStatus[]

// ─── Row type (list view) ─────────────────────────────────────────────────────

type OrderRow = Omit<Order, 'items'> & {
  items: { id: string }[]
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badgeClass}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  orderId,
  open,
  onOpenChange,
  onStatusChanged,
}: {
  orderId: string | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onStatusChanged: (id: string, status: OrderStatus) => void
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true)
    setOrder(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOrder(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && orderId) fetchOrder(orderId)
  }, [open, orderId, fetchOrder])

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev))
      onStatusChanged(order.id, newStatus)
      toast.success(`Pedido actualizado a "${STATUS_CONFIG[newStatus].label}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setUpdating(false)
    }
  }

  function getItemType(item: OrderItem) {
    if (item.product?.is_made_to_order) return 'made_to_order'
    if (item.variant && item.variant.stock === 0) return 'out_of_stock'
    return 'normal'
  }

  function getPrimaryImage(item: OrderItem): string | null {
    const images = item.product?.images ?? []
    const primary = images.find((i) => i.is_primary)
    return primary?.url ?? images[0]?.url ?? null
  }

  const nextStatus = order ? NEXT_STATUS[order.status] : undefined
  const canCancel = order && order.status !== 'cancelado' && order.status !== 'entregado'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Always-present title for Radix UI accessibility */}
        <DialogTitle className="sr-only">Detalle del pedido</DialogTitle>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && order && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-serif text-xl font-semibold">
                  Pedido #{String(order.order_number).padStart(5, '0')}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </DialogHeader>

            {/* Customer info */}
            <div className="rounded-lg border border-border p-4 space-y-1.5 text-sm">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Cliente
              </p>
              <p className="font-medium">{order.customer_name}</p>
              {order.customer_phone && (
                <p className="text-muted-foreground">{order.customer_phone}</p>
              )}
              {order.customer_email && (
                <p className="text-muted-foreground">{order.customer_email}</p>
              )}
              {order.payment_method && (
                <p>
                  <span className="text-muted-foreground">Pago: </span>
                  {order.payment_method}
                </p>
              )}
              {order.notes && (
                <p className="text-muted-foreground italic">"{order.notes}"</p>
              )}
            </div>

            {/* Items */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  Ítems ({order.items?.length ?? 0})
                </p>
              </div>
              <ul className="divide-y divide-border">
                {(order.items ?? []).map((item) => {
                  const imgUrl = getPrimaryImage(item)
                  const itemType = getItemType(item)
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Image */}
                      <div className="h-12 w-12 rounded-md border border-border bg-muted overflow-hidden shrink-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                            —
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        {item.variant_label && (
                          <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {formatPrice(item.unit_price)}
                        </p>
                      </div>

                      {/* Type indicator */}
                      <div className="shrink-0 text-sm" title={
                        itemType === 'made_to_order' ? 'A pedido' :
                        itemType === 'out_of_stock' ? 'Sin stock' : 'Normal'
                      }>
                        {itemType === 'made_to_order' && (
                          <span className="text-blue-600" title="A pedido">🔵</span>
                        )}
                        {itemType === 'out_of_stock' && (
                          <span className="text-yellow-600" title="Sin stock">⚠️</span>
                        )}
                        {itemType === 'normal' && (
                          <span className="text-green-600" title="Normal">✓</span>
                        )}
                      </div>

                      {/* Subtotal */}
                      <p className="shrink-0 font-medium text-sm tabular-nums">
                        {formatPrice(item.subtotal)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento</span>
                  <span className="tabular-nums">−{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Actions */}
            {(nextStatus || canCancel) && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updating}
                      className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => handleStatusChange('cancelado')}
                    >
                      {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Cancelar pedido
                    </Button>
                  )}
                </div>
                <div>
                  {nextStatus && (
                    <Button
                      size="sm"
                      disabled={updating}
                      onClick={() => handleStatusChange(nextStatus)}
                    >
                      {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {NEXT_STATUS_LABEL[order.status]} →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | '__all__'>('__all__')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOrders(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  function openDetail(id: string) {
    setSelectedId(id)
    setModalOpen(true)
  }

  function handleStatusChanged(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    )
  }

  const filtered =
    filterStatus === '__all__'
      ? orders
      : orders.filter((o) => o.status === filterStatus)

  // Count per status for filter chips
  const countByStatus = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '...' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en total`}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('__all__')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filterStatus === '__all__'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
          }`}
        >
          Todos
          <span className="ml-1.5 text-xs opacity-70">{orders.length}</span>
        </button>

        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status]
          const active = filterStatus === status
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? `${cfg.badgeClass} border-current`
                  : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
              }`}
            >
              {active && cfg.icon}
              {cfg.label}
              {countByStatus[status] > 0 && (
                <span className="text-xs opacity-70">{countByStatus[status]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <OrdersSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            {filterStatus === '__all__'
              ? 'No hay pedidos aún.'
              : `No hay pedidos con estado "${STATUS_CONFIG[filterStatus as OrderStatus].label}".`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Ítems
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Total
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openDetail(order.id)}
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                    <span className="hidden sm:inline ml-1 text-xs">
                      {new Date(order.created_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer_name}</p>
                    {order.customer_email && (
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {order.customer_email}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Badge variant="secondary" className="tabular-nums">
                      {order.items?.length ?? 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums hidden md:table-cell">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1">
                      {order.has_made_to_order && (
                        <span title="Tiene ítems a pedido">🔵</span>
                      )}
                      {order.has_out_of_stock && (
                        <span title="Tiene ítems sin stock">⚠️</span>
                      )}
                      {!order.has_made_to_order && !order.has_out_of_stock && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openDetail(order.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <OrderDetailModal
        orderId={selectedId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 border-b border-border px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-8 hidden sm:block ml-auto" />
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-8 rounded ml-2" />
        </div>
      ))}
    </div>
  )
}
