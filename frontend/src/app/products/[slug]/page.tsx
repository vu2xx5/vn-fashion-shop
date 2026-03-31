import type { Metadata } from "next";
import { getProduct } from "@/lib/api";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const response = await getProduct(params.slug);
    const product = response.data;
    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

    return {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description.slice(0, 160),
        images: primaryImage ? [{ url: primaryImage.url, width: primaryImage.width, height: primaryImage.height, alt: primaryImage.alt }] : [],
        type: "website",
        locale: "vi_VN",
      },
    };
  } catch {
    return {
      title: "Sản phẩm",
      description: "Chi tiết sản phẩm tại VN Fashion",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  let product = null;
  let error = false;

  try {
    const response = await getProduct(params.slug);
    product = response.data;
  } catch {
    error = true;
  }

  if (error || !product) {
    return (
      <div className="container-custom section-padding text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-3xl" aria-hidden="true">404</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <a
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay lại cửa hàng
          </a>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
