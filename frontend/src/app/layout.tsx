import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://vnfashion.vn"),
  title: {
    default: "VN Fashion - Thời trang Việt Nam",
    template: "%s | VN Fashion",
  },
  description:
    "VN Fashion - Thương hiệu thời trang Việt Nam chất lượng cao, phong cách hiện đại, giá cả hợp lý. Miễn phí vận chuyển cho đơn hàng từ 500.000₫.",
  keywords: [
    "thời trang",
    "thời trang Việt Nam",
    "áo",
    "quần",
    "đầm",
    "váy",
    "phụ kiện",
    "mua sắm online",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "VN Fashion",
    title: "VN Fashion - Thời trang Việt Nam",
    description:
      "Thương hiệu thời trang Việt Nam chất lượng cao, phong cách hiện đại.",
  },
};

function ThemeScript() {
  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
