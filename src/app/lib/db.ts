/**
 * Frontend service boundary. All operations use versioned browser-only demo data.
 * Keep these async contracts when replacing the mock implementation with an API.
 */
import { AppError } from "./errors";
import { changeDemoState, demoId, readDemoState } from "./mockStore";
import { normalizeCollections, normalizeSimplePages, normalizeStorefrontSettings } from "./siteSettings";
import type {
  AdminUser, AdminUserInput, AuditEntry, ContactMessage, Coupon, CouponInput,
  CustomerSummary, CustomOrder, Flyer, NewsletterSubscriber, Order, PaginatedResult,
  PaginationOptions, Product, ProductInput, ProductReview, SiteSettings, WholesaleLead,
} from "./types";
export type * from "./types";

function required<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw AppError.notFound("Demo record", id);
  return item;
}

function paginate<T extends { id: string; createdAt: Date }>(items: T[], opts: PaginationOptions): PaginatedResult<T> {
  const limit = Math.min(Math.max(1, Math.floor(opts.limit ?? 50)), 200);
  const sorted = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id));
  const index = opts.cursor ? sorted.findIndex((item) => item.id === opts.cursor) + 1 : 0;
  const data = sorted.slice(index, index + limit);
  const hasNext = index + limit < sorted.length;
  return { data, meta: { total: sorted.length, hasNext, nextCursor: hasNext ? data[data.length - 1]!.id : null, limit } };
}

export async function getProducts(): Promise<Product[]> { return readDemoState().products; }
export async function getProduct(slug: string): Promise<Product | null> {
  return readDemoState().products.find((p) => p.slug === slug) ?? null;
}
export async function getProductsPaginated(opts: PaginationOptions & { category?: string; featured?: boolean; inStock?: boolean } = {}): Promise<PaginatedResult<Product>> {
  return paginate((await getProducts()).filter((p) => (!opts.category || p.category === opts.category) && (opts.featured === undefined || p.featured === opts.featured) && (opts.inStock === undefined || p.inStock === opts.inStock)), opts);
}
export async function saveProduct(data: ProductInput): Promise<string> {
  return changeDemoState((s) => {
    const old = s.products.find((p) => p.slug === data.slug);
    const product = { ...data, id: data.slug, createdAt: old?.createdAt ?? new Date(), updatedAt: new Date() };
    if (old) Object.assign(old, product); else s.products.unshift(product);
    return data.slug;
  });
}
export async function updateProduct(slug: string, data: Partial<ProductInput>): Promise<void> {
  changeDemoState((s) => {
    const product = required(s.products, slug);
    if (data.slug && data.slug !== slug && s.products.some((p) => p.slug === data.slug)) throw AppError.conflict("A product with this slug already exists.");
    Object.assign(product, data, { id: data.slug ?? slug, updatedAt: new Date() });
  });
}
export async function deleteProduct(slug: string): Promise<void> {
  changeDemoState((s) => { s.products = s.products.filter((p) => p.slug !== slug); });
}

