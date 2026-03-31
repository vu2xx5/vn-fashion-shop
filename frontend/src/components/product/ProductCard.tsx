"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  const uniqueColors = product.colors ?? [];

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg",
        "bg-white dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-800",
        "transition-shadow duration-300 hover:shadow-lg dark:hover:shadow-gray-900/50",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {primaryImage && (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500",
              "group-hover:scale-105"
            )}
            loading="lazy"
          />
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}

        {/* Quick add button on hover */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300",
            "translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          <Button
            variant="primary"
            size="sm"
            fullWidth
            leftIcon={<ShoppingBag className="h-4 w-4" />}
            onClick={handleQuickAdd}
            aria-label={`Th\u00eam ${product.name} v\u00e0o gi\u1ecf h\u00e0ng`}
          >
            Th\u00eam v\u00e0o gi\u1ecf
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Color dots */}
        {uniqueColors.length > 0 && (
          <div className="flex items-center gap-1.5" aria-label="M\u00e0u s\u1eafc c\u00f3 s\u1eb5n">
            {uniqueColors.map((color) => (
              <span
                key={color.id}
                className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={color.name}
              />
            ))}
          </div>
        )}

        {/* Product name */}
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-gray-400 line-through dark:text-gray-500">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
