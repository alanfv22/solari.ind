'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/cart-store'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openCart, getItemCount } = useCartStore()
  const itemCount = getItemCount()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm bg-background">
            <div className="flex flex-col gap-8 pt-8">
              {/* Logo in mobile menu */}
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-2">
                  <Image
                    src="/images/logo.jpg"
                    alt="Solari"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span className="font-serif text-xl font-bold tracking-tight">
                    SOLARI
                  </span>
                </div>
              </Link>
              {/* Mobile Nav Links */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-foreground transition-colors hover:text-muted-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo - Center on mobile, left on desktop */}
        <Link href="/" className="flex items-center gap-2 lg:gap-3">
          <Image
            src="/images/logo.jpg"
            alt="Solari"
            width={44}
            height={44}
            className="rounded-full"
            priority
          />
          <div className="hidden flex-col sm:flex">
            <span className="font-serif text-xl font-bold tracking-tight leading-none">
              SOLARI
            </span>
            <span className="text-[10px] tracking-[0.2em] text-muted-foreground">
              INDUMENTARIA
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Cart Button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground"
          onClick={openCart}
        >
          <ShoppingBag className="h-6 w-6" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
              >
                {itemCount}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">Carrito ({itemCount} items)</span>
        </Button>
      </nav>
    </header>
  )
}
