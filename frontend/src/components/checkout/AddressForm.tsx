"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/types";

interface AddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Omit<Address, "id" | "isDefault">) => void;
  showSaveCheckbox?: boolean;
  isLoading?: boolean;
  className?: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  ward?: string;
  district?: string;
  province?: string;
}

const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function AddressForm({
  initialAddress,
  onSubmit,
  showSaveCheckbox = false,
  isLoading = false,
  className,
}: AddressFormProps) {
  const [fullName, setFullName] = useState(initialAddress?.fullName ?? "");
  const [phone, setPhone] = useState(initialAddress?.phone ?? "");
  const [streetAddress, setStreetAddress] = useState(initialAddress?.streetAddress ?? "");
  const [ward, setWard] = useState(initialAddress?.ward ?? "");
  const [district, setDistrict] = useState(initialAddress?.district ?? "");
  const [province, setProvince] = useState(initialAddress?.province ?? "");
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Vui l\u00f2ng nh\u1eadp h\u1ecd v\u00e0 t\u00ean";
    }

    if (!phone.trim()) {
      newErrors.phone = "Vui l\u00f2ng nh\u1eadp s\u1ed1 \u0111i\u1ec7n tho\u1ea1i";
    } else if (!PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7";
    }

    if (!streetAddress.trim()) {
      newErrors.streetAddress = "Vui l\u00f2ng nh\u1eadp \u0111\u1ecba ch\u1ec9";
    }

    if (!ward.trim()) {
      newErrors.ward = "Vui l\u00f2ng nh\u1eadp Ph\u01b0\u1eddng/X\u00e3";
    }

    if (!district.trim()) {
      newErrors.district = "Vui l\u00f2ng nh\u1eadp Qu\u1eadn/Huy\u1ec7n";
    }

    if (!province.trim()) {
      newErrors.province = "Vui l\u00f2ng nh\u1eadp T\u1ec9nh/Th\u00e0nh ph\u1ed1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      streetAddress: streetAddress.trim(),
      ward: ward.trim(),
      district: district.trim(),
      province: province.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-4", className)}
      noValidate
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        \u0110\u1ecba ch\u1ec9 giao h\u00e0ng
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="H\u1ecd v\u00e0 t\u00ean"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          placeholder="Nguy\u1ec5n V\u0103n A"
          required
          autoComplete="name"
        />

        <Input
          label="S\u1ed1 \u0111i\u1ec7n tho\u1ea1i"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="0912 345 678"
          required
          autoComplete="tel"
        />
      </div>

      <Input
        label="\u0110\u1ecba ch\u1ec9"
        value={streetAddress}
        onChange={(e) => setStreetAddress(e.target.value)}
        error={errors.streetAddress}
        placeholder="S\u1ed1 nh\u00e0, t\u00ean \u0111\u01b0\u1eddng"
        required
        autoComplete="street-address"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Ph\u01b0\u1eddng/X\u00e3"
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          error={errors.ward}
          placeholder="Ph\u01b0\u1eddng 1"
          required
        />

        <Input
          label="Qu\u1eadn/Huy\u1ec7n"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          error={errors.district}
          placeholder="Qu\u1eadn 1"
          required
        />

        <Input
          label="T\u1ec9nh/Th\u00e0nh ph\u1ed1"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          error={errors.province}
          placeholder="TP. H\u1ed3 Ch\u00ed Minh"
          required
          autoComplete="address-level1"
        />
      </div>

      {showSaveCheckbox && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            L\u01b0u \u0111\u1ecba ch\u1ec9 cho l\u1ea7n mua sau
          </span>
        </label>
      )}

      <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
        Ti\u1ebfp t\u1ee5c
      </Button>
    </form>
  );
}
