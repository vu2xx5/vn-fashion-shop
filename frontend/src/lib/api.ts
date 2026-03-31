import type {
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  User,
  LoginCredentials,
  RegisterData,
  ProductFilters,
  PaginatedResponse,
  ApiResponse,
  DashboardMetrics,
  Address,
} from "@/types";

// ============================================================
// API Client Configuration
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new ApiError(
          errorBody?.detail || errorBody?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorBody?.errors
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Lỗi kết nối mạng. Vui lòng thử lại.", 0);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

const api = new ApiClient(API_BASE_URL);

// ============================================================
// Product API
// ============================================================

export async function getProducts(
  filters?: ProductFilters
): Promise<PaginatedResponse<Product>> {
  const params: Record<string, string | number | undefined> = {
    page: filters?.page,
    limit: filters?.limit,
    category: filters?.category,
    sort: filters?.sort,
    search: filters?.search,
    min_price: filters?.minPrice,
    max_price: filters?.maxPrice,
    sizes: filters?.sizes?.join(","),
    colors: filters?.colors?.join(","),
  };
  return api.get<PaginatedResponse<Product>>("/products", params);
}

export async function getProduct(slug: string): Promise<ApiResponse<Product>> {
  return api.get<ApiResponse<Product>>(`/products/${slug}`);
}

export async function getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
  return api.get<ApiResponse<Product[]>>("/products/featured");
}

export async function getNewArrivals(): Promise<ApiResponse<Product[]>> {
  return api.get<ApiResponse<Product[]>>("/products/new-arrivals");
}

export async function searchProducts(query: string): Promise<ApiResponse<Product[]>> {
  return api.get<ApiResponse<Product[]>>("/products/search", { q: query });
}

// ============================================================
// Category API
// ============================================================

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return api.get<ApiResponse<Category[]>>("/categories");
}

export async function getCategory(slug: string): Promise<ApiResponse<Category>> {
  return api.get<ApiResponse<Category>>(`/categories/${slug}`);
}

// ============================================================
// Cart API
// ============================================================

export async function getCart(): Promise<ApiResponse<Cart>> {
  return api.get<ApiResponse<Cart>>("/cart");
}

export async function addToCart(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<ApiResponse<CartItem>> {
  return api.post<ApiResponse<CartItem>>("/cart/items", {
    variant_id: variantId ? parseInt(variantId, 10) : parseInt(productId, 10),
    quantity,
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<ApiResponse<CartItem>> {
  return api.put<ApiResponse<CartItem>>(`/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: string): Promise<void> {
  return api.delete(`/cart/items/${itemId}`);
}

export async function clearCart(): Promise<void> {
  return api.delete("/cart");
}

// ============================================================
// Order API
// ============================================================

export async function createOrder(data: {
  shipping_address: {
    full_name: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  address_id?: number;
  notes?: string;
}): Promise<ApiResponse<Order>> {
  return api.post<ApiResponse<Order>>("/orders", data);
}

export async function getOrders(
  page?: number,
  limit?: number
): Promise<ApiResponse<Order[]>> {
  return api.get<ApiResponse<Order[]>>("/orders", { page, limit });
}

export async function getOrder(id: string): Promise<ApiResponse<Order>> {
  return api.get<ApiResponse<Order>>(`/orders/${id}`);
}

export async function cancelOrder(id: string): Promise<ApiResponse<Order>> {
  return api.post<ApiResponse<Order>>(`/orders/${id}/cancel`);
}

// ============================================================
// Auth API
// ============================================================

export async function login(
  credentials: LoginCredentials
): Promise<ApiResponse<{ user: User; token: string }>> {
  return api.post<ApiResponse<{ user: User; token: string }>>("/auth/login", credentials);
}

export async function register(
  data: RegisterData
): Promise<ApiResponse<{ user: User; token: string }>> {
  return api.post<ApiResponse<{ user: User; token: string }>>("/auth/register", {
    email: data.email,
    password: data.password,
    full_name: data.fullName,
    phone: data.phone,
  });
}

export async function logout(): Promise<void> {
  return api.post("/auth/logout");
}

export async function getProfile(): Promise<ApiResponse<User>> {
  return api.get<ApiResponse<User>>("/auth/profile");
}

export async function updateProfile(
  data: Partial<User>
): Promise<ApiResponse<User>> {
  return api.put<ApiResponse<User>>("/auth/profile", data);
}

// ============================================================
// Address API
// ============================================================

export async function getAddresses(): Promise<ApiResponse<Address[]>> {
  return api.get<ApiResponse<Address[]>>("/addresses");
}

export async function addAddress(data: Omit<Address, "id">): Promise<ApiResponse<Address>> {
  return api.post<ApiResponse<Address>>("/addresses", data);
}

export async function updateAddress(
  id: string,
  data: Partial<Address>
): Promise<ApiResponse<Address>> {
  return api.put<ApiResponse<Address>>(`/addresses/${id}`, data);
}

export async function deleteAddress(id: string): Promise<void> {
  return api.delete(`/addresses/${id}`);
}

// ============================================================
// Admin API
// ============================================================

export async function getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
  return api.get<ApiResponse<DashboardMetrics>>("/admin/metrics");
}

export async function getAdminProducts(
  page?: number,
  limit?: number,
  search?: string
): Promise<PaginatedResponse<Product>> {
  return api.get<PaginatedResponse<Product>>("/admin/products", { page, limit, search });
}

export async function createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
  return api.post<ApiResponse<Product>>("/admin/products", data);
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<ApiResponse<Product>> {
  return api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  return api.delete(`/admin/products/${id}`);
}

export async function getAdminOrders(
  page?: number,
  limit?: number,
  status?: string
): Promise<PaginatedResponse<Order>> {
  return api.get<PaginatedResponse<Order>>("/admin/orders", { page, limit, status });
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<ApiResponse<Order>> {
  return api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status });
}

export { api as apiClient, ApiError };
