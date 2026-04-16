'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { fetchCategories } from '@/lib/data'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/lib/types'

export function CategoryScroll() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data)
      setIsLoading(false)
    })
  }, [])

  return (
    <section className="bg-[#F5F5F5] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-2xl font-medium text-foreground sm:text-3xl"
        >
          Categorías
        </motion.h2>
      </div>

      {/* Scrollable Container */}
      <div className="mt-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-4 lg:px-8">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-40 shrink-0 sm:w-48 lg:w-56">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                </div>
              ))
            : categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/catalogo?categoria=${category.slug}`}
                    className="group relative block w-40 overflow-hidden sm:w-48 lg:w-56"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
                      {category.image_url && (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {/* Category name overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <span className="text-sm font-medium uppercase tracking-wider text-white sm:text-base">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  )
}
