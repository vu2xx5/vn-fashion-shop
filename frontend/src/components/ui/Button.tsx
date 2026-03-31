"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 " +
    "focus-visible:ring-primary-600 shadow-sm",
  secondary:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 " +
    "focus-visible:ring-accent-500 shadow-sm",
  outline:
    "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 " +
    "dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950 " +
    "focus-visible:ring-primary-600",
  ghost:
    "text-gray-700 hover:bg-gray-100 active:bg-gray-200 " +
    "dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 " +
    "focus-visible:ring-gray-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 " +
    "focus-visible:ring-red-600 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-gray-900",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize };
