import Link from 'next/link'
import { Instagram, MapPin, MessageCircle } from 'lucide-react'
import { store } from '@/lib/mock-data'

export function Footer() {
  // Usamos el número del mock-data para evitar el async y errores de hidratación
  const whatsappNumber = store.whatsapp_number.replace(/\D/g, '')
  const whatsappHref = `https://wa.me/${whatsappNumber}`

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          
          {/* Columna 1: Branding */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Solari</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight leading-none uppercase">
                  Solari
                </span>
                <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Indumentaria
                </span>
              </div>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              Moda premium con estilo que te define. Descubrí nuestra colección exclusiva para mujer y hombre.
            </p>
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              Navegación
            </h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Inicio</Link></li>
              <li><Link href="/catalogo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Catálogo</Link></li>
              <li><Link href="/nosotros" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Nosotros</Link></li>
              <li><Link href="/contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              Contacto
            </h3>
            <ul className="flex flex-col gap-4">
              {/* WhatsApp */}
              <li className="flex items-center gap-3 group">
                <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-[#25D366] transition-colors" />
                <a 
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              
              {/* Instagram */}
              <li className="flex items-center gap-3 group">
                <Instagram className="h-4 w-4 text-muted-foreground group-hover:text-[#E1306C] transition-colors" />
                <a 
                  href="https://instagram.com/solari.ind" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  @solari.ind
                </a>
              </li>

              {/* Ubicación */}
              <li className="flex items-start gap-3 group">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm text-muted-foreground leading-snug">
                  Ontiveros 30 <br />
                  (Maq. Savio, Escobar, BSAS)
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Solari Indumentaria.
          </p>
        </div>
      </div>
    </footer>
  )
}