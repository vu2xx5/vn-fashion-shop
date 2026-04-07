"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/components/cart/CartItem";
import { useCartStore } from "@/stores/cart";

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, itemCount, subtotal } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const count = itemCount();
  const total = subtotal();

  // Focus trap + restore focus on close
  useEffect(() => {
    if (isDrawerOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the drawer after transition
      const timer = setTimeout(() => {
        drawerRef.current?.focus();
      }, 100);
      // Lock body scroll
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
      };
    } else {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    }
  }, [isDrawerOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
      }

      // Simple focus trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    },
    [closeDrawer]
  );

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Giỏ hàng (${count} sản phẩm)`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-900",
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Giỏ hàng ({count})
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Đóng giỏ hàng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items list */}
        {items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <CartItem item={item} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tạm tính
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(total)}
                </span>
              </div>
              <Link href="/checkout" onClick={closeDrawer}>
                <Button variant="primary" size="lg" fullWidth>
                  Thanh toán
                </Button>
              </Link>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                Miễn phí vận chuyển cho đơn hàng từ {formatPrice(500000)}
              </p>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <div className="text-center">
              <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                Giỏ hàng trống
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Hãy khám phá các sản phẩm của chúng tôi!
              </p>
            </div>
            <Link href="/products" onClick={closeDrawer}>
              <Button variant="primary" size="md">
                Mua sắm ngay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
