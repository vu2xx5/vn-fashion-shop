"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  ShoppingBag,
  Heart,
  Share2,
  Truck,
  RotateCcw,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import type { Product, Size, Color, ProductVariant } from "@/types";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");

  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentImage = sortedImages[selectedImageIndex];
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  // Find matching variant
  const selectedVariant: ProductVariant | undefined =
    selectedSize && selectedColor
      ? product.variants.find(
          (v) => v.size.id === selectedSize.id && v.color.id === selectedColor.id && v.isActive
        )
      : undefined;

  const displayPrice = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0;

  const handleAddToCart = async () => {
    if (product.sizes.length > 0 && !selectedSize) {
      setValidationError("Vui lòng chọn kích thước");
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setValidationError("Vui lòng chọn màu sắc");
      return;
    }
    setValidationError(null);
    setIsAdding(true);
    addToCart(
      product,
      quantity,
      selectedSize ?? undefined,
      selectedColor ?? undefined,
      selectedVariant
    );
    setTimeout(() => setIsAdding(false), 600);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="container-custom section-padding">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Sản phẩm
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {product.category && (
            <>
              <li>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            {currentImage ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span>Không có ảnh</span>
              </div>
            )}
            {discount > 0 && (
              <Badge variant="danger" size="lg" className="absolute top-4 left-4">
                -{discount}%
              </Badge>
            )}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors"
                  aria-label="Ảnh sau"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Ảnh sản phẩm">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-colors",
                    index === selectedImageIndex
                      ? "border-primary-600 dark:border-primary-400"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                  role="tab"
                  aria-selected={index === selectedImageIndex}
                  aria-label={`Xem ảnh ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.name} - ảnh ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${product.rating} trên 5 sao`}>
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating)
                        ? "text-amber-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {product.rating} ({product.reviewCount} đánh giá)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(displayPrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > displayPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="danger" size="md">
                  Tiết kiệm {formatPrice(product.compareAtPrice! - displayPrice)}
                </Badge>
              )}
            </div>
          </div>

          {product.shortDescription && (
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Color selector */}
          {product.colors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Màu sắc:{" "}
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  {selectedColor?.name || "Chọn màu"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn màu sắc">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => { setSelectedColor(color); setValidationError(null); }}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      selectedColor?.id === color.id
                        ? "border-primary-600 dark:border-primary-400 ring-2 ring-primary-600/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={color.name}
                    aria-checked={selectedColor?.id === color.id}
                    role="radio"
                  >
                    {selectedColor?.id === color.id && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {product.sizes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Kích thước:{" "}
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  {selectedSize?.name || "Chọn size"}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn kích thước">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => { setSelectedSize(size); setValidationError(null); }}
                    className={cn(
                      "min-w-[48px] px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      selectedSize?.id === size.id
                        ? "border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400"
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                    aria-label={`Size ${size.name}`}
                    aria-checked={selectedSize?.id === size.id}
                    role="radio"
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Số lượng
            </h3>
            <div className="inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Giảm số lượng"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white"
                aria-live="polite"
                aria-label={`Số lượng: ${quantity}`}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Tăng số lượng"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium" role="alert">
              {validationError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleAddToCart}
              isLoading={isAdding}
              disabled={!inStock}
              leftIcon={<ShoppingBag className="h-5 w-5" />}
              className="flex-1"
            >
              {!inStock ? "Hết hàng" : "Thêm vào giỏ"}
            </Button>
            <Button size="lg" variant="outline" aria-label="Thêm vào yêu thích">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="ghost" aria-label="Chia sẻ sản phẩm">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Shipping info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Truck className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span>Miễn phí vận chuyển cho đơn hàng từ 500.000₫</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <RotateCcw className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span>Đổi trả miễn phí trong 30 ngày</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span>Cam kết sản phẩm chính hãng 100%</span>
            </div>
          </div>

          {/* SKU info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span>{" "}
              {selectedVariant?.sku ?? product.sku}
            </p>
            {product.category && (
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Danh muc:</span>{" "}
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {product.category.name}
                </Link>
              </p>
            )}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tags:</span>
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description tabs */}
      <div className="mt-12 sm:mt-16">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-8" role="tablist" aria-label="Thông tin sản phẩm">
            <button
              onClick={() => setActiveTab("description")}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "description"
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              role="tab"
              aria-selected={activeTab === "description"}
              aria-controls="tab-description"
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "details"
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              role="tab"
              aria-selected={activeTab === "details"}
              aria-controls="tab-details"
            >
              Chi tiết
            </button>
          </div>
        </div>
        <div className="py-6">
          {activeTab === "description" && (
            <div
              id="tab-description"
              role="tabpanel"
              className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              <p>{product.description}</p>
            </div>
          )}
          {activeTab === "details" && (
            <div id="tab-details" role="tabpanel" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Kích thước có sẵn
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes.length > 0 ? (
                      product.sizes.map((size) => (
                        <Badge key={size.id} variant="default" size="md">
                          {size.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Freesize</span>
                    )}
                  </div>
                </div>
                <div className="card p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Màu sắc có sẵn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.length > 0 ? (
                      product.colors.map((color) => (
                        <div key={color.id} className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden="true"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{color.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Không có thông tin</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
