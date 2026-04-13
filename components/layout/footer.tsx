import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { store } from '@/lib/mock-data'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo.jpg"
                alt="Solari"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight leading-none">
                  SOLARI
                </span>
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground">
                  INDUMENTARIA
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Moda premium con estilo que te define. Descubrí nuestra colección
              exclusiva para mujer y hombre.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4">
            <h3 className="font-medium text-foreground">Navegación</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicio
              </Link>
              <Link
                href="/catalogo"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Catálogo
              </Link>
              <Link
                href="/nosotros"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Nosotros
              </Link>
              <Link
                href="/contacto"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contacto
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-medium text-foreground">Contacto</h3>
            <div className="flex flex-col gap-3">
              {store.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{store.address}</span>
                </div>
              )}
              <a
                href={`mailto:info@solari.com.ar`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@solari.com.ar</span>
              </a>
              {store.instagram_url && (
                <a
                  href={store.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>@solari.indumentaria</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Solari Indumentaria. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
