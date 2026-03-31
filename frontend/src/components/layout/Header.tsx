"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  Sun,
  Moon,
  X,
  Heart,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { MobileNav } from "./MobileNav";

const navigation = [
  { label: "Trang chu", href: "/" },
  { label: "San pham", href: "/products" },
  {
    label: "Danh muc",
    href: "/products?category=all",
    children: [
      { label: "Ao", href: "/products?category=ao" },
      { label: "Quan", href: "/products?category=quan" },
      { label: "Dam / Vay", href: "/products?category=dam-vay" },
      { label: "Phu kien", href: "/products?category=phu-kien" },
    ],
  },
  { label: "Khuyen mai", href: "/products?sort=sale" },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount, openDrawer } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm"
            : "bg-white dark:bg-gray-900"
        )}
      >
        {/* Top bar */}
        <div className="hidden sm:block bg-primary-600 dark:bg-primary-800 text-white">
          <div className="container-custom flex items-center justify-between py-1.5 text-xs">
            <p>Mien phi van chuyen cho don hang tu 500.000d</p>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="hover:underline">
                Dang nhap
              </Link>
              <span aria-hidden="true">|</span>
              <Link href="/auth/register" className="hover:underline">
                Dang ky
              </Link>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Mo menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="VN Fashion - Trang chu"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">VN</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900 dark:text-white">
                Fashion
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Menu chinh"
            >
              {navigation.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() =>
                    item.children && handleDropdownEnter(item.label)
                  }
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      pathname === item.href
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50"
                        : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                    {item.children && (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.children && openDropdown === item.label && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in"
                      role="menu"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          role="menuitem"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Search bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Tim kiem san pham..."
                  className="input-base pl-10 py-2 text-sm"
                  aria-label="Tim kiem san pham"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile search toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={isSearchOpen ? "Dong tim kiem" : "Mo tim kiem"}
              >
                {isSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={isDark ? "Che do sang" : "Che do toi"}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Wishlist */}
              <Link
                href="/profile"
                className="hidden sm:flex p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Yeu thich"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* User */}
              <Link
                href="/profile"
                className="hidden sm:flex p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Tai khoan"
              >
                <User className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={openDrawer}
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={`Gio hang, ${itemCount} san pham`}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary-600 rounded-full">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {isSearchOpen && (
            <div className="md:hidden pb-3 animate-fade-in">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Tim kiem san pham..."
                  className="input-base pl-10 py-2 text-sm"
                  aria-label="Tim kiem san pham"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
      />
    </>
  );
}
