import type { SiteCollection, SimplePagesSettings, StorefrontSettings } from "./siteSettings";

export type PaginationOptions = {
  /** Number of records per page (default: 50, max: 200) */
  limit?: number;
  /** Opaque cursor from the previous response's `nextCursor` */
  cursor?: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    /** Total items in full result set (where available) */
    total?: number;
    hasNext: boolean;
    /** Pass as `cursor` on the next request */
    nextCursor: string | null;
    limit: number;
  };
};

export type OrderItem = {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  salePrice?: number;
  qty: number;
  img: string;
};

export type Order = {
  id: string;
  ref: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  status: "received" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "paid" | "pending" | "failed";
  paymentRef: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  trackingCode?: string;
};

export type CustomOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  garment: string;
  budget: string;
  eventDate: string;
  measurements: { bust: string; waist: string; hips: string; height: string };
  inspiration: string;
  notes: string;
  status: "new" | "in_discussion" | "quoted" | "confirmed" | "in_production" | "delivered";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: "footer" | "popup";
  status: "active" | "unsubscribed";
  subscribedAt: Date;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: Date;
};

export type WholesaleLead = {
  id: string;
  business: string;
  name: string;
  email: string;
  phone: string;
  categories: string;
  quantity: string;
  message: string;
  status: "new" | "contacted" | "quoted" | "converted" | "closed";
  createdAt: Date;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "owner" | "manager" | "editor";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminUserInput = Omit<AdminUser, "id" | "createdAt" | "updatedAt">;

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  description: string;
  sizes: string[];
  details: string[];
  images: string[];
  badge?: string;
  badgeColor?: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export type Coupon = {
  id: string;
  code: string;
  discount: number;
  description?: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
};

export type CouponInput = Omit<Coupon, "id" | "usedCount" | "createdAt">;

export type SiteSettings = {
  announcementMessages: string[];
  collections: SiteCollection[];
  storefront: StorefrontSettings;
  simplePages: SimplePagesSettings;
  updatedAt?: Date;
};

export type AuditEntry = {
  id: string;
  uid: string;
  email: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
};

export type CustomerSummary = {
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: Date;
};

export type ProductReview = {
  id: string;
  productSlug: string;
  name: string;
  location: string;
  rating: number;
  body: string;
  status: "pending" | "approved";
  createdAt: Date;
};

export type Flyer = {
  id: string;
  imageUrl: string;
  title: string;
  isActive: boolean;
  delaySeconds: number;
  createdAt: Date;
};
