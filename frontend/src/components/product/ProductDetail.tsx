"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart";
import type { Product, ProductImage, Size, Color, ProductVariant } from "@/types";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const addItem = useCartStore((s) => s.addItem);

  const [selectedImage, setSelectedImage] = useState<ProductImage>(
    product.images.find((img) => img.isPrimary) ?? product.images[0]
  );
  const [selectedSize, setSelectedSize] = useState<Size | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  // Find matching variant based on selected size + color
  const activeVariant = useMemo<ProductVariant | undefined>(() => {
    if (!selectedSize && !selectedColor) return undefined;
    return product.variants.find((v) => {
      const sizeMatch = selectedSize ? v.size.id === selectedSize.id : true;
      const colorMatch = selectedColor ? v.color.id === selectedColor.id : true;
      return sizeMatch && colorMatch && v.isActive;
    });
  }, [product.variants, selectedSize, selectedColor]);

  const currentPrice = activeVariant?.price ?? product.price;
  const currentStock = activeVariant?.stock ?? product.stock;
  const discount = product.compareAtPrice
    ? calculateDiscount(currentPrice, product.compareAtPrice)
    : 0;

  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  function handleAddToCart() {
    addItem(product, quantity, selectedSize, selectedColor, activeVariant);
  }

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, currentStock)));
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Image gallery */}
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {selectedImage && (
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 rounded-md bg-red-600 px-2.5 py-1 text-sm font-semibold text-white">
              -{discount}%
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="H\u00ecnh \u1ea3nh s\u1ea3n ph\u1ea9m">
            {sortedImages.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImage(image)}
                role="option"
                aria-selected={selectedImage.id === image.id}
                className={cn(
                  "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  selectedImage.id === image.id
                    ? "border-primary-600 dark:border-primary-400"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt || ""}
                  fill
                  sizes="64px"
                  className="object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-5">
        {/* Name */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 md:text-3xl">
          {product.name}
        </h1>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(currentPrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > currentPrice && (
            <span className="text-lg text-gray-400 line-through dark:text-gray-500">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Short description */}
        {product.shortDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {product.shortDescription}
          </p>
        )}

        {/* Size selector */}
        {product.sizes.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              K\u00edch c\u1ee1
            </span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ch\u1ecdn k\u00edch c\u1ee1">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedSize?.id === size.id}
                  onClick={() =>
                    setSelectedSize(selectedSize?.id === size.id ? undefined : size)
                  }
                  className={cn(
                    "flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
                    selectedSize?.id === size.id
                      ? "border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
                  )}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color selector */}
        {product.colors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              M\u00e0u s\u1eafc
              {selectedColor && (
                <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                  - {selectedColor.name}
                </span>
              )}
            </span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ch\u1ecdn m\u00e0u s\u1eafc">
              {product.colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedColor?.id === color.id}
                  aria-label={color.name}
                  onClick={() =>
                    setSelectedColor(selectedColor?.id === color.id ? undefined : color)
                  }
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    selectedColor?.id === color.id
                      ? "border-primary-600 ring-2 ring-primary-600/30 dark:border-primary-400 dark:ring-primary-400/30"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  )}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quantity control */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            S\u1ed1 l\u01b0\u1ee3ng
          </span>
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-l-md border border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-14 items-center justify-center border-y border-gray-300 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= currentStock}
              className="flex h-10 w-10 items-center justify-center rounded-r-md border border-gray-300 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="T\u0103ng s\u1ed1 l\u01b0\u1ee3ng"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stock indicator */}
        {currentStock > 0 && currentStock <= 10 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            C\u00f2n {currentStock} s\u1ea3n ph\u1ea9m
          </p>
        )}
        {currentStock === 0 && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            H\u1ebft h\u00e0ng
          </p>
        )}

        {/* Add to cart button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<ShoppingBag className="h-5 w-5" />}
          onClick={handleAddToCart}
          disabled={currentStock === 0}
        >
          Th\u00eam v\u00e0o gi\u1ecf h\u00e0ng
        </Button>

        {/* Description */}
        {product.description && (
          <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
            <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
              M\u00f4 t\u1ea3 s\u1ea3n ph\u1ea9m
            </h2>
            <div
              className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
