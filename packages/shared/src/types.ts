import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductBadge,
} from './constants.js';

/** API response envelope used by every endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  stock: number;
  badge: ProductBadge;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string } | null;
  images: ProductImageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  subcategories: { id: string; name: string; slug: string; sortOrder: number }[];
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPriceMinor: number;
  quantity: number;
}

export interface OrderItemDTO {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
  items: OrderItemDTO[];
  createdAt: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
}
