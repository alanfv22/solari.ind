import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { WhatsAppFab } from '@/components/ui/whatsapp-fab'
import { Button } from '@/components/ui/button'
import { store } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Contacto | Solari Indumentaria',
  description: 'Contactanos por WhatsApp, Instagram o email. Estamos para ayudarte.',
}

const contactMethods = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'La forma más rápida de contactarnos',
    action: 'Enviar mensaje',
    href: `https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent('Hola! Me gustaría hacer una consulta.')}`,
    highlight: true,
  },
  {
    icon: Instagram,
    title: 'Instagram',
    description: '@solari.indumentaria',
    action: 'Seguinos',
    href: store.instagram_url || '#',
    highlight: false,
  },
  {
    icon: Mail,
    title: 'Email',
    description: 'info@solari.com.ar',
    action: 'Escribinos',
    href: 'mailto:info@solari.com.ar',
    highlight: false,
  },
]

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
          <h1 className="font-serif text-4xl font-medium text-foreground sm:text-5xl">
            Contactanos
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos para ayudarte. Elegí el canal que más te convenga.
          </p>
        </section>

        {/* Contact Methods */}
        <section className="mx-auto max-w-4xl px-4 pb-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center rounded-xl border p-8 text-center transition-all hover:shadow-lg ${
                  method.highlight
                    ? 'border-[#25D366] bg-[#25D366]/5 hover:border-[#25D366]'
                    : 'border-border hover:border-primary'
                }`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    method.highlight
                      ? 'bg-[#25D366] text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <method.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-medium text-foreground">
                  {method.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {method.description}
                </p>
                <span
                  className={`mt-4 text-sm font-medium ${
                    method.highlight ? 'text-[#25D366]' : 'text-primary'
                  }`}
                >
                  {method.action}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="border-t border-border bg-secondary/30 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background">
              <MapPin className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-medium text-foreground sm:text-3xl">
              Nuestra Ubicación
            </h2>
            <p className="mt-2 text-muted-foreground">{store.address}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Consultá nuestros horarios de atención por WhatsApp
            </p>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
          <h2 className="text-center font-serif text-2xl font-medium text-foreground sm:text-3xl">
            Preguntas Frecuentes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-6">
              <h3 className="font-medium text-foreground">
                ¿Hacen envíos a todo el país?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sí, enviamos a toda Argentina. Consultanos el costo de envío a tu
                localidad por WhatsApp.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6">
              <h3 className="font-medium text-foreground">
                ¿Cuáles son los medios de pago?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Aceptamos transferencia bancaria, Mercado Pago y efectivo.
                Coordinamos el pago por WhatsApp.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6">
              <h3 className="font-medium text-foreground">
                ¿Tienen cambios o devoluciones?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sí, tenés 15 días para cambiar tu producto. Consultanos las
                condiciones.
              </p>
            </div>
            <div className="rounded-lg border border-border p-6">
              <h3 className="font-medium text-foreground">
                ¿Cómo elijo mi talle?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Escribinos por WhatsApp con tus medidas y te asesoramos para que
                elijas el talle perfecto.
              </p>
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
