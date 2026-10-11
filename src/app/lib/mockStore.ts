import { AppError } from "./errors";
import { seedProducts } from "./mockData";
import { DEFAULT_COLLECTIONS, DEFAULT_STOREFRONT_SETTINGS, getDefaultSimplePages } from "./siteSettings";
import type {
  AdminUser, AuditEntry, ContactMessage, Coupon, CustomOrder, Flyer,
  NewsletterSubscriber, Order, Product, ProductReview, SiteSettings, WholesaleLead,
} from "./types";

export const DEMO_STORAGE_KEY = "wba_demo_v1";
export const DEMO_ADMIN_EMAIL = "owner@demo.example";
export const DEMO_CUSTOMER_EMAIL = "customer@demo.example";

export type DemoUser = {
  id: string;
  email: string;
  user_metadata: { full_name?: string };
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
};

export type DemoState = {
  version: 1;
  products: Product[];
  orders: Order[];
  customOrders: CustomOrder[];
  subscribers: NewsletterSubscriber[];
  messages: ContactMessage[];
  wholesaleLeads: WholesaleLead[];
  admins: AdminUser[];
  coupons: Coupon[];
  reviews: ProductReview[];
  flyers: Flyer[];
  auditLogs: AuditEntry[];
  settings: SiteSettings;
  users: DemoUser[];
  sessionUserId: string | null;
  emailActivity: { id: string; type: string; recipients: string[]; createdAt: Date }[];
};

