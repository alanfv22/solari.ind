'use client'

import { useEffect, useState } from 'react'
import { Package, PackageCheck, Tags, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/data'

interface DashboardData {
  totalProducts: number
  activeProducts: number
  totalCategories: number
  recentProducts: Array<{
    id: string
    name: string
    base_price: number
    active: boolean
    gender: string
    created_at: string
    category: { name: string } | null
  }>
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
    { label: 'Total productos', value: data?.totalProducts, icon: Package, color: 'text-blue-500' },
    {
      label: 'Productos activos',
      value: data?.activeProducts,
      icon: PackageCheck,
      color: 'text-green-500',
    },
    { label: 'Categorías', value: data?.totalCategories, icon: Tags, color: 'text-purple-500' },
    {
      label: 'Inactivos',
      value: (data?.totalProducts ?? 0) - (data?.activeProducts ?? 0),
      icon: TrendingUp,
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
                <div className="text-3xl font-bold">{stat.value ?? 0}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent products */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Productos recientes
        </h2>

        {data?.recentProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay productos aún.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                    Género
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Precio
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {p.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize hidden md:table-cell">
                      {p.gender}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatPrice(p.base_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={p.active ? 'default' : 'secondary'}>
                        {p.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                  </tr>
                ))}
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
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
