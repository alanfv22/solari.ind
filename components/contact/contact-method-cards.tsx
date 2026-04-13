'use client'

import { motion } from 'framer-motion'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Logos oficiales SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#fdf497', stopOpacity: 1 }} />
        <stop offset="45%" style={{ stopColor: '#fd5949', stopOpacity: 1 }} />
        <stop offset="60%" style={{ stopColor: '#d6249f', stopOpacity: 1 }} />
        <stop offset="90%" style={{ stopColor: '#285AEB', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.012 3.584-.069 4.85c-.054 1.17-.249 1.805-.415 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.415-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.012-3.584.069-4.85c.054-1.17.249-1.805.415-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.266-.057 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.132 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.789.717 1.459 1.384 2.126s1.384 1.078 2.172 1.384c.765.297 1.636.498 2.913.558 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.06 2.148-.261 2.913-.558.789-.306 1.459-.717 2.126-1.384s1.078-1.384 1.384-2.126c.297-.765.498-1.636.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.261-2.148-.558-2.913-.306-.789-.717-1.459-1.384-2.126s-1.384-1.078-2.126-1.384c-.765-.297-1.636-.498-2.913-.558C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4.162 4.162 0 110-8.324 4.162 4.162 0 010 8.324zM18.406 4.162a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
  </svg>
)

interface ContactMethodCardsProps {
  whatsappHref: string
  instagramHref: string
}

export function ContactMethodCards({ whatsappHref, instagramHref }: ContactMethodCardsProps) {
  const contactMethods = [
    {
      icon: WhatsAppIcon,
      title: 'WhatsApp',
      description: 'Chateá con nosotros para asesoramiento inmediato.',
      href: whatsappHref,
      buttonText: 'Enviar mensaje',
      cardBorderColor: 'border-t-4 border-t-[#25D366]',
      headerBg: 'bg-[#25D366]/5',
      iconClass: 'text-[#25D366]',
    },
    {
      icon: InstagramIcon,
      title: 'Instagram',
      description: 'Seguinos para ver las últimas novedades y MD.',
      href: instagramHref,
      buttonText: 'Ver perfil',
      cardBorderColor: 'border-t-4 border-t-[#E1306C]',
      headerBg: 'bg-[#E1306C]/5',
      iconClass: '',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="flex flex-wrap justify-center gap-8">
        {contactMethods.map((method, index) => {
          const Icon = method.icon
          return (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
              className={cn(
                "w-full max-w-sm rounded-2xl border border-border bg-background shadow-sm overflow-hidden transition-all hover:shadow-lg",
                method.cardBorderColor
              )}
            >
              <div className={cn("p-8 flex flex-col items-center text-center", method.headerBg)}>
                <div className="mb-6 rounded-full bg-background p-5 shadow-inner">
                  <Icon className={cn("h-10 w-10", method.iconClass)} />
                </div>
                <h2 className="font-serif text-3xl font-medium text-foreground">
                  {method.title}
                </h2>
              </div>
              
              <div className="p-8 pt-6 flex flex-col items-center text-center">
                <p className="mb-8 text-base text-muted-foreground leading-relaxed">
                  {method.description}
                </p>
                <a
                  href={method.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'default' }), // Cambiado a 'default' (fondo negro)
                    "w-full mt-auto h-12 text-base font-medium"
                  )}
                >
                  {method.buttonText}
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}