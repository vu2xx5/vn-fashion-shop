'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  // snake_case aliases from backend
  total_orders?: number;
  total_revenue?: number;
  total_products?: number;
  total_customers?: number;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await apiClient.get<Metrics>('/admin/metrics');
        setMetrics(data);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Tổng đơn hàng', value: metrics?.totalOrders ?? metrics?.total_orders ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '📦', color: 'border-blue-500' },
    { label: 'Doanh thu', value: metrics?.totalRevenue ?? metrics?.total_revenue ?? 0, format: formatVND, icon: '💰', color: 'border-green-500' },
    { label: 'Sản phẩm', value: metrics?.totalProducts ?? metrics?.total_products ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '👕', color: 'border-purple-500' },
    { label: 'Khách hàng', value: metrics?.totalCustomers ?? metrics?.total_customers ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '👥', color: 'border-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 ${card.color} shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{card.label}</span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.format(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quản lý</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/admin/orders" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Đơn hàng</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Xem và quản lý đơn hàng</p>
            </div>
          </a>
          <a href="/admin/products" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <span className="text-2xl">👕</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sản phẩm</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý kho sản phẩm</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
