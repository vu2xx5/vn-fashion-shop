"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";
import type { Product } from "@/types";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await getProduct(slug);
        setProduct(response.data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container-custom section-padding">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[3/4] skeleton rounded-xl" />
          <div className="space-y-4">
            <div className="h-6 skeleton w-1/3" />
            <div className="h-8 skeleton w-2/3" />
            <div className="h-10 skeleton w-1/4" />
            <div className="h-4 skeleton w-full" />
            <div className="h-4 skeleton w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-custom section-padding text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-3xl" aria-hidden="true">404</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Khong tim thay san pham
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            San pham ban tim kiem khong ton tai hoac da bi xoa.
          </p>
          <a
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay lai cua hang
          </a>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
