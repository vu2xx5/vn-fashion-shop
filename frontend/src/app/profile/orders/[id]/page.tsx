"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getOrder } from "@/lib/api";
import type { Order } from "@/types";

const statusBadgeVariant: Record<string, "warning" | "info" | "purple" | "success" | "danger" | "gray"> = {
  pending: "warning",
  paid: "info",
  shipped: "purple",
  delivered: "success",
  cancelled: "danger",
};

const paymentMethodLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  credit_card: "Thẻ tín dụng / ghi nợ",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const shippingMethodLabels: Record<string, string> = {
  standard: "Giao hàng tiêu chuẩn",
  express: "Giao hàng nhanh",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !orderId) return;

    async function loadOrder() {
      setIsLoading(true);
      try {
        const res = await getOrder(orderId);
        setOrder(res.data);
      } catch {
        setError("Không tìm thấy đơn hàng hoặc đã xảy ra lỗi.");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [isAuthenticated, orderId]);

  if (authLoading || isLoading) {
    return (
      <div className="container-custom section-padding">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-8 skeleton w-48 mb-6" />
          <div className="card p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-custom section-padding">
        <div className="max-w-3xl mx-auto text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || "Không tìm thấy đơn hàng"}
          </h2>
          <Link href="/profile">
            <Button leftIcon={<ArrowLeft className="h-4 w-4" />} className="mt-4">
              Quay lại tài khoản
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = getOrderStatusLabel(order.orderStatus);
  const variant = statusBadgeVariant[order.orderStatus] ?? "gray";

  return (
    <div className="container-custom section-padding">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <li>
            <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li>
            <Link href="/profile" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Tài khoản
            </Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="text-gray-900 dark:text-white font-medium">
            Đơn hàng #{order.orderNumber}
          </li>
        </ol>
      </nav>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Đơn hàng #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Đặt ngày {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge variant={variant} dot size="lg">
            {status.label}
          </Badge>
        </div>

        {/* Order Items */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Sản phẩm đã đặt
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 sm:p-6">
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.variantInfo}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Số lượng: {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(item.totalPrice)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatPrice(item.unitPrice)} / cái
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Summary */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Tạm tính</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Phí vận chuyển</span>
              <span>{order.shippingCost === 0 ? "Miễn phí" : formatPrice(order.shippingCost)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Giảm giá</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Tổng cộng</span>
              <span className="text-primary-600 dark:text-primary-400 text-lg">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Địa chỉ giao hàng
              </h2>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {order.shippingAddress.phone}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {order.shippingAddress.streetAddress}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {order.shippingAddress.ward}, {order.shippingAddress.district}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {order.shippingAddress.province}
              </p>
            </div>
          </div>

          {/* Shipping & Payment Info */}
          <div className="card p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Phương thức vận chuyển
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {shippingMethodLabels[order.shippingMethod] ?? order.shippingMethod}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Thanh toán
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Trạng thái: {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {order.note && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
              Ghi chú đơn hàng
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{order.note}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Quay lại tài khoản
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
