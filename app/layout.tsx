import type { Metadata } from 'next'
import { Playfair_Display, Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { StoreContactSync } from '@/components/providers/store-contact-sync'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Solari Indumentaria | Moda Premium',
  description: 'Descubrí la nueva colección de Solari Indumentaria. Moda premium para mujer y hombre con estilo que te define.',
  keywords: ['moda', 'ropa', 'indumentaria', 'argentina', 'solari', 'mujer', 'hombre'],
  openGraph: {
    title: 'Solari Indumentaria | Moda Premium',
    description: 'Descubrí la nueva colección de Solari Indumentaria. Moda premium para mujer y hombre con estilo que te define.',
    type: 'website',
    locale: 'es_AR',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${manrope.variable} bg-background`}>
      <body className="font-sans antialiased">
        <StoreContactSync />
        {children}
        {/* WhatsApp FAB global — aparece en todas las páginas */}
        <WhatsAppFab />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}