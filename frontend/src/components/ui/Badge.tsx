import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "gray";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  primary:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300",
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  danger:
    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  info:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  gray:
    "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300",
};

const dotVariantColors: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  primary: "bg-primary-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5 shrink-0",
            dotVariantColors[variant]
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
