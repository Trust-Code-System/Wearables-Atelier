import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getOrder, updateOrderStatus, type Order } from "../../lib/db";

type OrderStatus = Order["status"];

const ALL_STATUSES: OrderStatus[] = [
  "received",
  "confirmed",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string }> = {
  received: { bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
  confirmed: { bg: "rgba(99,102,241,0.12)", color: "#4338ca" },
  processing: { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
  dispatched: { bg: "rgba(249,115,22,0.12)", color: "#c2410c" },
  delivered: { bg: "rgba(34,197,94,0.12)", color: "#15803d" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#b91c1c" },
  refunded: { bg: "rgba(107,114,128,0.12)", color: "#374151" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as OrderStatus] ?? STATUS_STYLES.received;
  return (
    <span
      className="inline-block px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG");
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#6B6560",
  marginBottom: "6px",
  display: "block",
};

const inputClass = "w-full px-3 py-2.5 text-sm outline-none border bg-transparent transition-colors focus:border-[#C9A84C]";
const inputStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  borderColor: "rgba(13,13,13,0.2)",
  color: "#0D0D0D",
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<OrderStatus>("received");
  const [notes, setNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then((data) => {
        if (data) {
          setOrder(data);
          setStatus(data.status);
          setNotes(data.notes ?? "");
          setTrackingCode(data.trackingCode ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await updateOrderStatus(order.id, status, {
        notes: notes || undefined,
        trackingCode: trackingCode || undefined,
      });
      setOrder((prev) => prev ? { ...prev, status, notes, trackingCode } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin" style={{ color: "#C9A84C" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center" style={{ color: "#6B6560" }}>
        <p>Order not found.</p>
        <button
          onClick={() => navigate("/admin/orders")}
          className="mt-4 text-sm"
          style={{ color: "#C9A84C" }}
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Back + header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/orders")}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 mt-1"
          style={{ color: "#6B6560" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1
              className="font-mono text-lg font-semibold"
              style={{ color: "#C9A84C" }}
            >
              {order.ref}
            </h1>
            <StatusBadge status={order.status} />
            <span
              className="inline-block px-2.5 py-1 text-[11px] font-semibold capitalize"
              style={{
                backgroundColor:
                  order.paymentStatus === "paid"
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(239,68,68,0.12)",
                color: order.paymentStatus === "paid" ? "#15803d" : "#b91c1c",
              }}
            >
              {order.paymentStatus}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#6B6560" }}>
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Customer Info */}
        <div
          className="p-5"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(13,13,13,0.08)",
          }}
        >
          <h2
            className="mb-4 pb-3 border-b"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "18px",
              color: "#0D0D0D",
              borderColor: "rgba(13,13,13,0.08)",
            }}
          >
            Customer Information
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Name", value: `${order.customer.firstName} ${order.customer.lastName}` },
              { label: "Email", value: order.customer.email },
              { label: "Phone", value: order.customer.phone },
              { label: "Address", value: order.customer.address },
              { label: "City", value: order.customer.city },
              { label: "State", value: order.customer.state },
              { label: "Country", value: order.customer.country },
            ].map((f) => (
              <div key={f.label} className={f.label === "Address" ? "col-span-2" : ""}>
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-0.5" style={{ color: "#6B6560" }}>
                  {f.label}
                </p>
                <p style={{ color: "#0D0D0D" }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div
          className="p-5"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(13,13,13,0.08)",
          }}
        >
          <h2
            className="mb-4 pb-3 border-b"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "18px",
              color: "#0D0D0D",
              borderColor: "rgba(13,13,13,0.08)",
            }}
          >
            Order Summary
          </h2>
          <div className="flex flex-col gap-2 text-sm mb-4">
            <div className="flex justify-between">
              <span style={{ color: "#6B6560" }}>Subtotal</span>
              <span style={{ color: "#0D0D0D", fontWeight: 600 }}>{formatAmount(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "#6B6560" }}>
                  Discount {order.couponCode ? `(${order.couponCode})` : ""}
                </span>
                <span style={{ color: "#e53935" }}>−{formatAmount(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
              <span className="font-bold" style={{ color: "#0D0D0D" }}>Total</span>
              <span className="font-bold text-base" style={{ color: "#0D0D0D" }}>{formatAmount(order.total)}</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: "#6B6560" }}>
            <span className="font-semibold" style={{ color: "#0D0D0D" }}>Demo Payment Ref: </span>
            <span className="font-mono">{order.paymentRef}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div
        className="p-5 mb-5"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(13,13,13,0.08)",
        }}
      >
        <h2
          className="mb-4 pb-3 border-b"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "18px",
            color: "#0D0D0D",
            borderColor: "rgba(13,13,13,0.08)",
          }}
        >
          Items Ordered
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(13,13,13,0.08)" }}>
                {["Product", "Category", "Size", "Price", "Qty", "Total"].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-left text-[11px] uppercase tracking-[0.12em] font-semibold pr-4"
                    style={{ color: "#6B6560" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const unitPrice = item.salePrice ?? item.price;
                return (
                  <tr
                    key={`${item.id}-${idx}`}
                    style={{ borderBottom: "1px solid rgba(13,13,13,0.04)" }}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {item.img && (
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-10 h-10 object-cover flex-shrink-0"
                          />
                        )}
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: "italic",
                            fontSize: "15px",
                            color: "#0D0D0D",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "#6B6560" }}>
                      {item.category}
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "#6B6560" }}>
                      {item.size}
                    </td>
                    <td className="py-3 pr-4" style={{ color: "#0D0D0D" }}>
                      {formatAmount(unitPrice)}
                    </td>
                    <td className="py-3 pr-4" style={{ color: "#0D0D0D" }}>
                      {item.qty}
                    </td>
                    <td className="py-3 font-semibold" style={{ color: "#0D0D0D" }}>
                      {formatAmount(unitPrice * item.qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update */}
      <div
        className="p-5"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(13,13,13,0.08)",
        }}
      >
        <h2
          className="mb-4 pb-3 border-b"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "18px",
            color: "#0D0D0D",
            borderColor: "rgba(13,13,13,0.08)",
          }}
        >
          Update Order
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label style={labelStyle}>Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className={inputClass}
              style={inputStyle}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tracking Code</label>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="e.g. ABC123456NG"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Internal Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for internal use..."
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: "#C9A84C",
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="text-sm font-semibold" style={{ color: "#15803d" }}>
              Saved successfully ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
