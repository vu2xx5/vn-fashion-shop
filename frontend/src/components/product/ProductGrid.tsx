"use client";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Image skeleton */}
      <div className="aspect-[3/4] animate-pulse bg-gray-200 dark:bg-gray-800" />
      {/* Content skeleton */}
      <div className="flex flex-col gap-2 p-3">
        {/* Color dots */}
        <div className="flex gap-1.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Name */}
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        {/* Price */}
        <div className="mt-auto flex gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading = false, className }: ProductGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4",
          className
        )}
        aria-busy="true"
        aria-label="Dang tai san pham..."
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m n\u00e0o
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Vui l\u00f2ng th\u1eed l\u1ea1i v\u1edbi b\u1ed9 l\u1ecdc kh\u00e1c.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
