/** Loading placeholders using the `.shimmer` utility. */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="shimmer aspect-[4/5] rounded-2xl" />
      <div className="shimmer h-3 w-1/3 rounded" />
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="shimmer h-4 w-1/4 rounded" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
