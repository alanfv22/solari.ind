import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
        {/* Hero */}
        <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=800&fit=crop"
            alt="Solari Indumentaria - Nuestra historia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
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
              <strong className="text-foreground">Solari Indumentaria</strong> nació con una misión clara: 
              ofrecer moda premium que combine calidad, diseño y autenticidad. Creemos que la ropa 
              es mucho más que tela y costuras; es una extensión de quiénes somos.
            </p>

            <div className="my-12 grid gap-8 md:grid-cols-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=750&fit=crop"
                  alt="Moda Solari"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <Image
                  src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=750&fit=crop"
                  alt="Detalles de calidad"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Nuestra Filosofía
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              En Solari, cada prenda es seleccionada cuidadosamente pensando en vos. 
              Trabajamos con los mejores materiales y nos enfocamos en crear piezas 
              que perduren en el tiempo, tanto en calidad como en estilo.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              No seguimos tendencias pasajeras. Creamos un guardarropa esencial, 
              versátil y atemporal. Prendas que podés combinar de mil formas y 
              usar temporada tras temporada.
            </p>

            <h2 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Nuestro Compromiso
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <strong className="text-foreground">Calidad sin compromisos:</strong> Seleccionamos 
                materiales premium para cada prenda.
              </li>
              <li>
                <strong className="text-foreground">Atención personalizada:</strong> Te asesoramos 
                para que encuentres exactamente lo que buscás.
              </li>
              <li>
                <strong className="text-foreground">Precios justos:</strong> Moda premium accesible, 
                sin intermediarios.
              </li>
            </ul>
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
