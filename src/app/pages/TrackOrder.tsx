import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { WhatsAppFAB } from "../components/WhatsAppFAB";
import { Package, MessageCircle, Truck, CheckCircle2, Clock } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getOrders, type Order } from "../lib/db";
import { buildWhatsAppHref } from "../lib/siteSettings";

const steps = [
  { icon: Clock, label: "Order Confirmed" },
  { icon: Package, label: "In Production" },
  { icon: Truck, label: "Dispatched" },
  { icon: CheckCircle2, label: "Delivered" },
];

export default function TrackOrder() {
  usePageTitle("Track Your Order | Wearables Atelier");
  const { settings } = useSiteSettings();
  const [orderNo, setOrderNo] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = (await getOrders()).find((item) => item.ref.toLowerCase() === orderNo.trim().toLowerCase() && item.customer.email.toLowerCase() === email.trim().toLowerCase());
    setOrder(found ?? null);
    setError(found ? "" : "No demo order matches this reference and email in this browser.");
    setSubmitted(Boolean(found));
  };
  const currentStep = order ? ({ received: 0, confirmed: 0, processing: 1, dispatched: 2, delivered: 3, cancelled: -1, refunded: -1 }[order.status]) : 0;
  const statusLabel = order?.status === "processing" ? "In Production" : order?.status ?? "";

  const inputStyle = { fontFamily: "'DM Sans', sans-serif", borderColor: "rgba(13,13,13,0.2)", backgroundColor: "transparent", color: "#0D0D0D" };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontWeight: 600 as const, color: "#0D0D0D" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="pt-28 pb-20">
        <div className="max-w-[640px] mx-auto px-6 lg:px-10">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] mb-3 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>Order Status</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(36px, 5vw, 56px)", color: "#0D0D0D" }}>Track Your Order</h1>
          </div>

          {!submitted ? (
            <>
              {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-10">
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase block mb-2" style={labelStyle}>Order Number *</label>
                  <input
                    type="text"
                    required
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    placeholder="e.g. WBA-DEMO-0001"
                    className="w-full px-4 py-3 text-sm outline-none border"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs tracking-[0.15em] uppercase block mb-2" style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email used at checkout"
                    className="w-full px-4 py-3 text-sm outline-none border"
                    style={inputStyle}
                  />
                </div>
                <button type="submit" className="py-4 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-90" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#0D0D0D", color: "#C9A84C" }}>
                  TRACK ORDER
                </button>
              </form>

              {/* How to find order number */}
              <div className="p-5" style={{ backgroundColor: "#EDE8DF" }}>
                <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Where to find your order number</p>
                <ul className="flex flex-col gap-2 text-sm" style={{ color: "#6B6560" }}>
                  <li>• Demo example: WBA-DEMO-0001 with customer@demo.example</li>
                  <li>• On the confirmation page after a simulated checkout</li>
                  <li>• In your account under My Orders</li>
                </ul>
              </div>
            </>
          ) : (
            <div>
              {/* Mock tracking result */}
              <div className="p-6 mb-8" style={{ border: "1px solid rgba(201,168,76,0.3)", backgroundColor: "#EDE8DF" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#6B6560" }}>Order</p>
                  <p className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#6B6560" }}>Status</p>
                </div>
                <div className="flex items-center justify-between">
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "20px", color: "#0D0D0D" }}>{orderNo}</p>
                  <span className="px-3 py-1 text-[10px] tracking-widest uppercase" style={{ backgroundColor: "#C9A84C", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* Progress steps */}
              <div className="relative flex justify-between mb-10">
                <div className="absolute top-4 left-0 right-0 h-px" style={{ backgroundColor: "rgba(13,13,13,0.1)" }} />
                <div className="absolute top-4 left-0 h-px" style={{ backgroundColor: "#C9A84C", width: `${Math.max(0, currentStep) * 100 / 3}%` }} />
                {steps.map((s, i) => {
                  const active = i <= currentStep;
                  return (
                    <div key={s.label} className="relative flex flex-col items-center gap-2 z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: active ? "#C9A84C" : "#EDE8DF", border: `2px solid ${active ? "#C9A84C" : "rgba(13,13,13,0.15)"}` }}
                      >
                        <s.icon size={14} color={active ? "#0D0D0D" : "#6B6560"} />
                      </div>
                      <p className="text-[10px] tracking-[0.1em] uppercase text-center max-w-[60px]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: active ? "#0D0D0D" : "#6B6560" }}>
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-5 mb-8" style={{ backgroundColor: "rgba(201,168,76,0.08)", borderLeft: "2px solid #C9A84C" }}>
                <p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Latest Update</p>
                <p className="text-sm" style={{ color: "#6B6560" }}>Demo order status: {statusLabel}. This reflects browser-only admin updates; no real production or delivery takes place.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={() => { setSubmitted(false); setOrderNo(""); setEmail(""); }} className="flex-1 py-3 text-xs tracking-[0.2em] uppercase border transition-colors hover:border-[#0D0D0D]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderColor: "rgba(13,13,13,0.3)", color: "#0D0D0D" }}>
                  Track Another Order
                </button>
                <a
                  href={buildWhatsAppHref(
                    settings.storefront,
                    `Hi! I'd like an update on order ${orderNo}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs tracking-[0.2em] uppercase"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#25D366", color: "#fff" }}
                >
                  <MessageCircle size={14} /> Chat with Us
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
