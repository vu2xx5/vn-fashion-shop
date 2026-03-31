"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    total,
    isEmpty,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  if (isEmpty) {
    return (
      <div className="container-custom section-padding text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-gray-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Giỏ hàng trống
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm
            thời trang mới nhất của chúng tôi.
          </p>
          <Link href="/products">
            <Button
              size="lg"
              leftIcon={<ArrowLeft className="h-5 w-5" />}
            >
              Tiếp tục mua sắm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <li className="text-gray-900 dark:text-white font-medium">Giỏ hàng</li>
        </ol>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Giỏ hàng ({itemCount} sản phẩm)
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header - desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-6">Sản phẩm</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-3 text-right">Thành tiền</div>
            <div className="col-span-1" />
          </div>

          {items.map((item) => {
            const price = item.variant?.price ?? item.product.price;
            const primaryImage =
              item.product.images.find((img) => img.isPrimary) || item.product.images[0];

            return (
              <div
                key={item.id}
                className="card p-4 sm:p-0 sm:bg-transparent sm:shadow-none sm:border-0 sm:rounded-none sm:border-b sm:border-gray-200 sm:dark:border-gray-700 sm:pb-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Product */}
                  <div className="sm:col-span-6 flex gap-4">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="relative shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
                    >
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={primaryImage.alt || item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-sm sm:text-base font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {item.selectedColor && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
                            style={{ backgroundColor: item.selectedColor.hex }}
                            aria-hidden="true"
                          />
                          {item.selectedColor.name}
                        </p>
                      )}
                      {item.selectedSize && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Size: {item.selectedSize.name}
                        </p>
                      )}
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1 sm:hidden">
                        {formatPrice(price)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                      Số lượng:
                    </span>
                    <div className="inline-flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="hidden sm:block sm:col-span-3 text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      aria-label={`Xóa ${item.product.name} khỏi giỏ hàng`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <Link href="/products">
              <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Tiếp tục mua sắm
              </Button>
            </Link>
            <Button variant="ghost" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={clearCart}>
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tóm tắt đơn hàng
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Tạm tính ({itemCount} sản phẩm)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>Phí vận chuyển</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Miễn phí
                    </span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Miễn phí vận chuyển cho đơn hàng từ {formatPrice(500000)}
                </p>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  Tổng cộng
                </span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
            <Link href="/checkout" className="block mt-6">
              <Button
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Tiến hành thanh toán
              </Button>
            </Link>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              Thuế và phí vận chuyển được tính tại bước thanh toán
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
