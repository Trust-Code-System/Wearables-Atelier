import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as services from "../../app/lib/db";
import { authService } from "../../app/lib/auth";
import { changeDemoState, DEMO_STORAGE_KEY, readDemoState, resetDemoState } from "../../app/lib/mockStore";
import { simulateCheckout } from "../../app/lib/payment";
import { sendBroadcast, sendContactEmail, sendCustomOrderEmail, sendNewsletterSignup, sendOrderConfirmation } from "../../app/lib/email";
import { uploadImageFile } from "../../app/lib/uploads";

const customer = { firstName: "Demo", lastName: "Customer", email: "customer@demo.example", phone: "+2348000000000", address: "12 Example Street", city: "Lagos", state: "Lagos", country: "Nigeria" };
const fetchSpy = vi.fn(() => { throw new Error("Mock workflows must not use a network service"); });
beforeEach(() => { localStorage.clear(); resetDemoState(); fetchSpy.mockClear(); vi.stubGlobal("fetch", fetchSpy); });
afterEach(() => { expect(fetchSpy).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function checkoutItems() {
  const product = (await services.getProducts())[0];
  return [{ id: product.slug, name: product.name, category: product.category, size: "M", price: product.price, qty: 2, img: product.images[0] }];
}

describe("standalone customer and admin journeys", () => {
  it("seeds the existing ten-product catalog and realistic populated admin sections", async () => {
    const products = await services.getProducts();
    expect(products).toHaveLength(10);
    expect(products[0]).toMatchObject({ slug: "embellished-lace-boubou", price: 120000, images: ["/images/collection/look-01.png", "/images/collection/look-02.png", "/images/collection/look-03.png"] });
    expect(await services.getOrders()).toHaveLength(24);
    expect(await services.getCustomers()).toHaveLength(6);
    for (const records of [await services.getCustomOrders(), await services.getSubscribers(), await services.getContactMessages(), await services.getWholesaleLeads(), await services.getAdminUsers(), await services.getCoupons(), await services.getAllReviews(), await services.getFlyers(), await services.getAuditLogs()]) expect(records.length).toBeGreaterThan(0);
    expect((await services.getSiteSettings()).collections.length).toBeGreaterThan(0);
    expect(await services.getActiveFlyer()).toBeNull();
  });

  it("shares saved, edited and deleted products between admin and storefront, retaining dates on refresh", async () => {
    const product = (await services.getProducts())[0];
    const input = { ...product, slug: "demo-new-piece", name: "Demo New Piece" };
    expect(await services.saveProduct(input)).toBe(input.slug);
    await services.updateProduct(input.slug, { name: "Updated Demo Piece", price: 75000 });
    expect(await services.getProduct(input.slug)).toMatchObject({ name: "Updated Demo Piece", price: 75000 });
    const stored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)!);
    expect(stored.products[0].name).toBe("Updated Demo Piece");
    expect((await services.getProduct(input.slug))!.createdAt).toBeInstanceOf(Date);
    await services.saveProduct({ ...input, price: 80000 });
    expect((await services.getProducts()).filter((p) => p.slug === input.slug)).toHaveLength(1);
    await services.deleteProduct(input.slug);
    expect(await services.getProduct(input.slug)).toBeNull();
  });

  it("does not resurrect the seed catalog after deleting every product", async () => {
    for (const product of await services.getProducts()) await services.deleteProduct(product.slug);
    expect(await services.getProducts()).toEqual([]);
  });

  it("rejects duplicate product slugs and missing updates without overwriting records", async () => {
    const [first, second] = await services.getProducts();
    await expect(services.updateProduct(first.slug, { slug: second.slug })).rejects.toThrow("already exists");
    await expect(services.updateProduct("absent", { price: 1 })).rejects.toThrow("not found");
    expect((await services.getProduct(first.slug))!.price).toBe(first.price);
  });

  it("paginates filtered products without missing records even when creation timestamps tie", async () => {
    changeDemoState((s) => { s.products.forEach((p) => { p.createdAt = new Date("2026-01-01"); }); });
    let cursor: string | null = null;
    const ids: string[] = [];
    do {
      const page: services.PaginatedResult<services.Product> = await services.getProductsPaginated({ limit: 2, cursor, category: "ready-to-wear", inStock: true });
      ids.push(...page.data.map((p) => p.id)); cursor = page.meta.nextCursor;
    } while (cursor);
    expect(new Set(ids).size).toBe(4);
    expect(ids).toHaveLength(4);
    expect((await services.getProductsPaginated({ featured: true })).data).toHaveLength(6);
  });

  it("completes discounted checkout, records coupon usage and exposes the order and customer to admin", async () => {
    const items = await checkoutItems();
    const coupon = await services.validateCoupon(" welcome10 ");
    const order = await simulateCheckout({ customer, items, couponCode: "WELCOME10" });
    expect(order).toMatchObject({ subtotal: 240000, discountAmount: 24000, total: 216000, paymentStatus: "paid", status: "received" });
    expect(order.ref).toMatch(/^WBA-DEMO-/);
    expect(order.paymentRef).toMatch(/^DEMO-/);
    expect(await services.getOrder(order.id)).toEqual(order);
    expect((await services.validateCoupon("WELCOME10"))!.usedCount).toBe(coupon!.usedCount + 1);
    expect((await services.getCustomers()).find((c) => c.email === customer.email)!.orderCount).toBe(5);
    await services.updateOrderStatus(order.id, "dispatched", { trackingCode: "DEMO-TRACK-NEW", notes: "Sample dispatch" });
    expect(await services.getOrder(order.id)).toMatchObject({ status: "dispatched", trackingCode: "DEMO-TRACK-NEW" });
  });

  it("rejects empty checkout and invalid coupons without creating an order", async () => {
    await expect(simulateCheckout({ customer, items: [] })).rejects.toThrow("Add an item");
    await expect(simulateCheckout({ customer, items: await checkoutItems(), couponCode: "PASTSALE" })).rejects.toThrow("no longer valid");
    expect(await services.getOrders()).toHaveLength(24);
  });

  it("filters order search before pagination and handles missing order details", async () => {
    const page = await services.getOrdersPaginated({ limit: 1, search: "WBA-DEMO-0020" });
    expect(page.data).toHaveLength(1); expect(page.meta.total).toBe(1);
    expect(page.meta.hasNext).toBe(false);
    expect((await services.getOrdersPaginated({ status: "received" })).data.every((o) => o.status === "received")).toBe(true);
    expect(await services.getOrder("not-found")).toBeNull();
    const saved = await services.saveOrder({ ...(await services.getOrders())[0], ref: "WBA-DEMO-EXTRA" });
    expect((await services.getOrder(saved))!.ref).toBe("WBA-DEMO-EXTRA");
  });

  it("keeps custom-order enquiries and admin status updates in the same local data", async () => {
    const input = { ...(await services.getCustomOrders())[0], name: "New Demo Customer", status: "new" as const };
    const id = await services.saveCustomOrder(input);
    await services.updateCustomOrderStatus(id, "quoted", "Demo quote: ₦150,000");
    expect((await services.getCustomOrders()).find((o) => o.id === id)).toMatchObject({ status: "quoted", adminNotes: "Demo quote: ₦150,000" });
    expect((await services.getCustomOrdersPaginated({ status: "quoted", limit: 1 })).meta.hasNext).toBe(true);
  });

  it("stores contact and wholesale submissions for admin triage", async () => {
    const id = await services.saveContactMessage({ name: "Demo", email: customer.email, subject: "Question", message: "A sample enquiry" });
    await services.updateContactStatus(id, "replied");
    expect((await services.getContactMessages())[0]).toMatchObject({ id, status: "replied" });
    const lead = await services.saveWholesaleLead({ business: "Demo Boutique", name: "Demo", email: customer.email, phone: customer.phone, categories: "Fabrics", quantity: "20", message: "Sample wholesale request" });
    await services.updateWholesaleStatus(lead, "converted");
    expect((await services.getWholesaleLeads())[0]).toMatchObject({ id: lead, status: "converted" });
  });

  it("deduplicates and reactivates newsletter subscriptions", async () => {
    const id = await services.saveSubscriber(" SAMPLE@demo.example ", "footer");
    expect(await services.saveSubscriber("sample@demo.example", "popup")).toBeNull();
    await services.removeSubscriber(id!);
    expect(await services.saveSubscriber("sample@demo.example", "popup")).toBe(id);
    expect((await services.getSubscribers()).filter((s) => s.email === "sample@demo.example")).toHaveLength(1);
  });

  it("validates coupon activation, expiry and usage limits and simulates CRUD", async () => {
    const id = await services.saveCoupon({ code: "limit1", discount: 0.2, maxUses: 1, active: true });
    expect(await services.validateCoupon("LIMIT1")).not.toBeNull();
    await expect(services.saveCoupon({ code: "limit1", discount: 0.1, active: true })).rejects.toThrow("already exists");
    await services.incrementCouponUse(id);
    expect(await services.validateCoupon("LIMIT1")).toBeNull();
    await services.updateCoupon(id, { code: "expired", maxUses: 10, expiresAt: new Date("2020-01-01") });
    expect(await services.validateCoupon("EXPIRED")).toBeNull();
    await services.updateCoupon(id, { expiresAt: undefined, active: false });
    expect(await services.validateCoupon("EXPIRED")).toBeNull();
    await services.deleteCoupon(id);
    expect((await services.getCoupons()).some((c) => c.id === id)).toBe(false);
  });

  it("keeps submitted reviews pending until admin approval", async () => {
    const slug = (await services.getProducts())[0].slug;
    await services.saveProductReview({ productSlug: slug, name: " Demo ", location: " Lagos ", rating: 5, body: " Beautiful piece. " });
    const review = (await services.getAllReviews())[0];
    expect((await services.getProductReviews(slug)).some((r) => r.id === review.id)).toBe(false);
    await services.updateReviewStatus(review.id, "approved");
    expect((await services.getProductReviews(slug)).find((r) => r.id === review.id)).toMatchObject({ name: "Demo", body: "Beautiful piece." });
    await services.deleteReview(review.id);
    expect((await services.getAllReviews()).some((r) => r.id === review.id)).toBe(false);
  });

  it("uses a single active flyer and simulates deletion", async () => {
    const a = await services.saveFlyer({ title: "Demo A", imageUrl: "/images/collection/look-01.png", delaySeconds: 1 });
    const b = await services.saveFlyer({ title: "Demo B", imageUrl: "/images/collection/look-02.png", delaySeconds: 3 });
    await services.setFlyerActive(a, true); await services.setFlyerActive(b, true);
    expect((await services.getFlyers()).filter((f) => f.isActive)).toHaveLength(1);
    expect((await services.getActiveFlyer())!.id).toBe(b);
    await services.setFlyerActive(b, false); expect(await services.getActiveFlyer()).toBeNull();
    await services.deleteFlyer(b); expect((await services.getFlyers()).some((f) => f.id === b)).toBe(false);
  });

  it("persists normalized storefront settings without discarding unrelated content", async () => {
    const before = await services.getSiteSettings();
    await services.saveSiteSettings({ announcementMessages: ["Demo announcement"], storefront: { ...before.storefront, contactEmail: "sample@demo.example" } });
    const after = await services.getSiteSettings();
    expect(after.announcementMessages).toEqual(["Demo announcement"]);
    expect(after.storefront.contactEmail).toBe("sample@demo.example");
    expect(after.collections).toEqual(before.collections);
    expect(after.simplePages).toEqual(before.simplePages);
    expect(after.updatedAt).toBeInstanceOf(Date);
  });

  it("returns detached records so UI mutations do not leak into stored data", async () => {
    const products = await services.getProducts(); products[0].price = 0;
    expect((await services.getProducts())[0].price).toBe(120000);
  });

  it("rejects a full browser store without committing a partial checkout", async () => {
    const items = await checkoutItems();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    await expect(simulateCheckout({ customer, items })).rejects.toThrow("could not be saved");
    expect(await services.getOrders()).toHaveLength(24);
  });
});

