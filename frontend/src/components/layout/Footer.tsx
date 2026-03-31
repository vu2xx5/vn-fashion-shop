"use client";

import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  about: [
    { label: "Gioi thieu", href: "/about" },
    { label: "Tuyen dung", href: "/careers" },
    { label: "Lien he", href: "/contact" },
    { label: "Blog", href: "/blog" },
  ],
  customerService: [
    { label: "Chinh sach van chuyen", href: "/shipping-policy" },
    { label: "Chinh sach doi tra", href: "/return-policy" },
    { label: "Huong dan thanh toan", href: "/payment-guide" },
    { label: "Cau hoi thuong gap", href: "/faq" },
    { label: "Chinh sach bao mat", href: "/privacy" },
    { label: "Dieu khoan su dung", href: "/terms" },
  ],
  categories: [
    { label: "Ao nam", href: "/products?category=ao-nam" },
    { label: "Ao nu", href: "/products?category=ao-nu" },
    { label: "Quan nam", href: "/products?category=quan-nam" },
    { label: "Quan nu", href: "/products?category=quan-nu" },
    { label: "Dam / Vay", href: "/products?category=dam-vay" },
    { label: "Phu kien", href: "/products?category=phu-kien" },
  ],
};

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/vnfashion", icon: Facebook },
  { label: "Instagram", href: "https://instagram.com/vnfashion", icon: Instagram },
  { label: "YouTube", href: "https://youtube.com/vnfashion", icon: Youtube },
];

export function Footer() {
  return (
    <footer
      className="bg-gray-900 dark:bg-gray-950 text-gray-300"
      role="contentinfo"
    >
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Dang ky nhan ban tin
              </h3>
              <p className="text-gray-400 text-sm">
                Nhan thong tin san pham moi va khuyen mai doc quyen
              </p>
            </div>
            <form
              className="flex w-full max-w-md gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="footer-email" className="sr-only">
                Dia chi email
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Nhap email cua ban"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shrink-0"
              >
                Dang ky
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">VN</span>
              </div>
              <span className="text-xl font-bold text-white">Fashion</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              VN Fashion - Thuong hieu thoi trang Viet Nam chat luong cao,
              phong cach hien dai, gia ca hop ly.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <a
                href="tel:1900xxxx"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Hotline: 1900 xxxx</span>
              </a>
              <a
                href="mailto:support@vnfashion.vn"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>support@vnfashion.vn</span>
              </a>
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>123 Nguyen Hue, Quan 1, TP. Ho Chi Minh</span>
              </p>
            </div>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4">Ve VN Fashion</h4>
            <ul className="space-y-2.5">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Ho tro khach hang</h4>
            <ul className="space-y-2.5">
              {footerLinks.customerService.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Danh muc</h4>
            <ul className="space-y-2.5">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Follow */}
          <div>
            <h4 className="text-white font-semibold mb-4">Theo doi chung toi</h4>
            <div className="flex items-center gap-3 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-primary-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                    aria-label={`Theo doi tren ${social.label}`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Phuong thuc thanh toan</h4>
              <div className="flex flex-wrap gap-2">
                {["VISA", "MC", "MoMo", "VNPay", "COD"].map((method) => (
                  <span
                    key={method}
                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 font-medium"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>&copy; 2024 VN Fashion. Da dang ky ban quyen.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-gray-300 transition-colors"
            >
              Chinh sach bao mat
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors"
            >
              Dieu khoan su dung
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
