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
  /** Bounds on the cheapest variant's price (the card's "from" price). */
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
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

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled" | "Returned";
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

/** A row in the signed-in customer's order list (newest first). */
export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  /** Units across all lines. */
  itemCount: number;
  total: number;
  currencyCode: string;
  firstItemImageUrl: string | null;
}

/** An address saved on the customer's account. `phone` is already E.164. */
export interface AddressDto {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: AddressInput;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  preferredLanguage: string;
  roles: string[];
  /** External providers the account can sign in with, e.g. "Google". */
  connectedLogins: string[];
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  placedAt: string;
  customerName: string;
  phone: string;
  city: string;
  itemCount: number;
  total: number;
  currencyCode: string;
  isGuest: boolean;
}

export interface AdminStatusChange {
  status: OrderStatus;
  occurredAt: string;
  changedBy: string | null;
  note?: string | null;
}

export interface AdminOrderDetails {
  order: OrderDetailsDto;
  customerId: string | null;
  history: AdminStatusChange[];
  nextStatuses: OrderStatus[];
}

export type NotificationChannel = "Email" | "Sms" | "WhatsApp";
export type NotificationTemplate =
  | "OrderPlaced"
  | "OrderConfirmed"
  | "OrderShipped"
  | "OrderDelivered"
  | "OrderCancelled"
  | "OrderReturned"
  | "StaffNewOrder"
  | "PasswordReset";
export type OutboxStatus = "Pending" | "Processing" | "Sent" | "Parked";

/** One outgoing message about an order: delivery state only (the API never returns its text or links). */
export interface AdminNotification {
  id: string;
  type: string;
  channel: NotificationChannel | null;
  template: NotificationTemplate | null;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  occurredAt: string;
  nextAttemptAt: string;
  lastAttemptAt: string | null;
  processedAt: string | null;
}

// ---- Admin catalogue: admin DTOs carry both languages so the editor can show them side by side ----

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sortOrder: number;
  /** Hidden brands leave the store's brand filters; their products stay on sale. */
  isActive: boolean;
  /** Published or not. Only a brand with none can be deleted. */
  productCount: number;
}

export interface AdminCategory {
  id: string;
  name: LocalizedText;
  slug: string;
  productType: ProductType;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface SaveBrandRequest {
  name: string;
  /** Empty lets the API derive it from the name. */
  slug: string | null;
  logoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface SaveCategoryRequest {
  name: LocalizedText;
  slug: string | null;
  productType: ProductType;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminSettings {
  storeName: LocalizedText;
  logoUrl: string | null;
  /** E.164 ("+962791234567"). */
  supportPhone: string | null;
  whatsAppNumber: string | null;
  supportEmail: string | null;
  currencyCode: string;
  /** Digits only ("962"), given to numbers typed in national form. */
  phoneCountryCode: string;
  /** IANA id, e.g. "Asia/Amman". */
  timeZoneId: string;
  flatShippingFee: number;
  /** Null: no free delivery. */
  freeShippingThreshold: number | null;
  allowGuestCheckout: boolean;
  /** Outbound mail for staff new-order alerts. Null host: alerts are off. */
  smtpHost: string | null;
  smtpPort: number;
  smtpFrom: string | null;
  smtpUser: string | null;
  /** Whether a password is saved; the value itself is never sent back to the browser. */
  hasSmtpPassword: boolean;
}

/**
 * The settings form; the logo has its own upload and remove calls. `smtpPassword` replaces `hasSmtpPassword`:
 * null keeps the saved password, "" clears it, anything else replaces it.
 */
export type UpdateSettingsRequest = Omit<AdminSettings, "logoUrl" | "hasSmtpPassword"> & { smtpPassword: string | null };

export interface AdminProductListItem {
  id: string;
  name: LocalizedText;
  slug: string;
  type: ProductType;
  brandName: string;
  isPublished: boolean;
  isFeatured: boolean;
  variantCount: number;
  /** Units across all variants, active or not. */
  totalStock: number;
  /** An option on sale is at or below the low-stock threshold (the "Low stock" filter matches the same rule). */
  hasLowStock: boolean;
  /** Cheapest active variant; null when none is active. */
  minPrice: number | null;
  imageUrl: string | null;
  updatedAt: string | null;
}

export interface AdminProductSearch {
  search?: string;
  type?: ProductType;
  brandId?: string;
  published?: boolean;
  lowStockOnly?: boolean;
  noPhotosOnly?: boolean;
  outOfStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CurrencyAmount {
  currencyCode: string;
  amount: number;
}

export interface AdminDashboardTodaySummary {
  orders: number;
  yesterdayOrders: number;
  revenue: CurrencyAmount[];
  yesterdayRevenue: CurrencyAmount[];
}

export interface AdminDashboardQueue {
  pendingCount: number;
  oldestPendingAt: string | null;
  confirmedCount: number;
  shippedCount: number;
}

export interface AdminDashboardDailySales {
  day: string;
  orders: number;
  revenue: number;
}

export interface AdminDashboardLowStockItem {
  productId: string;
  variantId: string;
  productName: LocalizedText;
  variantDescription: LocalizedText;
  sku: string;
  stockQuantity: number;
  imageUrl: string | null;
}

export interface AdminDashboardTopSeller {
  productId: string;
  productName: LocalizedText;
  units: number;
  revenue: number;
  imageUrl: string | null;
}

export interface AdminDashboardCatalogHealth {
  drafts: number;
  publishedWithoutPhotos: number;
  publishedOutOfStock: number;
}

export interface AdminDashboard {
  today: string;
  timeZoneId: string;
  storeCurrencyCode: string;
  todaySummary: AdminDashboardTodaySummary;
  queue: AdminDashboardQueue;
  last14Days: AdminDashboardDailySales[];
  lowStock: AdminDashboardLowStockItem[];
  topSellers: AdminDashboardTopSeller[];
  recentOrders: AdminOrderListItem[];
  catalog: AdminDashboardCatalogHealth;
}

export interface AdminVariant {
  id: string;
  sku: string;
  color: LocalizedText | null;
  colorHex: string | null;
  storageGb: number | null;
  ramGb: number | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  /** Set when the photo shows one colour; the storefront gallery follows the chosen variant. */
  variantId: string | null;
}

export interface AdminSpecification {
  label: LocalizedText;
  value: LocalizedText;
}

export interface AdminProduct {
  id: string;
  type: ProductType;
  brandId: string;
  categoryId: string;
  name: LocalizedText;
  slug: string;
  description: LocalizedText;
  isPublished: boolean;
  isFeatured: boolean;
  variants: AdminVariant[];
  images: ProductImage[];
  specifications: AdminSpecification[];
  compatiblePhoneIds: string[];
}

export interface SaveProductRequest {
  type: ProductType;
  brandId: string;
  categoryId: string;
  name: LocalizedText;
  /** Empty lets the API derive it from the English name. */
  slug: string | null;
  description: LocalizedText;
  isFeatured: boolean;
}

export interface VariantInput {
  sku: string;
  color: LocalizedText | null;
  colorHex: string | null;
  storageGb: number | null;
  ramGb: number | null;
  price: number;
  compareAtPrice: number | null;
}
