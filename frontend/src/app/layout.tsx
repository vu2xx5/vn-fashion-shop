import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch(e) {}
          })();
        `,
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
        <ThemeProvider>{null}</ThemeProvider>
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
