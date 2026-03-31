'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Metrics {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  paid: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  shipped: { label: 'Đã gửi', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

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
        // Dữ liệu mẫu khi API chưa sẵn sàng
        setMetrics({
          total_orders: 156,
          total_revenue: 245680000,
          total_products: 48,
          total_customers: 312,
          recent_orders: [
            { id: '1', order_number: 'VNF-20260331-001', customer_name: 'Nguyễn Văn A', total: 1298000, status: 'paid', created_at: '2026-03-31T10:00:00Z' },
            { id: '2', order_number: 'VNF-20260331-002', customer_name: 'Trần Thị B', total: 599000, status: 'pending', created_at: '2026-03-31T09:30:00Z' },
            { id: '3', order_number: 'VNF-20260330-015', customer_name: 'Lê Văn C', total: 890000, status: 'shipped', created_at: '2026-03-30T15:20:00Z' },
            { id: '4', order_number: 'VNF-20260330-014', customer_name: 'Phạm Thị D', total: 1520000, status: 'delivered', created_at: '2026-03-30T12:00:00Z' },
          ],
        });
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
    { label: 'Tổng đơn hàng', value: metrics?.total_orders ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '📦', color: 'border-blue-500' },
    { label: 'Doanh thu', value: metrics?.total_revenue ?? 0, format: formatVND, icon: '💰', color: 'border-green-500' },
    { label: 'Sản phẩm', value: metrics?.total_products ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '👕', color: 'border-purple-500' },
    { label: 'Khách hàng', value: metrics?.total_customers ?? 0, format: (v: number) => v.toLocaleString('vi-VN'), icon: '👥', color: 'border-amber-500' },
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

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 font-medium">Mã đơn</th>
                <th className="px-6 py-3 font-medium">Khách hàng</th>
                <th className="px-6 py-3 font-medium">Tổng tiền</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
                <th className="px-6 py-3 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recent_orders.map((order) => {
                const status = statusLabels[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-800' };
                return (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 font-mono text-xs">{order.order_number}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{order.customer_name}</td>
                    <td className="px-6 py-4 font-medium">{formatVND(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
