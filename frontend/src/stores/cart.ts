import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, CartItem, Size, Color, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
  shipping: () => number;
  tax: () => number;
  total: () => number;

  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    selectedSize?: Size,
    selectedColor?: Color,
    variant?: ProductVariant
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const FREE_SHIPPING_THRESHOLD = 500000; // 500.000₫
const STANDARD_SHIPPING = 30000; // 30.000₫
const TAX_RATE = 0; // Vietnam VAT is included in displayed prices

function generateCartItemId(
  productId: string,
  sizeId?: string,
  colorId?: string
): string {
  return `${productId}-${sizeId || "none"}-${colorId || "none"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      subtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.variant?.price ?? item.product.price;
          return sum + price * item.quantity;
        }, 0);
      },

      shipping: () => {
        const subtotal = get().subtotal();
        if (subtotal === 0) return 0;
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
      },

      tax: () => {
        return Math.round(get().subtotal() * TAX_RATE);
      },

      total: () => {
        return get().subtotal() + get().shipping() + get().tax();
      },

      addItem: (product, quantity = 1, selectedSize, selectedColor, variant) => {
        set((state) => {
          const itemId = generateCartItemId(
            product.id,
            selectedSize?.id,
            selectedColor?.id
          );
          const existingIndex = state.items.findIndex(
            (item) => item.id === itemId
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + quantity,
            };
            return { items: updated, isDrawerOpen: true };
          }

          const newItem: CartItem = {
            id: itemId,
            product,
            variant,
            quantity,
            selectedSize,
            selectedColor,
          };

          return { items: [...state.items, newItem], isDrawerOpen: true };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    }),
    {
      name: "vn-fashion-cart",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // SSR fallback
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
