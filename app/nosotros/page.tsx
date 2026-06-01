import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Nosotros | Solari Indumentaria',
  description: 'Conocé la historia de Solari Indumentaria. Moda premium con estilo argentino.',
}

export default function NosotrosPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero — gradiente negro hasta que haya foto del local */}
        <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-serif text-4xl font-medium text-white sm:text-5xl lg:text-6xl">
                Nuestra Historia
              </h1>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8 lg:py-24">
          <div className="prose prose-lg mx-auto text-foreground">
            <p className="text-xl leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Solari Indumentaria</strong> En Solari Indumentaria creemos que vestirse bien no tiene por qué ser complicado. Tenemos el objetivo de ofrecer prendas seleccionadas con estilo, calidad y precios accesibles para acompañar a cada persona en su día a día.
Somos un emprendimiento familiar que trabaja con dedicación para brindar una atención cercana y personalizada, ayudando a que cada cliente encuentre lo que busca y se sienta cómodo con su elección.
Más que vender ropa, buscamos crear una experiencia de compra simple, confiable y agradable, donde cada detalle está pensado con cariño.
Nació con una misión clara: ofrecer moda y calidad a un increíble precio. Te ayudamos y asesoramos con la mejor atención tanto presencial como online.
Somos Sol y Ariel, dos hermanos animándose a emprender y junto a ustedes formamos lo que es SOLARI indumentaria.</p>

            <div className="my-16 grid gap-8 md:grid-cols-2">
              {/* Placeholder — reemplazar con foto real del local */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="text-sm text-slate-400 font-medium">Foto del local</span>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                <span className="text-sm text-slate-400 font-medium">Foto del local</span>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                Nuestro Compromiso
              </h2>
              <ul className="mt-4 space-y-3 text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong className="text-foreground">Calidad sin compromisos:</strong> Seleccionamos
                    materiales premium para cada prenda.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong className="text-foreground">Atención personalizada:</strong> Te asesoramos
                    para que encuentres exactamente lo que buscás.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong className="text-foreground">Precios justos:</strong> Moda premium accesible,
                    sin intermediarios.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-secondary/30 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
            <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Descubrí nuestra colección
            </h2>
            <p className="mt-4 text-muted-foreground">
              Explorá las prendas que van a definir tu estilo esta temporada.
            </p>
            <Button asChild size="lg" className="mt-6 gap-2">
              <Link href="/catalogo">
                Ver catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}
