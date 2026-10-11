/** Simulate checkout locally. Never load a payment provider or handle card details. */
import { changeDemoState, demoId } from "./mockStore";
import type { Order, OrderItem } from "./types";

export async function simulateCheckout(input: { customer: Order["customer"]; items: OrderItem[]; couponCode?: string }): Promise<Order> {
  return changeDemoState((s) => {
    if (!input.items.length) throw new Error("Add an item before completing demo checkout.");
    const coupon = input.couponCode ? s.coupons.find((c) => c.code === input.couponCode?.trim().toUpperCase() && c.active && (!c.expiresAt || c.expiresAt > new Date()) && (c.maxUses === undefined || c.usedCount < c.maxUses)) : undefined;
    if (input.couponCode && !coupon) throw new Error("This demo coupon is no longer valid. Return to your cart and remove it.");
    const subtotal = input.items.reduce((sum, item) => sum + (item.salePrice ?? item.price) * item.qty, 0);
    const discountAmount = Math.round(subtotal * (coupon?.discount ?? 0));
    const ref = `WBA-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const order: Order = { id: demoId(), ref, customer: input.customer, items: input.items, subtotal, discountAmount, couponCode: coupon?.code, total: subtotal - discountAmount, status: "received", paymentStatus: "paid", paymentRef: `DEMO-${ref}`, notes: "Simulated payment. No money charged or real order placed.", createdAt: new Date(), updatedAt: new Date() };
    s.orders.unshift(order);
    if (coupon) coupon.usedCount++;
    return order;
  });
}
