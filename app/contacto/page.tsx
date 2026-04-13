import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { 
  fetchStoreWhatsAppNumber, 
  getFallbackWhatsAppDigits 
} from '@/lib/store-contact'
import { ContactMethodCards } from '@/components/contact/contact-method-cards'

export const metadata: Metadata = {
  title: 'Contacto | Solari Indumentaria',
  description: 'Contactanos por WhatsApp o Instagram. Estamos para ayudarte.',
}

export default async function ContactoPage() {
  const fromDb = await fetchStoreWhatsAppNumber()
  const digits = fromDb || getFallbackWhatsAppDigits()

  const whatsappMessage = encodeURIComponent('¡Hola! Me gustaría hacer una consulta.')
  const whatsappHref = digits 
    ? `https://wa.me/${digits}?text=${whatsappMessage}` 
    : '#'

  // DIRECCIÓN ACTUALIZADA
  const displayAddress = "Ontiveros 30 (Maq. Savio, Escobar)"
  const mapQuery = "Ontiveros 30, Maquinista Savio, Provincia de Buenos Aires"
  
  // URL para el Iframe con el marcador
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`
  
  // URL para el botón externo
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
          <h1 className="font-serif text-4xl font-medium text-foreground sm:text-5xl">
            Contactanos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos para ayudarte. Elegí el canal que más te convenga.
          </p>
        </section>

        <ContactMethodCards
          whatsappHref={whatsappHref}
          instagramHref="https://instagram.com/solari.ind"
        />

        <section className="border-t border-border bg-secondary/30 py-16">
          <div className="mx-auto max-w-5xl px-4 text-center lg:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background mb-6 shadow-sm">
              <MapPin className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="font-serif text-3xl font-medium text-foreground">
              Nuestra Ubicación
            </h2>
            <p className="mt-2 text-lg text-muted-foreground mb-8">
              {displayAddress}
            </p>

            <div className="group relative overflow-hidden rounded-2xl border border-border bg-background shadow-lg transition-all hover:shadow-xl">
              <iframe
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={mapEmbedUrl}
                title="Ubicación Solari"
                className="grayscale-[0.1] contrast-[1.05]"
              ></iframe>
              
              <a 
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10 cursor-pointer flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="bg-foreground text-background px-6 py-3 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  VER EN GOOGLE MAPS
                </div>
              </a>
            </div>
            
            <p className="mt-6 text-sm text-muted-foreground italic">
              Hacé clic en el mapa para obtener indicaciones exactas.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
          <h2 className="text-center font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Preguntas Frecuentes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-6 bg-background">
              <h3 className="font-medium text-foreground">¿Hacen envíos a todo el país?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Sí, enviamos a toda Argentina. Consultanos el costo según tu zona.</p>
            </div>
            <div className="rounded-lg border border-border p-6 bg-background">
              <h3 className="font-medium text-foreground">¿Se puede retirar en el local?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Sí, podés pasar por Ontiveros 30 coordinando previamente por WhatsApp.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFab />
    </>
  )
}