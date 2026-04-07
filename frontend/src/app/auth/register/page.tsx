"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!email.trim()) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }

    if (phone && !/^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 8) {
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Mật khẩu phải có ít nhất 1 ký tự in hoa";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Mật khẩu phải có ít nhất 1 chữ số";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    });

    if (result.success) {
      router.push("/");
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6"
            aria-label="VN Fashion - Trang chủ"
          >
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">VN</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Fashion
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Đăng ký để trải nghiệm mua sắm tốt hơn cùng VN Fashion.
          </p>
        </div>

        {/* Register form */}
        <div className="card p-6 sm:p-8">
          {error && (
            <div
              className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Họ và tên"
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setValidationErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              leftIcon={<User className="h-4 w-4" />}
              error={validationErrors.fullName}
              required
              autoComplete="name"
              aria-label="Họ và tên"
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: "" }));
              }}
              leftIcon={<Mail className="h-4 w-4" />}
              error={validationErrors.email}
              required
              autoComplete="email"
              aria-label="Địa chỉ email"
            />

            <Input
              label="Số điện thoại"
              type="tel"
              placeholder="0901 234 567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setValidationErrors((prev) => ({ ...prev, phone: "" }));
              }}
              leftIcon={<Phone className="h-4 w-4" />}
              error={validationErrors.phone}
              helperText="Tùy chọn - Dùng để nhận thông báo đơn hàng"
              autoComplete="tel"
              aria-label="Số điện thoại"
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, password: "" }));
              }}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={validationErrors.password}
              required
              autoComplete="new-password"
              aria-label="Mật khẩu"
            />

            <Input
              label="Xác nhận mật khẩu"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={validationErrors.confirmPassword}
              required
              autoComplete="new-password"
              aria-label="Xác nhận mật khẩu"
            />

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <Link
                href="/terms"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Chính sách bảo mật
              </Link>{" "}
              của chúng tôi.
            </div>

            <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
              Tạo tài khoản
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