describe("simulated identities, email and uploads", () => {
  it("allows demo admin login and emits state changes without storing passwords", async () => {
    const events: string[] = [];
    const listener = authService.onAuthStateChange((event) => { events.push(event); });
    expect((await authService.getSession()).data.session).toBeNull();
    const result = await authService.signInWithPassword({ email: "OWNER@demo.example", password: "sample-password" });
    expect(result.error).toBeNull();
    expect(await services.checkIsAdmin(result.data.user!.id, result.data.user!.email)).toBe(true);
    await authService.updateUser({ data: { full_name: "Demo Owner Updated" }, password: "different-password" });
    expect((await authService.getSession()).data.session!.user.user_metadata.full_name).toBe("Demo Owner Updated");
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).not.toContain("sample-password");
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).not.toContain("different-password");
    await authService.signOut(); expect((await authService.getSession()).data.session).toBeNull();
    listener.data.subscription.unsubscribe(); expect(events).toEqual(["SIGNED_IN", "USER_UPDATED", "SIGNED_OUT"]);
  });

  it("simulates signup, duplicate detection, email verification and password reset", async () => {
    expect((await authService.signUp({ email: "invalid", password: "sample-password" })).error).not.toBeNull();
    expect((await authService.signUp({ email: "new@demo.example", password: "short" })).error).not.toBeNull();
    const result = await authService.signUp({ email: "new@demo.example", password: "sample-password", options: { data: { full_name: "Demo New Customer" } } });
    expect(result.data.user!.user_metadata.full_name).toBe("Demo New Customer");
    expect(await services.checkIsAdmin(result.data.user!.id, result.data.user!.email)).toBe(false);
    expect((await authService.signUp({ email: "new@demo.example", password: "sample-password" })).error).not.toBeNull();
    await authService.resend({ type: "signup", email: "new@demo.example" });
    expect((await authService.getSession()).data.session!.user.email_confirmed_at).toBeTruthy();
    expect((await authService.resetPasswordForEmail("new@demo.example")).error).toBeNull();
    expect((await authService.resetPasswordForEmail("invalid")).error).not.toBeNull();
    expect((await authService.updateUser({ password: "short" })).error).not.toBeNull();
    await authService.signOut(); expect((await authService.updateUser({ data: {} })).error).not.toBeNull();
    expect((await authService.signInWithPassword({ email: "invalid", password: "x" })).error).not.toBeNull();
    expect((await authService.signInWithPassword({ email: "another@demo.example", password: "sample-password" })).error).toBeNull();
  });

  it("reflects local admin role, activation and removal changes", async () => {
    await authService.signInWithPassword({ email: "new-admin@demo.example", password: "sample-password" });
    const user = (await authService.getSession()).data.session!.user;
    const id = await services.saveAdminUser({ email: user.email, role: "editor", isActive: true });
    expect(await services.checkIsAdmin(user.id, user.email)).toBe(true);
    await services.updateAdminUser(id, { role: "manager", isActive: false });
    expect(await services.checkIsAdmin(user.id, user.email)).toBe(false);
    await services.logAdminAction(user.id, user.email, "admin.updated", { id });
    expect((await services.getAuditLogs(1))[0]).toMatchObject({ action: "admin.updated", details: { simulated: true, id } });
    await services.deleteAdminUser(id);
    expect((await services.getAdminUsers()).some((a) => a.id === id)).toBe(false);
  });

  it("records simulated email activity and counts broadcasts without making requests", async () => {
    await sendContactEmail({ name: "Demo", email: customer.email, subject: "Demo", message: "Sample" });
    await sendNewsletterSignup(customer.email);
    await sendOrderConfirmation({ customerName: "Demo", customerEmail: customer.email, orderRef: "WBA-DEMO-1", total: "₦120,000" });
    await sendCustomOrderEmail({ name: "Demo", email: customer.email, phone: "", occasion: "", garment: "", budget: "", eventDate: "", bust: "", waist: "", hips: "", height: "", inspiration: "", notes: "" });
    expect(await sendBroadcast({ subject: "Demo", body: "Sample", recipients: [customer.email, "sample@demo.example"] })).toEqual({ sent: 2, failed: 0 });
    expect(readDemoState().emailActivity).toHaveLength(5);
  });

  it("creates a local data URL for an image and rejects invalid or oversized files", async () => {
    const file = new File([new Uint8Array([137, 80, 78, 71])], "demo.png", { type: "image/png" });
    expect(await uploadImageFile(file, "products")).toMatch(/^data:image\/png;base64,/);
    await expect(uploadImageFile(new File(["text"], "notes.txt", { type: "text/plain" }), "products")).rejects.toThrow("image file");
    await expect(uploadImageFile(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }), "products")).rejects.toThrow("under 2 MB");
  });
});
