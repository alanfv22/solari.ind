import { AdminSidebar } from '@/components/admin/sidebar-nav'
import { Toaster } from '@/components/ui/sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
