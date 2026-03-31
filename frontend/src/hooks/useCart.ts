"use client";

import { useCartStore } from "@/stores/cart";
import type { Product, Size, Color, ProductVariant } from "@/types";

/**
 * Cart hook that provides a clean interface over the Zustand cart store.
 * Memoizes computed values and provides convenient action methods.
 */
export function useCart() {
  const items = useCartStore((s) => s.items);
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  // Use the store's computed methods
  const itemCount = useCartStore((s) => s.itemCount)();
  const subtotal = useCartStore((s) => s.subtotal)();
  const shipping = useCartStore((s) => s.shipping)();
  const tax = useCartStore((s) => s.tax)();
  const total = useCartStore((s) => s.total)();

  const addToCart = (
    product: Product,
    quantity?: number,
    selectedSize?: Size,
    selectedColor?: Color,
    variant?: ProductVariant
  ) => {
    addItem(product, quantity, selectedSize, selectedColor, variant);
  };

  const isInCart = (productId: string): boolean => {
    return items.some((item) => item.product.id === productId);
  };

  const getItemQuantity = (productId: string): number => {
    return items
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return {
    items,
    itemCount,
    subtotal,
    shipping,
    tax,
    total,
    isDrawerOpen,
    isEmpty: items.length === 0,

    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    isInCart,
    getItemQuantity,
  };
}
