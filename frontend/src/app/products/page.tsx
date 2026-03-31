"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid3X3,
  LayoutList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { getProducts, getCategories } from "@/lib/api";
import type { Product, Category, SortOption } from "@/types";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Phổ biến nhất" },
  { value: "price-asc", label: "Giá: Thấp đến cao" },
  { value: "price-desc", label: "Giá: Cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
  { value: "name-asc", label: "Tên: A-Z" },
];

const priceRanges = [
  { label: "Dưới 200.000₫", min: 0, max: 200000 },
  { label: "200.000₫ - 500.000₫", min: 200000, max: 500000 },
  { label: "500.000₫ - 1.000.000₫", min: 500000, max: 1000000 },
  { label: "Trên 1.000.000₫", min: 1000000, max: undefined },
];

function ProductFilters({
  categories,
  selectedCategory,
  selectedPriceRange,
  onCategoryChange,
  onPriceChange,
  onClear,
}: {
  categories: Category[];
  selectedCategory: string;
  selectedPriceRange: string;
  onCategoryChange: (slug: string) => void;
  onPriceChange: (range: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className="space-y-6" aria-label="Bộ lọc sản phẩm">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Danh mục
        </h3>
        <ul className="space-y-1.5" role="listbox" aria-label="Danh mục sản phẩm">
          <li>
            <button
              onClick={() => onCategoryChange("")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                !selectedCategory
                  ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              role="option"
              aria-selected={!selectedCategory}
            >
              Tất cả
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onCategoryChange(cat.slug)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedCategory === cat.slug
                    ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                role="option"
                aria-selected={selectedCategory === cat.slug}
              >
                {cat.name}
                <span className="text-gray-400 dark:text-gray-500 ml-1">
                  ({cat.productCount})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Khoảng giá
        </h3>
        <ul className="space-y-1.5" role="listbox" aria-label="Khoảng giá">
          {priceRanges.map((range) => {
            const key = `${range.min}-${range.max ?? ""}`;
            return (
              <li key={key}>
                <button
                  onClick={() => onPriceChange(key === selectedPriceRange ? "" : key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedPriceRange === key
                      ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  role="option"
                  aria-selected={selectedPriceRange === key}
                >
                  {range.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Clear filters */}
      {(selectedCategory || selectedPriceRange) && (
        <Button variant="ghost" size="sm" onClick={onClear} fullWidth>
          Xóa bộ lọc
        </Button>
      )}
    </aside>
  );
}

function ProductGridItem({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card overflow-hidden hover:shadow-soft-lg transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <span className="text-sm">Không có ảnh</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-md">
            -{discount}%
          </span>
        )}
        {!product.isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-medium text-sm">Hết hàng</span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color.id}
                className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
                aria-label={color.name}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Phân trang">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-primary-600 text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Trang ${page}`}
          >
            {page}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const currentCategory = searchParams.get("category") || "";
  const currentSort = (searchParams.get("sort") as SortOption) || "newest";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentPriceRange = searchParams.get("price") || "";
  const currentSearch = searchParams.get("search") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Reset to page 1 on filter change (unless page is being set)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getCategories();
        setCategories(res.data);
      } catch {
        // ignore
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        let minPrice: number | undefined;
        let maxPrice: number | undefined;
        if (currentPriceRange) {
          const [min, max] = currentPriceRange.split("-");
          minPrice = Number(min) || undefined;
          maxPrice = max ? Number(max) || undefined : undefined;
        }

        const res = await getProducts({
          category: currentCategory || undefined,
          sort: currentSort,
          page: currentPage,
          limit: 12,
          search: currentSearch || undefined,
          minPrice,
          maxPrice,
        });
        setProducts(res.data);
        setTotalPages(res.pagination.totalPages);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [currentCategory, currentSort, currentPage, currentPriceRange, currentSearch]);

  const activeFilterCount =
    (currentCategory ? 1 : 0) + (currentPriceRange ? 1 : 0);

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
          <li className="text-gray-900 dark:text-white font-medium">Sản phẩm</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {currentSearch ? `Kết quả cho "${currentSearch}"` : "Tất cả sản phẩm"}
        </h1>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Mở bộ lọc"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFilterCount}
            </Badge>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <ProductFilters
            categories={categories}
            selectedCategory={currentCategory}
            selectedPriceRange={currentPriceRange}
            onCategoryChange={(slug) => updateParams({ category: slug })}
            onPriceChange={(range) => updateParams({ price: range })}
            onClear={() => updateParams({ category: "", price: "" })}
          />
        </div>

        {/* Mobile filter drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileFilterOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl animate-slide-in-left overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bộ lọc
                </h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                  aria-label="Đóng bộ lọc"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <ProductFilters
                  categories={categories}
                  selectedCategory={currentCategory}
                  selectedPriceRange={currentPriceRange}
                  onCategoryChange={(slug) => {
                    updateParams({ category: slug });
                    setIsMobileFilterOpen(false);
                  }}
                  onPriceChange={(range) => {
                    updateParams({ price: range });
                    setIsMobileFilterOpen(false);
                  }}
                  onClear={() => {
                    updateParams({ category: "", price: "" });
                    setIsMobileFilterOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Product grid area */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? "Đang tải..." : `Hiển thị ${products.length} sản phẩm`}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Sắp xếp:
              </label>
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="input-base py-2 pr-8 text-sm max-w-[200px]"
                aria-label="Sắp xếp sản phẩm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {currentCategory && (
                <Badge variant="primary" size="md" className="gap-1.5">
                  Danh mục: {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                  <button
                    onClick={() => updateParams({ category: "" })}
                    aria-label="Xóa bộ lọc danh mục"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {currentPriceRange && (
                <Badge variant="primary" size="md" className="gap-1.5">
                  Giá: {priceRanges.find((r) => `${r.min}-${r.max ?? ""}` === currentPriceRange)?.label || currentPriceRange}
                  <button
                    onClick={() => updateParams({ price: "" })}
                    aria-label="Xóa bộ lọc giá"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 skeleton w-3/4" />
                    <div className="h-4 skeleton w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <SlidersHorizontal className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
              <Button
                variant="outline"
                onClick={() => updateParams({ category: "", price: "", search: "" })}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductGridItem key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => updateParams({ page: String(page) })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-custom section-padding">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-[3/4] skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-4 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
