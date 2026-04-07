"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  LogOut,
  Edit3,
  Plus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getOrders, getAddresses, deleteAddress, addAddress, updateProfile } from "@/lib/api";
import type { Order, Address } from "@/types";

type Tab = "orders" | "addresses" | "info";

const statusBadgeVariant: Record<string, "warning" | "info" | "purple" | "success" | "danger" | "gray"> = {
  pending: "warning",
  paid: "info",
  shipped: "purple",
  delivered: "success",
  cancelled: "danger",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, loadProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    streetAddress: "",
    ward: "",
    district: "",
    province: "",
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadOrders() {
      setIsLoadingOrders(true);
      try {
        const res = await getOrders(1, 20);
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch {
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    async function loadAddresses() {
      setIsLoadingAddresses(true);
      try {
        const res = await getAddresses();
        setAddresses(Array.isArray(res.data) ? res.data : []);
      } catch {
        setAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    }

    loadOrders();
    loadAddresses();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // ignore
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.streetAddress || !addressForm.ward || !addressForm.district || !addressForm.province) return;
    setIsAddingAddress(true);
    try {
      const res = await addAddress({
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        streetAddress: addressForm.streetAddress,
        ward: addressForm.ward,
        district: addressForm.district,
        province: addressForm.province,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, res.data]);
      setAddressForm({ fullName: "", phone: "", streetAddress: "", ward: "", district: "", province: "" });
      setShowAddressForm(false);
    } catch {
      // ignore
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleEditProfile = () => {
    setProfileForm({ fullName: user?.fullName || "", phone: user?.phone || "" });
    setProfileError(null);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await updateProfile({ fullName: profileForm.fullName.trim(), phone: profileForm.phone.trim() || undefined });
      // Reload profile to update user state
      await loadProfile();
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container-custom section-padding">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 skeleton rounded-full" />
              <div className="space-y-2">
                <div className="h-5 skeleton w-40" />
                <div className="h-4 skeleton w-56" />
              </div>
            </div>
          </div>
          <div className="card p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "orders", label: "Đơn hàng", icon: Package },
    { id: "addresses", label: "Địa chỉ", icon: MapPin },
    { id: "info", label: "Thông tin", icon: User },
  ];

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
          <li className="text-gray-900 dark:text-white font-medium">Tài khoản</li>
        </ol>
      </nav>

      <div className="max-w-4xl mx-auto">
        {/* User header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.fullName}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {user.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Thành viên từ {formatDate(user.createdAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="h-4 w-4" />}
              className="shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6" role="tablist" aria-label="Trang cá nhân">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders tab */}
        {activeTab === "orders" && (
          <div id="panel-orders" role="tabpanel">
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card p-4 h-24 skeleton" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chưa có đơn hàng
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Bạn chưa đặt đơn hàng nào. Hãy khám phá sản phẩm của chúng tôi!
                </p>
                <Link href="/products">
                  <Button>Mua sắm ngay</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = getOrderStatusLabel(order.orderStatus);
                  const variant = statusBadgeVariant[order.orderStatus] ?? "gray";

                  return (
                    <div key={order.id} className="card p-4 sm:p-6 hover:shadow-soft transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Đơn hàng #{order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Đặt ngày {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <Badge variant={variant} dot>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-700 dark:text-gray-300 truncate">
                                {item.productName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.variantInfo} x{item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white shrink-0">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{order.items.length - 2} sản phẩm khác
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Tổng: {formatPrice(order.total)}
                        </span>
                        <Link
                          href={`/profile/orders/${order.id}`}
                          className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                        >
                          Chi tiết
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Addresses tab */}
        {activeTab === "addresses" && (
          <div id="panel-addresses" role="tabpanel">
            {isLoadingAddresses ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="card p-4 h-24 skeleton" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {addr.fullName}
                        {addr.isDefault && (
                          <Badge variant="primary" size="sm">
                            Mặc định
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {addr.phone}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" aria-label={`Chỉnh sửa địa chỉ ${addr.fullName}`}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label={`Xóa địa chỉ ${addr.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {showAddressForm ? (
                  <div className="card p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Thêm địa chỉ mới
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Họ và tên"
                        placeholder="Nguyễn Văn A"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        required
                      />
                      <Input
                        label="Số điện thoại"
                        placeholder="0901 234 567"
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <Input
                      label="Địa chỉ"
                      placeholder="Số nhà, tên đường"
                      value={addressForm.streetAddress}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, streetAddress: e.target.value }))}
                      required
                    />
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Input
                        label="Phường/Xã"
                        placeholder="Phường"
                        value={addressForm.ward}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, ward: e.target.value }))}
                        required
                      />
                      <Input
                        label="Quận/Huyện"
                        placeholder="Quận"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                        required
                      />
                      <Input
                        label="Tỉnh/Thành phố"
                        placeholder="TP. Hồ Chí Minh"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={handleAddAddress} isLoading={isAddingAddress}>
                        Lưu địa chỉ
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAddressForm(false)}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 hover:border-primary-400 dark:hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ mới
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info tab */}
        {activeTab === "info" && (
          <div id="panel-info" role="tabpanel">
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Thông tin cá nhân
                </h2>
                {!isEditingProfile && (
                  <Button variant="ghost" size="sm" leftIcon={<Edit3 className="h-4 w-4" />} onClick={handleEditProfile}>
                    Chỉnh sửa
                  </Button>
                )}
              </div>

              {profileError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300" role="alert">
                  {profileError}
                </div>
              )}

              {isEditingProfile ? (
                <div className="space-y-4">
                  <Input
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    placeholder="0901 234 567"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                      Lưu thay đổi
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Họ và tên</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {user.email}
                      {user.isEmailVerified && (
                        <Badge variant="success" size="sm">Đã xác thực</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Số điện thoại</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ngày tham gia</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