function seedState(): DemoState {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000);
  const products = seedProducts();
  const names = ["Amara Okafor", "Tunde Bello", "Zainab Adeyemi", "Chidi Nwosu", "Funmi Bakare", "Ada Eze"];
  const statuses: Order["status"][] = ["received", "confirmed", "processing", "dispatched", "delivered", "cancelled", "refunded"];
  const orders: Order[] = Array.from({ length: 24 }, (_, i) => {
    const product = products[i % products.length];
    const [firstName, lastName] = names[i % names.length].split(" ");
    const qty = i % 3 + 1;
    const subtotal = (product.salePrice ?? product.price) * qty;
    const discountAmount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
    return {
      id: `demo-order-${i + 1}`, ref: `WBA-DEMO-${String(i + 1).padStart(4, "0")}`,
      customer: { firstName, lastName, email: i % names.length === 0 ? DEMO_CUSTOMER_EMAIL : `${firstName.toLowerCase()}@demo.example`, phone: "+2348000000000", address: `${12 + i} Example Street`, city: "Lagos", state: "Lagos", country: "Nigeria" },
      items: [{ id: product.slug, name: product.name, category: product.category, size: product.sizes[0], price: product.price, salePrice: product.salePrice, qty, img: product.images[0] }],
      subtotal, discountAmount, couponCode: discountAmount ? "WELCOME10" : undefined,
      total: subtotal - discountAmount, status: statuses[i % statuses.length],
      paymentStatus: i % 7 === 5 ? "failed" : i % 7 === 0 ? "pending" : "paid",
      paymentRef: `DEMO-PAYMENT-${i + 1}`, createdAt: daysAgo(i), updatedAt: daysAgo(i),
      notes: "Sample order. No payment or fulfilment takes place.", trackingCode: `DEMO-TRACK-${i + 1}`,
    };
  });
  return {
    version: 1, products, orders,
    customOrders: names.slice(0, 4).map((name, i) => ({ id: `demo-custom-${i + 1}`, name, email: `${name.split(" ")[0].toLowerCase()}@demo.example`, phone: "+2348000000000", occasion: "Wedding", garment: "Aso Oke ceremonial set", budget: "₦100,000 – ₦200,000", eventDate: new Date(now.getTime() + (30 + i) * 86400000).toISOString().slice(0, 10), measurements: { bust: "38", waist: "32", hips: "42", height: "168" }, inspiration: "/images/collection/look-02.png", notes: "Gold detailing with a matching gele.", status: (["new", "in_discussion", "quoted", "in_production"] as const)[i], createdAt: daysAgo(i + 1), updatedAt: daysAgo(i) })),
    subscribers: names.map((name, i) => ({ id: `demo-subscriber-${i + 1}`, email: `${name.split(" ")[0].toLowerCase()}@demo.example`, source: i % 2 ? "popup" : "footer", status: i === 5 ? "unsubscribed" : "active", subscribedAt: daysAgo(i) })),
    messages: names.slice(0, 3).map((name, i) => ({ id: `demo-message-${i + 1}`, name, email: `${name.split(" ")[0].toLowerCase()}@demo.example`, subject: ["Sizing advice", "Delivery to Abuja", "Care instructions"][i], message: ["Could you help me choose between medium and large for the lace boubou?", "What is the estimated delivery time for an order to Abuja?", "How should I care for my Aso Oke set?"][i], status: (["unread", "read", "replied"] as const)[i], createdAt: daysAgo(i) })),
    wholesaleLeads: names.slice(0, 3).map((name, i) => ({ id: `demo-wholesale-${i + 1}`, business: ["Lagos Style Boutique", "Heritage Textiles", "Atelier Collective"][i], name, email: `${name.split(" ")[0].toLowerCase()}@demo.example`, phone: "+2348000000000", categories: "Fabrics, Ready to Wear", quantity: "20–50 pieces", message: "Interested in stocking a curated range of your pieces.", status: (["new", "contacted", "quoted"] as const)[i], createdAt: daysAgo(i) })),
    admins: ["owner", "manager", "editor"].map((role) => ({ id: `${role}@demo.example`, email: `${role}@demo.example`, role: role as AdminUser["role"], isActive: true, createdAt: daysAgo(30), updatedAt: now })),
    coupons: [{ id: "demo-coupon-promo", code: "IDANGANGAN", discount: 0.4, description: "Existing storefront promotion (simulated)", usedCount: 0, active: true, createdAt: daysAgo(10) }, { id: "demo-coupon-1", code: "WELCOME10", discount: 0.1, description: "Sample welcome discount", maxUses: 100, usedCount: 6, active: true, createdAt: daysAgo(20) }, { id: "demo-coupon-2", code: "ATELIER20", discount: 0.2, description: "Sample seasonal promotion", maxUses: 50, usedCount: 3, active: true, createdAt: daysAgo(10) }, { id: "demo-coupon-3", code: "PASTSALE", discount: 0.15, usedCount: 10, active: false, expiresAt: daysAgo(1), createdAt: daysAgo(30) }],
    reviews: products.slice(0, 6).map((product, i) => ({ id: `demo-review-${i + 1}`, productSlug: product.slug, name: names[i], location: i % 2 ? "Abuja" : "Lagos", rating: i % 3 === 0 ? 4 : 5, body: "Beautiful craftsmanship and a lovely fit. The fabric feels wonderful.", status: i === 5 ? "pending" : "approved", createdAt: daysAgo(i + 1) })),
    flyers: [{ id: "demo-flyer-1", title: "Atelier collection preview", imageUrl: "/images/collection/look-01.png", isActive: false, delaySeconds: 5, createdAt: daysAgo(2) }],
    auditLogs: [{ id: "demo-audit-1", uid: "demo-owner", email: DEMO_ADMIN_EMAIL, action: "demo.initialized", details: { simulated: true }, timestamp: now }],
    settings: { announcementMessages: [], collections: DEFAULT_COLLECTIONS, storefront: DEFAULT_STOREFRONT_SETTINGS, simplePages: getDefaultSimplePages(DEFAULT_STOREFRONT_SETTINGS.contactEmail) },
    users: [DEMO_ADMIN_EMAIL, "manager@demo.example", "editor@demo.example", DEMO_CUSTOMER_EMAIL].map((email, i) => ({ id: `demo-user-${i + 1}`, email, user_metadata: { full_name: i === 3 ? "Amara Okafor" : `Demo ${email.split("@")[0]}` }, created_at: daysAgo(30).toISOString(), email_confirmed_at: daysAgo(30).toISOString() })),
    sessionUserId: null, emailActivity: [],
  };
}

// Revive only model dates; auth timestamps intentionally remain strings.
function reviveDate(key: string, value: unknown): unknown {
  if ((key.endsWith("At") || key === "timestamp") && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

let memory: DemoState | undefined;

export function readDemoState(): DemoState {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved, reviveDate) as DemoState;
      if (parsed.version === 1 && Array.isArray(parsed.products) && Array.isArray(parsed.users)) {
        memory = parsed;
      }
    }
  } catch { /* Unavailable or corrupt storage falls back to this tab's state. */ }
  memory ??= seedState();
  return structuredClone(memory);
}

export function changeDemoState<T>(change: (draft: DemoState) => T): T {
  const draft = readDemoState();
  const result = change(draft);
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    throw new AppError("Demo changes could not be saved in this browser. Free some storage and try again.", "INTERNAL_ERROR");
  }
  memory = draft;
  return structuredClone(result);
}

export function demoId(): string {
  return `demo-${crypto.randomUUID()}`;
}

// For repeatable tests. UI data can be reset by clearing wba_demo_v1 in browser storage.
export function resetDemoState(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY);
  memory = undefined;
}
