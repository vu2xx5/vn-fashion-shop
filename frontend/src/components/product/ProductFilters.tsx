"use client";

import { useState, useCallback } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { ProductFilters as ProductFiltersType, SortOption, Category } from "@/types";

interface ProductFiltersProps {
  filters: ProductFiltersType;
  categories?: Category[];
  onChange: (filters: ProductFiltersType) => void;
  className?: string;
}

const SIZE_OPTIONS = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
];

const COLOR_OPTIONS = [
  { value: "white", label: "Tr\u1eafng", hex: "#FFFFFF" },
  { value: "black", label: "\u0110en", hex: "#000000" },
  { value: "navy", label: "Xanh navy", hex: "#1E3A5F" },
  { value: "beige", label: "Be", hex: "#D4C5A9" },
  { value: "pink", label: "H\u1ed3ng", hex: "#F9A8D4" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "M\u1edbi nh\u1ea5t" },
  { value: "price-asc", label: "Gi\u00e1 t\u0103ng d\u1ea7n" },
  { value: "price-desc", label: "Gi\u00e1 gi\u1ea3m d\u1ea7n" },
  { value: "popular", label: "B\u00e1n ch\u1ea1y" },
];

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, defaultOpen = true, children }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-100"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function ProductFilters({
  filters,
  categories = [],
  onChange,
  className,
}: ProductFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const updateFilter = useCallback(
    (patch: Partial<ProductFiltersType>) => {
      onChange({ ...filters, ...patch, page: 1 });
    },
    [filters, onChange]
  );

  function toggleArrayValue(arr: string[] | undefined, value: string): string[] {
    const current = arr ?? [];
    return current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  }

  function handleReset() {
    onChange({
      page: 1,
      limit: filters.limit,
    });
  }

  const hasActiveFilters = Boolean(
    filters.category ||
      (filters.sizes && filters.sizes.length > 0) ||
      (filters.colors && filters.colors.length > 0) ||
      filters.minPrice ||
      filters.maxPrice ||
      (filters.sort && filters.sort !== "newest")
  );

  const filterContent = (
    <div className="flex flex-col">
      {/* Sort */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <label
          htmlFor="sort-select"
          className="mb-2 block text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          S\u1eafp x\u1ebfp
        </label>
        <select
          id="sort-select"
          value={filters.sort ?? "newest"}
          onChange={(e) => updateFilter({ sort: e.target.value as SortOption })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <AccordionSection title="Danh m\u1ee5c">
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.category === cat.slug}
                  onChange={() =>
                    updateFilter({
                      category: filters.category === cat.slug ? undefined : cat.slug,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {cat.name}
                </span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  ({cat.productCount})
                </span>
              </label>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Sizes */}
      <AccordionSection title="K\u00edch c\u1ee1">
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => {
            const isSelected = filters.sizes?.includes(size.value) ?? false;
            return (
              <button
                key={size.value}
                type="button"
                onClick={() =>
                  updateFilter({
                    sizes: toggleArrayValue(filters.sizes, size.value),
                  })
                }
                className={cn(
                  "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-500"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                )}
                aria-pressed={isSelected}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </AccordionSection>

      {/* Colors */}
      <AccordionSection title="M\u00e0u s\u1eafc">
        <div className="flex flex-col gap-2">
          {COLOR_OPTIONS.map((color) => {
            const isSelected = filters.colors?.includes(color.value) ?? false;
            return (
              <label key={color.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    updateFilter({
                      colors: toggleArrayValue(filters.colors, color.value),
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span
                  className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {color.label}
                </span>
              </label>
            );
          })}
        </div>
      </AccordionSection>

      {/* Price range */}
      <AccordionSection title="Kho\u1ea3ng gi\u00e1">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="T\u1eeb"
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                updateFilter({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              min={0}
              step={10000}
              aria-label="Gi\u00e1 t\u1ed1i thi\u1ec3u"
            />
          </div>
          <span className="text-sm text-gray-400">-</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="\u0110\u1ebfn"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                updateFilter({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              min={0}
              step={10000}
              aria-label="Gi\u00e1 t\u1ed1i \u0111a"
            />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          \u0110\u01a1n v\u1ecb: VN\u0110
        </p>
      </AccordionSection>

      {/* Reset */}
      {hasActiveFilters && (
        <div className="pt-4">
          <Button variant="ghost" size="sm" fullWidth onClick={handleReset}>
            X\u00f3a b\u1ed9 l\u1ecdc
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          onClick={() => setIsMobileOpen(true)}
        >
          B\u1ed9 l\u1ecdc
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="absolute inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                B\u1ed9 l\u1ecdc
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="\u0110\u00f3ng b\u1ed9 l\u1ecdc"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">{filterContent}</div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block", className)}>
        {filterContent}
      </aside>
    </>
  );
}
