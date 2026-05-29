'use client'

import { useEffect, useState } from 'react'
import { Package, DollarSign, BarChart3, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

interface LastOrder {
  order_number: number
  customer_name: string
  total: number
  status: OrderStatus
  created_at: string
}

interface DashboardData {
  totalProducts: number
  valorCatalogo: number
  valorInventario: number
  totalVentas: number
  lastOrders: LastOrder[]
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pendiente:      { label: 'Pendiente',      className: 'bg-yellow-100 text-yellow-800' },
  confirmado:     { label: 'Confirmado',     className: 'bg-blue-100 text-blue-800' },
  en_preparacion: { label: 'En preparación', className: 'bg-orange-100 text-orange-800' },
  enviado:        { label: 'Enviado',        className: 'bg-violet-100 text-violet-800' },
  entregado:      { label: 'Entregado',      className: 'bg-green-100 text-green-800' },
  cancelado:      { label: 'Cancelado',      className: 'bg-red-100 text-red-800' },
}

function formatOrderNumber(n: number) {
  return `#${String(n).padStart(5, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setData(json)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        {error}
      </div>
    )
  }

  const stats = [
    {
      label: 'Total productos',
      value: data?.totalProducts ?? 0,
      display: String(data?.totalProducts ?? 0),
      icon: Package,
      color: 'text-blue-500',
    },
    {
      label: 'Valor catálogo',
      value: data?.valorCatalogo ?? 0,
      display: formatPrice(data?.valorCatalogo ?? 0),
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Valor inventario',
      value: data?.valorInventario ?? 0,
      display: formatPrice(data?.valorInventario ?? 0),
      icon: BarChart3,
      color: 'text-purple-500',
    },
    {
      label: 'Total ventas',
      value: data?.totalVentas ?? 0,
      display: formatPrice(data?.totalVentas ?? 0),
      icon: ShoppingCart,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen del estado de la tienda</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold leading-tight">{stat.display}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Últimas ventas */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Últimas ventas
        </h2>

        {data?.lastOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay ventas aún.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orden</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.lastOrders.map((order) => {
                  const status = STATUS_CONFIG[order.status] ?? { label: order.status, className: 'bg-muted text-muted-foreground' }
                  return (
                    <tr key={order.order_number} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">
                        {formatOrderNumber(order.order_number)}
                      </td>
                      <td className="px-4 py-3">{order.customer_name}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
