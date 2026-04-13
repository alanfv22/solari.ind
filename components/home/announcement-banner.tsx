'use client'

import { motion } from 'framer-motion'

export function AnnouncementBanner() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-foreground py-4"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="text-center text-sm font-medium tracking-wide text-background sm:text-base">
          Nueva colección disponible — Envíos a todo el país
        </p>
      </div>
    </motion.div>
  )
}
