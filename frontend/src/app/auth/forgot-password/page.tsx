"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
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
            Quên mật khẩu
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Email đã được gửi
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{" "}
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
                Vui lòng kiểm tra hộp thư của bạn.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                  autoComplete="email"
                  aria-label="Địa chỉ email"
                />

                <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
                  Gửi hướng dẫn đặt lại mật khẩu
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link
            href="/auth/login"
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
