'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: { name: string } | null;
  isActive: boolean;
  stock: number;
  images: Array<{ url: string; alt: string; isPrimary?: boolean }>;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await apiClient.get<{ data: AdminProduct[]; pagination: { total: number } }>('/admin/products');
        setProducts(res.data || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý sản phẩm</h1>
        <Button variant="primary" size="sm">
          + Thêm sản phẩm
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 font-medium">Sản phẩm</th>
                  <th className="px-6 py-3 font-medium">Danh mục</th>
                  <th className="px-6 py-3 font-medium">Giá</th>
                  <th className="px-6 py-3 font-medium">Tồn kho</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {primaryImg && (
                            <img
                              src={primaryImg.url}
                              alt={primaryImg.alt}
                              className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                              loading="lazy"
                            />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {product.category?.name || '—'}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatVND(product.price)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            product.stock > 20
                              ? 'text-green-600 dark:text-green-400'
                              : product.stock > 0
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-medium"
                            aria-label={`Sửa ${product.name}`}
                          >
                            Sửa
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-medium"
                            aria-label={`Xóa ${product.name}`}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
