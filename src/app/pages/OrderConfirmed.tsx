import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { sendOrderConfirmation } from "../lib/email";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { WhatsAppFAB } from "../components/WhatsAppFAB";
import { usePageTitle } from "../hooks/usePageTitle";
import { Check, Package, MessageCircle } from "lucide-react";

const NEXT_STEPS = [
  {
    icon: MessageCircle,
    title: "Confirmation message",
    body: "Confirmation messages are simulated. No WhatsApp message or email is sent.",
  },
  {
    icon: Package,
    title: "Crafted & dispatched",
    body: "Sample production and dispatch stages can be updated in the demo admin. No pieces are prepared or shipped.",
  },
  {
    icon: Check,
    title: "Delivered to you",
    body: "Delivery and tracking updates are simulated in this browser. No courier booking takes place.",
  },
];

export default function OrderConfirmed() {
  usePageTitle("Order Confirmed | Wearables Atelier");
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  // Generate a reference if none was passed (e.g. direct nav to this URL)
  const orderRef = ref ?? `WBA-${Date.now().toString(36).toUpperCase()}`;

  // Clear the cart is handled by the checkout flow that redirects here.
  // This page is intentionally stateless so a refresh doesn't re-clear.

  const emailSentRef = useRef(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    // Send confirmation email once per load (ref guards against StrictMode double-fire)
    const customerEmail = searchParams.get("email");
    const customerName  = searchParams.get("name");
    const total         = searchParams.get("total");
    if (customerEmail && !emailSentRef.current) {
      emailSentRef.current = true;
      sendOrderConfirmation({
        customerName:  customerName ?? "Valued Customer",
        customerEmail,
        orderRef,
        total: total ? `₦${Number(total).toLocaleString()}` : "",
      }).catch(() => {/* silent — order already placed */});
    }
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="pt-28 pb-20">
        <div className="max-w-[760px] mx-auto px-6 lg:px-10">

          {/* Hero */}
          <div className="text-center py-14 border-b" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
            {/* Animated checkmark */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ backgroundColor: "rgba(26,110,46,0.1)", border: "1.5px solid rgba(26,110,46,0.3)" }}
            >
              <Check size={28} style={{ color: "#1a6e2e" }} strokeWidth={2.5} />
            </div>

            <p
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}
            >
              Demo Order Received
            </p>
            <h1
              className="mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(36px, 5vw, 56px)",
                color: "#0D0D0D",
                lineHeight: 1.15,
              }}
            >
              Thank you for your order.
            </h1>
            <p
              className="mb-6 text-sm max-w-md mx-auto"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560", lineHeight: 1.8 }}
            >
              Your demo order is saved in this browser. Payment and confirmation messages are simulated; no real order is placed.
            </p>

            <div
              className="inline-flex items-center gap-3 px-5 py-3 text-xs tracking-[0.15em] uppercase"
              style={{ backgroundColor: "rgba(13,13,13,0.05)", border: "1px solid rgba(13,13,13,0.1)" }}
            >
              <span style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>Order reference</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#0D0D0D", letterSpacing: "0.12em" }}>{orderRef}</span>
            </div>
          </div>

          {/* What happens next */}
          <div className="py-12 border-b" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
            <p
              className="text-xs tracking-[0.3em] uppercase mb-8 text-center"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}
            >
              What happens next
            </p>
            <div className="flex flex-col gap-0">
              {NEXT_STEPS.map(({ icon: Icon, title, body }, i) => (
                <div key={title} className="flex gap-5 relative">
                  {/* Line connector */}
                  {i < NEXT_STEPS.length - 1 && (
                    <div
                      className="absolute left-[19px] top-10 bottom-0 w-px"
                      style={{ backgroundColor: "rgba(201,168,76,0.2)" }}
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                    style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(201,168,76,0.3)" }}
                  >
                    <Icon size={16} style={{ color: "#C9A84C" }} />
                  </div>
                  <div className="pb-8 flex-1">
                    <p
                      className="mb-1 text-sm font-semibold"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}
                    >
                      {title}
                    </p>
                    <p
                      className="text-sm leading-7"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="px-10 py-4 text-xs tracking-[0.2em] uppercase w-full sm:w-auto text-center"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#0D0D0D", color: "#C9A84C" }}
            >
              Continue Shopping
            </Link>
            <Link
              to="/track"
              className="px-10 py-4 text-xs tracking-[0.2em] uppercase border w-full sm:w-auto text-center transition-all hover:border-[#C9A84C] hover:text-[#C9A84C]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderColor: "rgba(13,13,13,0.25)", color: "#0D0D0D", backgroundColor: "transparent" }}
            >
              Track Your Order
            </Link>
          </div>

        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
