import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { getOrders, updateOrderStatus, logAdminAction, type Order } from "../../lib/db";
import { useAdmin } from "../../context/AdminContext";

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

function exportCSV(orders: Order[]) {
  const headers = [
    "Order Ref",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Address",
    "City",
    "State",
    "Country",
    "Items",
    "Subtotal",
    "Discount",
    "Coupon",
    "Total",
    "Status",
    "Payment Status",
    "Demo Payment Ref",
    "Tracking Code",
    "Notes",
    "Date",
  ];

  const rows = orders.map((o) => [
    o.ref,
    o.customer.firstName,
    o.customer.lastName,
    o.customer.email,
    o.customer.phone,
    o.customer.address,
    o.customer.city,
    o.customer.state,
    o.customer.country,
    o.items.map((i) => `${i.name} x${i.qty}`).join("; "),
    o.subtotal,
    o.discountAmount,
    o.couponCode ?? "",
    o.total,
    o.status,
    o.paymentStatus,
    o.paymentRef,
    o.trackingCode ?? "",
    o.notes ?? "",
    formatDate(o.createdAt),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSavedIds((prev) => new Set(prev).add(orderId));
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }, 2000);
      if (user) {
        void logAdminAction(user.id, user.email ?? "", "order_status_changed", {
          orderId,
          ref: order?.ref,
          from: order?.status,
          to: newStatus,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  const filtered = orders
    .filter((o) => activeTab === "all" || o.status === activeTab)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.ref.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q)
      );
    });

  const tabs: Array<"all" | OrderStatus> = ["all", ...ALL_STATUSES];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] px-3 py-2 border bg-white" style={{ borderColor: "rgba(13,13,13,0.2)" }}>
          <Search size={14} style={{ color: "#9B9590", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search ref, name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}
          />
        </div>
        <p className="text-sm" style={{ color: "#6B6560" }}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#0D0D0D", color: "#C9A84C", fontWeight: 600 }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex flex-wrap gap-1 mb-5 p-1"
        style={{ backgroundColor: "rgba(13,13,13,0.04)" }}
      >
        {tabs.map((tab) => {
          const count = tab === "all" ? orders.length : orders.filter((o) => o.status === tab).length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-2 text-xs capitalize font-medium transition-colors"
              style={{
                backgroundColor: active ? "#0D0D0D" : "transparent",
                color: active ? "#C9A84C" : "#6B6560",
              }}
            >
              {tab} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(13,13,13,0.08)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: "#9B9590" }}>
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(13,13,13,0.08)", backgroundColor: "rgba(13,13,13,0.02)" }}>
                  {["Order Ref", "Customer", "Items", "Total", "Date", "Status", "Update Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.12em] font-semibold"
                      style={{ color: "#6B6560" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid rgba(13,13,13,0.04)", cursor: "pointer" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(201,168,76,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs font-semibold"
                      style={{ color: "#C9A84C" }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      {order.ref}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "#0D0D0D" }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div>
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div className="text-xs" style={{ color: "#6B6560" }}>
                        {order.customer.email}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#6B6560" }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </td>
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "#0D0D0D" }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      {formatAmount(order.total)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#6B6560" }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      {formatDate(order.createdAt)}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select
                          title="Update order status"
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="text-xs px-2 py-1.5 outline-none border"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            borderColor: "rgba(13,13,13,0.2)",
                            backgroundColor: "transparent",
                            color: "#0D0D0D",
                          }}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {savedIds.has(order.id) && (
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: "#15803d" }}
                          >
                            Saved ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
