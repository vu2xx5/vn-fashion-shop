"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { createOrder, getAddresses } from "@/lib/api";
import type { Address, ShippingMethod, PaymentMethod } from "@/types";

const steps = [
  { id: "address", label: "Dia chi", icon: MapPin },
  { id: "shipping", label: "Van chuyen", icon: Truck },
  { id: "payment", label: "Thanh toan", icon: CreditCard },
  { id: "confirm", label: "Xac nhan", icon: CheckCircle },
] as const;

type Step = (typeof steps)[number]["id"];

const shippingOptions: {
  id: ShippingMethod;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}[] = [
  {
    id: "standard",
    name: "Giao hàng tiêu chuẩn",
    description: "Giao hàng bởi đối tác vận chuyển",
    price: 30000,
    estimatedDays: "3-5 ngày",
  },
  {
    id: "express",
    name: "Giao hàng nhanh",
    description: "Giao hàng trong ngày hoặc ngày hôm sau",
    price: 60000,
    estimatedDays: "1-2 ngày",
  },
];

const paymentMethods: {
  id: PaymentMethod;
  name: string;
  description: string;
}[] = [
  { id: "cod", name: "Thanh toán khi nhận hàng (COD)", description: "Trả tiền mặt khi nhận được hàng" },
  { id: "bank_transfer", name: "Chuyển khoản ngân hàng", description: "Chuyển khoản qua tài khoản ngân hàng" },
  { id: "momo", name: "Ví MoMo", description: "Thanh toán qua ví điện tử MoMo" },
  { id: "vnpay", name: "VNPay", description: "Thanh toán qua cổng VNPay" },
  { id: "credit_card", name: "Thẻ tín dụng / ghi nợ", description: "Visa, Mastercard, JCB" },
];

