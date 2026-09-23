// Mirrors the API's storefront DTOs (Store.Application). Keep in sync with the backend, or
// generate from /openapi/v1.json once the contract settles (see README).

export type ProductType = "Phone" | "Accessory";
export type ProductSort = "Featured" | "Newest" | "PriceAsc" | "PriceDesc" | "NameAsc";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PublicSettings {
  storeName: string;
  logoUrl: string | null;
  supportPhone: string | null;
  whatsAppNumber: string | null;
  supportEmail: string | null;
  currencyCode: string;
  flatShippingFee: number;
  freeShippingThreshold: number | null;
  allowGuestCheckout: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productType: ProductType;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  brandName: string;
  brandSlug: string;
  imageUrl: string | null;
  /** Cheapest active variant. A "from" price when hasPriceRange is true. */
  price: number;
  compareAtPrice: number | null;
  /** Variants differ in price, so the price must be shown as "From …". */
  hasPriceRange: boolean;
  inStock: boolean;
  isFeatured: boolean;
  colorHexes: string[];
}

export interface Variant {
  id: string;
  sku: string;
  label: string;
  color: string | null;
  colorHex: string | null;
  storageGb: number | null;
  ramGb: number | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  lowStockQuantity: number | null;
}

export interface ProductDetails {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: ProductType;
  brand: Brand;
  category: Category;
  variants: Variant[];
  images: { id: string; url: string; variantId: string | null }[];
  specifications: { label: string; value: string }[];
  related: ProductSummary[];
}

export interface ProductSearch {
  type?: ProductType;
  brand?: string;
  category?: string;
  search?: string;
  sort?: ProductSort;
  featuredOnly?: boolean;
  compatibleWith?: string;
  page?: number;
  pageSize?: number;
}

/** RFC 9457 problem details as returned by the API, plus its stable error code. */
export interface ApiProblem {
  status: number;
  title: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(readonly problem: ApiProblem) {
    super(problem.title);
    this.name = "ApiError";
  }
}

export interface CartLineDto {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isAvailable: boolean;
  availableQuantity: number;
}

export interface CartDto {
  cartId: string;
  lines: CartLineDto[];
  /** Sum of quantities on available lines only. */
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  /** Live store currency — not snapshotted like orders. */
  currencyCode: string;
  hasUnavailableItems: boolean;
}

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentMethod = "CashOnDelivery";
export type PaymentStatus = "Unpaid" | "Paid";

export interface AddressInput {
  city: string;
  area: string;
  street: string;
  building?: string | null;
  details?: string | null;
}

export interface PlaceOrderRequest {
  fullName: string;
  phone: string;
  email?: string | null;
  address: AddressInput;
  note?: string | null;
  saveAddress: boolean;
}

export interface OrderPlacedDto {
  orderId: string;
  orderNumber: string;
  /** Shown only here; the API stores a hash. */
  trackingToken: string;
  total: number;
  currencyCode: string;
}

export interface ContactDto {
  fullName: string;
  phone: string;
  email?: string | null;
}

export interface OrderItemDto {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  variantLabel: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusChangeDto {
  status: OrderStatus;
  occurredAt: string;
  note?: string | null;
}

export interface OrderDetailsDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  placedAt: string;
  contact: ContactDto;
  shippingAddress: AddressInput;
  customerNote?: string | null;
  cancellationReason?: string | null;
  items: OrderItemDto[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currencyCode: string;
  history: OrderStatusChangeDto[];
  canCancel: boolean;
}
