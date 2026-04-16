import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-md/50">
      {/* Image */}
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 pb-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1 h-5 w-24" />
        {/* Variant pills */}
        <div className="flex gap-1.5 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </div>
    </div>
  )
}