interface AddressFormData {
  fullName: string;
  phone: string;
  streetAddress: string;
  ward: string;
  district: string;
  province: string;
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav className="mb-8" aria-label="Tiến trình thanh toán">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    isCurrent
                      ? "text-primary-600 dark:text-primary-400"
                      : isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 sm:mx-4 rounded-full",
                    index < currentIndex
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AddressStep({
  addresses,
  selectedAddressId,
  onSelectAddress,
  formData,
  onFormChange,
  useNewAddress,
  onToggleNewAddress,
  onNext,
}: {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  formData: AddressFormData;
  onFormChange: (data: Partial<AddressFormData>) => void;
  useNewAddress: boolean;
  onToggleNewAddress: (v: boolean) => void;
  onNext: () => void;
}) {
  const canProceed = useNewAddress
    ? formData.fullName && formData.phone && formData.streetAddress && formData.ward && formData.district && formData.province
    : !!selectedAddressId;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Địa chỉ giao hàng
      </h2>

      {/* Saved addresses */}
      {addresses.length > 0 && !useNewAddress && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => onSelectAddress(addr.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-colors",
                selectedAddressId === addr.id
                  ? "border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
              aria-pressed={selectedAddressId === addr.id}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {addr.fullName}
                    {addr.isDefault && (
                      <Badge variant="primary" size="sm" className="ml-2">
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
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center",
                    selectedAddressId === addr.id
                      ? "border-primary-600 dark:border-primary-400"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                >
                  {selectedAddressId === addr.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                  )}
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => onToggleNewAddress(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            + Thêm địa chỉ mới
          </button>
        </div>
      )}

      {/* New address form */}
      {(useNewAddress || addresses.length === 0) && (
        <div className="space-y-4">
          {addresses.length > 0 && (
            <button
              onClick={() => onToggleNewAddress(false)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Chọn địa chỉ đã lưu
            </button>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => onFormChange({ fullName: e.target.value })}
              required
            />
            <Input
              label="Số điện thoại"
              placeholder="0901 234 567"
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange({ phone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Địa chỉ"
            placeholder="Số nhà, tên đường"
            value={formData.streetAddress}
            onChange={(e) => onFormChange({ streetAddress: e.target.value })}
            required
          />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Phường/Xã"
              placeholder="Phường"
              value={formData.ward}
              onChange={(e) => onFormChange({ ward: e.target.value })}
              required
            />
            <Input
              label="Quận/Huyện"
              placeholder="Quận"
              value={formData.district}
              onChange={(e) => onFormChange({ district: e.target.value })}
              required
            />
            <Input
              label="Tỉnh/Thành phố"
              placeholder="TP. Hồ Chí Minh"
              value={formData.province}
              onChange={(e) => onFormChange({ province: e.target.value })}
              required
            />
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button size="lg" onClick={onNext} disabled={!canProceed} rightIcon={<ChevronRight className="h-5 w-5" />}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

function ShippingStep({
  selectedMethod,
  onSelect,
  onNext,
  onBack,
}: {
  selectedMethod: ShippingMethod | null;
  onSelect: (method: ShippingMethod) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Phương thức vận chuyển
      </h2>
      <div className="space-y-3">
        {shippingOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-colors",
              selectedMethod === option.id
                ? "border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
            aria-pressed={selectedMethod === option.id}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {option.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {option.description} - Dự kiến {option.estimatedDays}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {option.price === 0 ? "Miễn phí" : formatPrice(option.price)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Quay lại
        </Button>
        <Button size="lg" onClick={onNext} disabled={!selectedMethod} rightIcon={<ChevronRight className="h-5 w-5" />}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

function PaymentStep({
  selectedMethod,
  onSelect,
  onNext,
  onBack,
}: {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Phương thức thanh toán
      </h2>
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={cn(
              "w-full text-left p-4 rounded-xl border-2 transition-colors",
              selectedMethod === method.id
                ? "border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-950/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
            aria-pressed={selectedMethod === method.id}
          >
            <p className="font-medium text-gray-900 dark:text-white">
              {method.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {method.description}
            </p>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Quay lại
        </Button>
        <Button size="lg" onClick={onNext} disabled={!selectedMethod} rightIcon={<ChevronRight className="h-5 w-5" />}>
          Xem lại đơn hàng
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  items,
  subtotal,
  shippingMethod,
  paymentMethod,
  shippingCost,
  total,
  note,
  onNoteChange,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  shippingMethod: ShippingMethod | null;
  paymentMethod: PaymentMethod | null;
  shippingCost: number;
  total: number;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const shippingLabel = shippingOptions.find((s) => s.id === shippingMethod)?.name ?? "";
  const paymentLabel = paymentMethods.find((p) => p.id === paymentMethod)?.name ?? "";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Xác nhận đơn hàng
      </h2>

      {/* Order items */}
      <div className="card divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => {
          const price = item.variant?.price ?? item.product.price;
          const primaryImage =
            item.product.images.find((img) => img.isPrimary) || item.product.images[0];

          return (
            <div key={item.id} className="flex gap-3 p-4">
              <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                {primaryImage && (
                  <Image
                    src={primaryImage.url}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.selectedSize && `Size: ${item.selectedSize.name}`}
                  {item.selectedSize && item.selectedColor && " / "}
                  {item.selectedColor && item.selectedColor.name}
                  {" x "}{item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white shrink-0">
                {formatPrice(price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card p-4 space-y-3 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Vận chuyển ({shippingLabel})</span>
          <span>{shippingCost === 0 ? "Miễn phí" : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Thanh toán</span>
          <span>{paymentLabel}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
          <span className="font-semibold text-gray-900 dark:text-white">Tổng cộng</span>
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {/* Note */}
      <div>
        <label
          htmlFor="order-note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Ghi chú đơn hàng (tùy chọn)
        </label>
        <textarea
          id="order-note"
          rows={3}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
          className="input-base resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Quay lại
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          isLoading={isSubmitting}
          leftIcon={<CheckCircle className="h-5 w-5" />}
        >
          Đặt hàng
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, isEmpty, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    fullName: "",
    phone: "",
    streetAddress: "",
    ward: "",
    district: "",
    province: "",
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost = shippingMethod
    ? (shippingOptions.find((s) => s.id === shippingMethod)?.price ?? 0)
    : 0;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (isEmpty) {
      router.push("/cart");
      return;
    }
  }, [isEmpty, router]);

  useEffect(() => {
    async function loadAddresses() {
      if (!isAuthenticated) return;
      try {
        const res = await getAddresses();
        setAddresses(res.data);
        const defaultAddr = res.data.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      } catch {
        // ignore
      }
    }
    loadAddresses();
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!shippingMethod || !paymentMethod) return;

    setIsSubmitting(true);
    try {
      const addressId = useNewAddress ? "new" : selectedAddressId;
      if (!addressId) return;

      await createOrder({
        shippingAddressId: addressId,
        shippingMethod,
        paymentMethod,
        note: note || undefined,
      });

      clearCart();
      router.push("/profile");
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmpty) return null;

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
          <li>
            <Link href="/cart" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Giỏ hàng
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 dark:text-white font-medium">Thanh toán</li>
        </ol>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Thanh toán
      </h1>

      <div className="max-w-2xl mx-auto">
        <StepIndicator currentStep={currentStep} />

        {currentStep === "address" && (
          <AddressStep
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            formData={addressForm}
            onFormChange={(data) => setAddressForm((prev) => ({ ...prev, ...data }))}
            useNewAddress={useNewAddress}
            onToggleNewAddress={setUseNewAddress}
            onNext={() => setCurrentStep("shipping")}
          />
        )}
        {currentStep === "shipping" && (
          <ShippingStep
            selectedMethod={shippingMethod}
            onSelect={setShippingMethod}
            onNext={() => setCurrentStep("payment")}
            onBack={() => setCurrentStep("address")}
          />
        )}
        {currentStep === "payment" && (
          <PaymentStep
            selectedMethod={paymentMethod}
            onSelect={setPaymentMethod}
            onNext={() => setCurrentStep("confirm")}
            onBack={() => setCurrentStep("shipping")}
          />
        )}
        {currentStep === "confirm" && (
          <ConfirmStep
            items={items}
            subtotal={subtotal}
            shippingMethod={shippingMethod}
            paymentMethod={paymentMethod}
            shippingCost={shippingCost}
            total={total}
            note={note}
            onNoteChange={setNote}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep("payment")}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
