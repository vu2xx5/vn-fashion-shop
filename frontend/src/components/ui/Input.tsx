"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id: propId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, type InputProps };
