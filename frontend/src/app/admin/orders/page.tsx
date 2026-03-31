'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  items_count: number;
  created_at: string;
}

const statusOptions = [
  { value: 'pending', label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'paid', label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'shipped', label: 'Đã gửi hàng', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'delivered', label: 'Đã giao', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
];

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function getStatusInfo(status: string) {
  return statusOptions.find((s) => s.value === status) ?? { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const params = filter !== 'all' ? `?status=${filter}` : '';
        const data = await apiClient.get<{ items?: AdminOrder[] }>(`/admin/orders${params}`);
        setOrders(data.items || data as unknown as AdminOrder[]);
      } catch {
        setOrders([
          { id: '1', order_number: 'VNF-20260331-001', customer_name: 'Nguyễn Văn A', customer_email: 'nguyenvana@email.com', total: 1298000, status: 'paid', items_count: 3, created_at: '2026-03-31T10:00:00Z' },
          { id: '2', order_number: 'VNF-20260331-002', customer_name: 'Trần Thị B', customer_email: 'tranthib@email.com', total: 599000, status: 'pending', items_count: 1, created_at: '2026-03-31T09:30:00Z' },
          { id: '3', order_number: 'VNF-20260330-015', customer_name: 'Lê Văn C', customer_email: 'levanc@email.com', total: 890000, status: 'shipped', items_count: 2, created_at: '2026-03-30T15:20:00Z' },
          { id: '4', order_number: 'VNF-20260330-014', customer_name: 'Phạm Thị D', customer_email: 'phamthid@email.com', total: 1520000, status: 'delivered', items_count: 4, created_at: '2026-03-30T12:00:00Z' },
          { id: '5', order_number: 'VNF-20260329-008', customer_name: 'Hoàng Văn E', customer_email: 'hoangvane@email.com', total: 250000, status: 'cancelled', items_count: 1, created_at: '2026-03-29T08:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [filter]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await apiClient.put<unknown>(`/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Không thể cập nhật trạng thái:', err);
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý đơn hàng</h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Tất cả ({orders.length})
          </button>
          {statusOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Không có đơn hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 font-medium">Mã đơn</th>
                  <th className="px-6 py-3 font-medium">Khách hàng</th>
                  <th className="px-6 py-3 font-medium">SP</th>
                  <th className="px-6 py-3 font-medium">Tổng tiền</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Ngày tạo</th>
                  <th className="px-6 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.customer_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{order.items_count}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {formatVND(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          aria-label={`Cập nhật trạng thái đơn ${order.order_number}`}
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
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
