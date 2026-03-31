"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { getFeaturedProducts, getNewArrivals, getCategories } from "@/lib/api";
import type { Product, Category } from "@/types";

const features = [
  {
    icon: Truck,
    title: "Miễn phí vận chuyển",
    description: "Cho đơn hàng từ 500.000₫",
  },
  {
    icon: Shield,
    title: "Cam kết chính hãng",
    description: "Sản phẩm chất lượng 100%",
  },
  {
    icon: RefreshCw,
    title: "Đổi trả dễ dàng",
    description: "Trong vòng 30 ngày",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Tư vấn tận tâm",
  },
];

function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-900 dark:via-gray-900 dark:to-gray-950">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
      <div className="container-custom relative z-10 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full mb-6">
              Bộ sưu tập mới 2024
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
              Thời trang
              <span className="block text-accent-400">Phong cách Việt</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto lg:mx-0 mb-8">
              Khám phá bộ sưu tập mới nhất với thiết kế hiện đại, chất liệu cao
              cấp và giá cả hợp lý cho mọi phong cách.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/products">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Mua sắm ngay
                </Button>
              </Link>
              <Link href="/products?sort=newest">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 dark:border-white dark:text-white dark:hover:bg-white/10">
                  Xem hàng mới
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 flex items-center justify-center">
              <div className="text-center text-white/40">
                <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold">VN</span>
                </div>
                <p className="text-sm">Hero Image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBar() {
  return (
    <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container-custom py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-center gap-3 sm:gap-4"
              >
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 dark:bg-primary-950/50 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="section-padding bg-gray-50 dark:bg-gray-950">
      <div className="container-custom">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Danh mục nổi bật
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Khám phá các danh mục sản phẩm đa dạng phù hợp với mọi phong cách
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-xl aspect-[3/4] bg-gray-200 dark:bg-gray-800"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-950 dark:to-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-white/80">
                  {category.productCount} sản phẩm
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
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
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex items-center gap-0.5" aria-label={`Đánh giá ${product.rating} trên 5 sao`}>
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-3.5 w-3.5 ${
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
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function NewArrivals({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="section-padding bg-white dark:bg-gray-900">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hàng mới về
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Cập nhật xu hướng thời trang mới nhất
            </p>
          </div>
          <Link
            href="/products?sort=newest"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/products?sort=newest">
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Xem tất cả
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="bg-primary-600 dark:bg-primary-900">
      <div className="container-custom py-12 sm:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Đăng ký nhận tin khuyến mãi
          </h2>
          <p className="text-white/80 mb-6">
            Nhận ngay voucher giảm 10% cho đơn hàng đầu tiên và cập nhật các
            chương trình ưu đãi mới nhất.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-colors"
              required
              aria-label="Địa chỉ email để nhận bản tin"
            />
            <Button type="submit" variant="secondary" size="lg" className="shrink-0">
              Đăng ký
            </Button>
          </form>
          <p className="text-xs text-white/60 mt-3">
            Chúng tôi cam kết bảo mật thông tin của bạn.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [arrivalsRes, categoriesRes] = await Promise.allSettled([
          getNewArrivals(),
          getCategories(),
        ]);
        if (arrivalsRes.status === "fulfilled") {
          setNewArrivals(arrivalsRes.value.data);
        }
        if (categoriesRes.status === "fulfilled") {
          setCategories(categoriesRes.value.data);
        }
      } catch {
        // Silently handle errors - show empty state
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <HeroBanner />
      <FeatureBar />

      {isLoading ? (
        <section className="section-padding">
          <div className="container-custom">
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
        </section>
      ) : (
        <>
          <CategoryGrid categories={categories} />
          <NewArrivals products={newArrivals} />
        </>
      )}

      <NewsletterSection />
    </>
  );
}
