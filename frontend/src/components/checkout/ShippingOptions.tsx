"use client";

import { cn, formatPrice } from "@/lib/utils";
import { Truck, Zap } from "lucide-react";
import type { ShippingMethod } from "@/types";

interface ShippingOption {
  method: ShippingMethod;
  label: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    method: "standard",
    label: "Giao h\u00e0ng ti\u00eau chu\u1ea9n",
    description: "3-5 ng\u00e0y l\u00e0m vi\u1ec7c",
    price: 30000,
    icon: <Truck className="h-5 w-5" />,
  },
  {
    method: "express",
    label: "Giao h\u00e0ng nhanh",
    description: "1-2 ng\u00e0y l\u00e0m vi\u1ec7c",
    price: 50000,
    icon: <Zap className="h-5 w-5" />,
  },
];

interface ShippingOptionsProps {
  selected: ShippingMethod;
  onChange: (method: ShippingMethod) => void;
  className?: string;
}

export function ShippingOptions({ selected, onChange, className }: ShippingOptionsProps) {
  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Ph\u01b0\u01a1ng th\u1ee9c giao h\u00e0ng
      </legend>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Ch\u1ecdn ph\u01b0\u01a1ng th\u1ee9c giao h\u00e0ng">
        {SHIPPING_OPTIONS.map((option) => {
          const isSelected = selected === option.method;
          return (
            <label
              key={option.method}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors",
                isSelected
                  ? "border-primary-600 bg-primary-50 dark:border-primary-500 dark:bg-primary-950"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              )}
            >
              <input
                type="radio"
                name="shipping-method"
                value={option.method}
                checked={isSelected}
                onChange={() => onChange(option.method)}
                className="mt-0.5 h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600"
                aria-describedby={`shipping-${option.method}-desc`}
              />

              <span
                className={cn(
                  "flex-shrink-0 mt-0.5",
                  isSelected
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-gray-400 dark:text-gray-500"
                )}
                aria-hidden="true"
              >
                {option.icon}
              </span>

              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </span>
                <span
                  id={`shipping-${option.method}-desc`}
                  className="block text-xs text-gray-500 dark:text-gray-400"
                >
                  {option.description}
                </span>
              </div>

              <span className="flex-shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatPrice(option.price)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
