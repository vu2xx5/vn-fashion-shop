"use client";

import { useState, type FormEvent } from "react";
import { Lock, CreditCard } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PaymentFormProps {
  total: number;
  onSubmit: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PaymentForm({
  total,
  onSubmit,
  isLoading = false,
  className,
}: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const digits = cardNumber.replace(/\s/g, "");

    if (!digits || digits.length < 13) {
      newErrors.cardNumber = "S\u1ed1 th\u1ebb kh\u00f4ng h\u1ee3p l\u1ec7";
    }

    const expiryDigits = expiry.replace(/\//g, "");
    if (!expiryDigits || expiryDigits.length < 4) {
      newErrors.expiry = "Ng\u00e0y h\u1ebft h\u1ea1n kh\u00f4ng h\u1ee3p l\u1ec7";
    } else {
      const month = parseInt(expiryDigits.slice(0, 2), 10);
      if (month < 1 || month > 12) {
        newErrors.expiry = "Th\u00e1ng kh\u00f4ng h\u1ee3p l\u1ec7";
      }
    }

    const cvcDigits = cvc.replace(/\D/g, "");
    if (!cvcDigits || cvcDigits.length < 3) {
      newErrors.cvc = "M\u00e3 CVC kh\u00f4ng h\u1ee3p l\u1ec7";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-4", className)}
      noValidate
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Thanh to\u00e1n
      </h2>

      {/* Note about Stripe integration */}
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        Component n\u00e0y s\u1ebd \u0111\u01b0\u1ee3c thay th\u1ebf b\u1eb1ng Stripe Elements trong m\u00f4i tr\u01b0\u1eddng production.
      </div>

      <Input
        label="S\u1ed1 th\u1ebb"
        value={cardNumber}
        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
        error={errors.cardNumber}
        placeholder="4242 4242 4242 4242"
        leftIcon={<CreditCard className="h-4 w-4" />}
        inputMode="numeric"
        autoComplete="cc-number"
        maxLength={19}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ng\u00e0y h\u1ebft h\u1ea1n"
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          error={errors.expiry}
          placeholder="MM/YY"
          inputMode="numeric"
          autoComplete="cc-exp"
          maxLength={5}
          required
        />

        <Input
          label="CVC"
          value={cvc}
          onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
          error={errors.cvc}
          placeholder="123"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        leftIcon={<Lock className="h-4 w-4" />}
      >
        Thanh to\u00e1n {formatPrice(total)}
      </Button>

      {/* Secure payment notice */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Lock className="h-3 w-3" />
        <span>Thanh to\u00e1n \u0111\u01b0\u1ee3c b\u1ea3o m\u1eadt b\u1edfi SSL 256-bit</span>
      </div>
    </form>
  );
}
