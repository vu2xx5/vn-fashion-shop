"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
  className?: string;
}

export function CartItem({ item, className }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const price = item.variant?.price ?? item.product.price;
  const lineTotal = price * item.quantity;
  const primaryImage = item.product.images.find((img) => img.isPrimary) ?? item.product.images[0];

  const variantInfo = [item.selectedSize?.name, item.selectedColor?.name]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Thumbnail */}
      {primaryImage && (
        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || item.product.name}
            fill
            sizes="64px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {item.product.name}
            </h3>
            {variantInfo && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{variantInfo}</p>
            )}
          </div>
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="flex-shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            aria-label={`X\u00f3a ${item.product.name} kh\u1ecfi gi\u1ecf h\u00e0ng`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Price + quantity */}
        <div className="mt-auto flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-l border border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng"
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="flex h-7 w-9 items-center justify-center border-y border-gray-300 bg-white text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
              {item.quantity}
            </div>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-r border border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="T\u0103ng s\u1ed1 l\u01b0\u1ee3ng"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Prices */}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatPrice(lineTotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {formatPrice(price)}/sp
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
