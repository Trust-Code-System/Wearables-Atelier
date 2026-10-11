/** Email simulation: record intended recipients locally; never send messages. */
import { changeDemoState, demoId } from "./mockStore";
const FROM_NAME = "Wearables Atelier";

async function simulateEmail(payload: { type: string; data: Record<string, unknown> }): Promise<void> {
  changeDemoState((s) => {
    const recipient = payload.data.customerEmail ?? payload.data.email;
    s.emailActivity.unshift({ id: demoId(), type: payload.type, recipients: typeof recipient === "string" ? [recipient] : [], createdAt: new Date() });
  });
}

/** Contact form → admin notification */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  return simulateEmail({ type: "contact", data });
}

/** Custom order form → admin notification */
export async function sendCustomOrderEmail(data: {
  name: string;
  email: string;
  phone: string;
  occasion: string;
  garment: string;
  budget: string;
  eventDate: string;
  bust: string;
  waist: string;
  hips: string;
  height: string;
  inspiration: string;
  notes: string;
}): Promise<void> {
  return simulateEmail({ type: "custom_order", data });
}

/** Newsletter signup → welcome email to subscriber + admin notification */
export async function sendNewsletterSignup(subscriberEmail: string): Promise<void> {
  return simulateEmail({
    type: "newsletter",
    data: { email: subscriberEmail },
  });
}

/** Order confirmed → customer confirmation email */
export async function sendOrderConfirmation(data: {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  total: string;
}): Promise<void> {
  return simulateEmail({ type: "order_confirmation", data });
}

/** Counts simulated deliveries only; no network requests or email clients. */
export async function sendBroadcast(opts: { subject: string; body: string; recipients: string[] }): Promise<{ sent: number; failed: number }> {
  changeDemoState((s) => { s.emailActivity.unshift({ id: demoId(), type: "broadcast", recipients: [...opts.recipients], createdAt: new Date() }); });
  return { sent: opts.recipients.length, failed: 0 };
}
export { FROM_NAME };