export async function saveOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  return changeDemoState((s) => {
    const id = demoId();
    s.orders.unshift({ ...data, id, createdAt: new Date(), updatedAt: new Date() });
    return id;
  });
}
export async function getOrders(): Promise<Order[]> { return readDemoState().orders; }
export async function getOrder(id: string): Promise<Order | null> { return readDemoState().orders.find((o) => o.id === id) ?? null; }
export async function getOrdersPaginated(opts: PaginationOptions & { status?: Order["status"]; search?: string } = {}): Promise<PaginatedResult<Order>> {
  const q = opts.search?.trim().toLowerCase();
  return paginate((await getOrders()).filter((o) => (!opts.status || o.status === opts.status) && (!q || `${o.ref} ${o.customer.email} ${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q))), opts);
}
export async function updateOrderStatus(id: string, status: Order["status"], extra?: { notes?: string; trackingCode?: string }): Promise<void> {
  changeDemoState((s) => { Object.assign(required(s.orders, id), extra, { status, updatedAt: new Date() }); });
}

export async function saveCustomOrder(data: Omit<CustomOrder, "id" | "createdAt" | "updatedAt">): Promise<string> {
  return changeDemoState((s) => {
    const id = demoId(); s.customOrders.unshift({ ...data, id, createdAt: new Date(), updatedAt: new Date() }); return id;
  });
}
export async function getCustomOrders(): Promise<CustomOrder[]> { return readDemoState().customOrders; }
export async function getCustomOrdersPaginated(opts: PaginationOptions & { status?: CustomOrder["status"] } = {}): Promise<PaginatedResult<CustomOrder>> {
  return paginate((await getCustomOrders()).filter((o) => !opts.status || o.status === opts.status), opts);
}
export async function updateCustomOrderStatus(id: string, status: CustomOrder["status"], adminNotes?: string): Promise<void> {
  changeDemoState((s) => { Object.assign(required(s.customOrders, id), { status, updatedAt: new Date() }, adminNotes === undefined ? {} : { adminNotes }); });
}

export async function saveSubscriber(email: string, source: "footer" | "popup"): Promise<string | null> {
  return changeDemoState((s) => {
    const normalized = email.trim().toLowerCase();
    const old = s.subscribers.find((subscriber) => subscriber.email === normalized);
    if (old?.status === "active") return null;
    if (old) { old.status = "active"; return old.id; }
    const id = demoId(); s.subscribers.unshift({ id, email: normalized, source, status: "active", subscribedAt: new Date() }); return id;
  });
}
export async function getSubscribers(): Promise<NewsletterSubscriber[]> { return readDemoState().subscribers; }
export async function removeSubscriber(id: string): Promise<void> { changeDemoState((s) => { required(s.subscribers, id).status = "unsubscribed"; }); }

export async function saveContactMessage(data: { name: string; email: string; subject: string; message: string }): Promise<string> {
  return changeDemoState((s) => { const id = demoId(); s.messages.unshift({ ...data, id, status: "unread", createdAt: new Date() }); return id; });
}
export async function getContactMessages(): Promise<ContactMessage[]> { return readDemoState().messages; }
export async function updateContactStatus(id: string, status: ContactMessage["status"]): Promise<void> { changeDemoState((s) => { required(s.messages, id).status = status; }); }
export async function saveWholesaleLead(data: Omit<WholesaleLead, "id" | "createdAt" | "status">): Promise<string> {
  return changeDemoState((s) => { const id = demoId(); s.wholesaleLeads.unshift({ ...data, id, status: "new", createdAt: new Date() }); return id; });
}
export async function getWholesaleLeads(): Promise<WholesaleLead[]> { return readDemoState().wholesaleLeads; }
export async function updateWholesaleStatus(id: string, status: WholesaleLead["status"]): Promise<void> { changeDemoState((s) => { required(s.wholesaleLeads, id).status = status; }); }

export async function checkIsAdmin(uid: string, email?: string | null): Promise<boolean> {
  const state = readDemoState();
  return state.users.some((u) => u.id === uid && u.email === email?.toLowerCase()) && state.admins.some((a) => a.email === email?.toLowerCase() && a.isActive);
}
export async function getAdminUsers(): Promise<AdminUser[]> { return readDemoState().admins; }
export async function saveAdminUser(data: AdminUserInput): Promise<string> {
  return changeDemoState((s) => {
    const email = data.email.trim().toLowerCase();
    const old = s.admins.find((a) => a.email === email);
    if (old) Object.assign(old, data, { id: email, email, updatedAt: new Date() });
    else s.admins.push({ ...data, id: email, email, createdAt: new Date(), updatedAt: new Date() });
    return email;
  });
}
export async function updateAdminUser(id: string, data: Partial<AdminUserInput>): Promise<void> {
  changeDemoState((s) => {
    const email = data.email?.trim().toLowerCase();
    if (email && email !== id && s.admins.some((a) => a.email === email)) throw AppError.conflict("This demo admin already exists.");
    Object.assign(required(s.admins, id.toLowerCase()), data, email ? { id: email, email } : {}, { updatedAt: new Date() });
  });
}
export async function deleteAdminUser(id: string): Promise<void> { changeDemoState((s) => { s.admins = s.admins.filter((a) => a.id !== id.toLowerCase()); }); }
export async function logAdminAction(uid: string, email: string, action: string, details?: Record<string, unknown>): Promise<void> {
  changeDemoState((s) => { s.auditLogs.unshift({ id: demoId(), uid, email, action, details: { ...details, simulated: true }, timestamp: new Date() }); });
}
export async function getAuditLogs(limitCount = 100): Promise<AuditEntry[]> { return readDemoState().auditLogs.slice(0, Math.min(Math.max(1, limitCount), 500)); }

export async function saveCoupon(data: CouponInput): Promise<string> {
  return changeDemoState((s) => {
    const code = data.code.trim().toUpperCase();
    if (s.coupons.some((c) => c.code === code)) throw AppError.conflict("A coupon with this code already exists.");
    const id = demoId(); s.coupons.unshift({ ...data, id, code, usedCount: 0, createdAt: new Date() }); return id;
  });
}
export async function getCoupons(): Promise<Coupon[]> { return readDemoState().coupons; }
export async function updateCoupon(id: string, data: Partial<CouponInput>): Promise<void> {
  changeDemoState((s) => {
    const code = data.code?.trim().toUpperCase();
    if (code && s.coupons.some((c) => c.code === code && c.id !== id)) throw AppError.conflict("A coupon with this code already exists.");
    Object.assign(required(s.coupons, id), data, code ? { code } : {});
  });
}
export async function deleteCoupon(id: string): Promise<void> { changeDemoState((s) => { s.coupons = s.coupons.filter((c) => c.id !== id); }); }
export async function validateCoupon(code: string): Promise<Coupon | null> {
  return readDemoState().coupons.find((c) => c.code === code.trim().toUpperCase() && c.active && (!c.expiresAt || c.expiresAt > new Date()) && (c.maxUses === undefined || c.usedCount < c.maxUses)) ?? null;
}
export async function incrementCouponUse(id: string): Promise<void> { changeDemoState((s) => { required(s.coupons, id).usedCount++; }); }

export async function getSiteSettings(): Promise<SiteSettings> { return readDemoState().settings; }
export async function saveSiteSettings(data: Partial<Omit<SiteSettings, "updatedAt">>): Promise<void> {
  changeDemoState((s) => {
    const merged = { ...s.settings, ...data };
    const storefront = normalizeStorefrontSettings(merged.storefront);
    s.settings = { ...merged, collections: normalizeCollections(merged.collections), storefront, simplePages: normalizeSimplePages(merged.simplePages, storefront.contactEmail), updatedAt: new Date() };
  });
}
export async function getCustomers(): Promise<CustomerSummary[]> {
  const customers = new Map<string, CustomerSummary>();
  for (const o of await getOrders()) {
    const email = o.customer.email;
    const old = customers.get(email);
    if (old) { old.orderCount++; old.totalSpend += o.total; if (o.createdAt > old.lastOrderAt) old.lastOrderAt = o.createdAt; }
    else customers.set(email, { email, name: `${o.customer.firstName} ${o.customer.lastName}`, phone: o.customer.phone, orderCount: 1, totalSpend: o.total, lastOrderAt: o.createdAt });
  }
  return [...customers.values()].sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime());
}

export async function getAllReviews(): Promise<ProductReview[]> { return readDemoState().reviews; }
export async function getProductReviews(slug: string): Promise<ProductReview[]> { return (await getAllReviews()).filter((r) => r.productSlug === slug && r.status === "approved"); }
export async function updateReviewStatus(id: string, status: ProductReview["status"]): Promise<void> { changeDemoState((s) => { required(s.reviews, id).status = status; }); }
export async function deleteReview(id: string): Promise<void> { changeDemoState((s) => { s.reviews = s.reviews.filter((r) => r.id !== id); }); }
export async function saveProductReview(review: { productSlug: string; name: string; location: string; rating: number; body: string }): Promise<void> {
  changeDemoState((s) => { s.reviews.unshift({ ...review, name: review.name.trim(), location: review.location.trim(), body: review.body.trim(), rating: Math.min(5, Math.max(1, Math.round(review.rating))), id: demoId(), status: "pending", createdAt: new Date() }); });
}
export async function getFlyers(): Promise<Flyer[]> { return readDemoState().flyers; }
export async function getActiveFlyer(): Promise<Flyer | null> { return (await getFlyers()).find((f) => f.isActive) ?? null; }
export async function saveFlyer(input: { imageUrl: string; title: string; delaySeconds: number }): Promise<string> {
  return changeDemoState((s) => { const id = demoId(); s.flyers.unshift({ ...input, id, title: input.title.trim(), isActive: false, createdAt: new Date() }); return id; });
}
export async function setFlyerActive(id: string, isActive: boolean): Promise<void> {
  changeDemoState((s) => { const flyer = required(s.flyers, id); if (isActive) s.flyers.forEach((f) => { f.isActive = false; }); flyer.isActive = isActive; });
}
export async function deleteFlyer(id: string): Promise<void> { changeDemoState((s) => { s.flyers = s.flyers.filter((f) => f.id !== id); }); }
