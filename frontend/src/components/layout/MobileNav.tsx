"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { X, ChevronDown, ChevronRight, User, Heart, Phone, Mail, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavItem[];
}

export function MobileNav({ isOpen, onClose, navigation }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        ref={navRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw]",
          "bg-white dark:bg-gray-900 shadow-xl",
          "flex flex-col animate-slide-in-left"
        )}
        aria-label="Menu di dong"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={onClose}
            aria-label="VN Fashion - Trang chu"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VN</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Fashion
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Dong menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {navigation.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 text-left",
                      "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                      "transition-colors"
                    )}
                    aria-expanded={expandedItems.has(item.label)}
                  >
                    <span className="font-medium">{item.label}</span>
                    {expandedItems.has(item.label) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems.has(item.label) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block pl-8 pr-4 py-2.5 text-sm",
                            "text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400",
                            "transition-colors"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 font-medium transition-colors",
                    pathname === item.href
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Account links */}
          {isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">{user.fullName}</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Heart className="h-5 w-5" />
                <span className="font-medium">Yeu thich</span>
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  onClose();
                  router.push("/");
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Dang xuat</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span className="font-medium">Dang nhap</span>
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Dang ky</span>
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <a
            href="tel:1900xxxx"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
          >
            <Phone className="h-4 w-4" />
            <span>Hotline: 1900 xxxx</span>
          </a>
          <a
            href="mailto:support@vnfashion.vn"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
          >
            <Mail className="h-4 w-4" />
            <span>support@vnfashion.vn</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
