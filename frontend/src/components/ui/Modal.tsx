"use client";

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that had focus before modal opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusableElements =
          contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [onClose]
  );

  // Auto-focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const focusableElements =
        contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const firstElement = focusableElements[0];
      if (firstElement) {
        // Small delay to ensure DOM is ready
        requestAnimationFrame(() => firstElement.focus());
      }
    }

    // Restore focus when modal closes
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div
        ref={contentRef}
        className={cn(
          "relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl",
          "animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar",
          sizeStyles[size],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                  "dark:hover:text-gray-300 dark:hover:bg-gray-700",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary-600",
                  !title && "ml-auto"
                )}
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
