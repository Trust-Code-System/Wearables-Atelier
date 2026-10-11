import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getCoupons,
  saveCoupon,
  updateCoupon,
  deleteCoupon,
  logAdminAction,
  type Coupon,
  type CouponInput,
} from "../../lib/db";
import { useAdmin } from "../../context/AdminContext";

const inputCls = "w-full px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white";
const inputStyle = { borderColor: "rgba(13,13,13,0.2)", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" };
const labelCls = "text-xs tracking-[0.12em] uppercase block mb-1.5 font-semibold";
const labelStyle = { color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" };

function emptyForm(): CouponInput {
  return { code: "", discount: 0.1, description: "", maxUses: undefined, expiresAt: undefined, active: true };
}

function toDateInputValue(d?: Date): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

type PanelProps = {
  coupon: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
  adminUser?: { id: string; email: string | null } | null;
};

function CouponPanel({ coupon, onClose, onSaved, adminUser }: PanelProps) {
  const isEdit = !!coupon;
  const [form, setForm] = useState<CouponInput>(
    coupon
      ? {
          code: coupon.code,
          discount: coupon.discount,
          description: coupon.description ?? "",
          maxUses: coupon.maxUses,
          expiresAt: coupon.expiresAt,
          active: coupon.active,
        }
      : emptyForm()
  );
  const [discountPct, setDiscountPct] = useState(
    coupon ? Math.round(coupon.discount * 100) : 10
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CouponInput>(key: K, val: CouponInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleDiscountChange(val: string) {
    const pct = Math.min(100, Math.max(0, Number(val) || 0));
    setDiscountPct(pct);
    set("discount", pct / 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    if (form.discount <= 0 || form.discount > 1) { setError("Discount must be between 1% and 100%"); return; }

    setSaving(true);
    try {
      const data: CouponInput = { ...form, code: form.code.toUpperCase() };
      if (isEdit) {
        await updateCoupon(coupon.id, data);
        if (adminUser) void logAdminAction(adminUser.id, adminUser.email ?? "", "coupon_updated", { code: data.code });
        toast.success("Coupon updated");
      } else {
        await saveCoupon(data);
        if (adminUser) void logAdminAction(adminUser.id, adminUser.email ?? "", "coupon_created", { code: data.code });
        toast.success("Coupon created");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
      toast.error("Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-full overflow-y-auto"
        style={{ backgroundColor: "#F8F5F0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: "#F8F5F0", borderColor: "rgba(13,13,13,0.12)" }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "22px",
              fontWeight: 300,
              color: "#0D0D0D",
            }}
          >
            {isEdit ? "Edit Coupon" : "Add New Coupon"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:opacity-60"
          >
            <X size={18} style={{ color: "#6B6560" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className={labelCls} style={labelStyle}>Coupon Code *</label>
            <input
              className={inputCls}
              style={inputStyle}
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              required
            />
            <p className="mt-1 text-xs" style={{ color: "#6B6560" }}>Codes are automatically uppercased.</p>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Discount % *</label>
            <input
              type="number"
              className={inputCls}
              style={inputStyle}
              value={discountPct || ""}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="e.g. 20"
              min={1}
              max={100}
              required
            />
            <p className="mt-1 text-xs" style={{ color: "#6B6560" }}>Stored as {(form.discount * 100).toFixed(0)}% off the subtotal.</p>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Description</label>
            <input
              className={inputCls}
              style={inputStyle}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Summer promo for newsletter subscribers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Max Uses</label>
              <input
                type="number"
                className={inputCls}
                style={inputStyle}
                value={form.maxUses ?? ""}
                onChange={(e) => set("maxUses", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited"
                min={1}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Expires At</label>
              <input
                type="date"
                title="Expiry date"
                aria-label="Expires At"
                className={inputCls}
                style={inputStyle}
                value={toDateInputValue(form.expiresAt)}
                onChange={(e) =>
                  set("expiresAt", e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-[#C9A84C]"
            />
            <span className={labelCls + " mb-0"} style={labelStyle}>Active</span>
          </label>

          {error && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "#e53935" }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-xs tracking-[0.12em] uppercase font-semibold disabled:opacity-50"
              style={{
                backgroundColor: "#C9A84C",
                color: "#0D0D0D",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs tracking-[0.12em] uppercase font-semibold border hover:opacity-70"
              style={{
                borderColor: "rgba(13,13,13,0.2)",
                color: "#6B6560",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteDialogProps = {
  coupon: Coupon;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
};

function DeleteDialog({ coupon, onConfirm, onCancel, deleting }: DeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm p-6 flex flex-col gap-4"
        style={{ backgroundColor: "#F8F5F0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "20px",
            fontWeight: 300,
            color: "#0D0D0D",
          }}
        >
          Delete Coupon
        </h3>
        <p className="text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
          Are you sure you want to delete the coupon <strong style={{ color: "#0D0D0D" }}>{coupon.code}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold disabled:opacity-50"
            style={{ backgroundColor: "#e53935", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            Delete
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold border hover:opacity-70"
            style={{ borderColor: "rgba(13,13,13,0.2)", color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Coupons() {
  const { user } = useAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCoupons(await getCoupons());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openAdd() { setEditing(null); setPanelOpen(true); }
  function openEdit(c: Coupon) { setEditing(c); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEditing(null); }

  async function handleToggleActive(c: Coupon) {
    setTogglingId(c.id);
    try {
      await updateCoupon(c.id, { active: !c.active });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteCoupon(deleting.id);
      if (user) void logAdminAction(user.id, user.email ?? "", "coupon_deleted", { code: deleting.code });
      toast.success(`Coupon "${deleting.code}" deleted`);
      setDeleting(null);
      await load();
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeleteLoading(false);
    }
  }

  const now = new Date();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "32px",
              color: "#0D0D0D",
              lineHeight: 1.2,
            }}
          >
            Coupons &amp; Promos
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Create and manage discount codes with usage limits and expiry dates.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold"
          style={{
            backgroundColor: "#C9A84C",
            color: "#0D0D0D",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus size={14} />
          Add Coupon
        </button>
      </div>

      {/* Notice */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 mb-6 text-xs border-l-2"
        style={{
          borderColor: "#C9A84C",
          backgroundColor: "rgba(201,168,76,0.08)",
          color: "#6B6560",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Tag size={13} className="mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
        <span>
          Coupons are validated against browser-only demo data. Add/activate{" "}
          <strong style={{ color: "#0D0D0D" }}>IDANGANGAN</strong> here to make it work in{" "}
          <code
            className="px-1 py-0.5 text-xs"
            style={{ backgroundColor: "rgba(13,13,13,0.07)", borderRadius: 2 }}
          >
            Cart.tsx
          </code>
          .
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: "#C9A84C" }} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Tag size={36} style={{ color: "rgba(13,13,13,0.15)" }} />
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "20px",
              fontWeight: 300,
              color: "#6B6560",
            }}
          >
            No coupons yet
          </p>
          <p className="text-xs" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Create your first discount code above.
          </p>
        </div>
      ) : (
        <div
          className="border overflow-x-auto"
          style={{ borderColor: "rgba(13,13,13,0.1)", backgroundColor: "#fff" }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(13,13,13,0.1)" }}>
                {["Code", "Discount", "Description", "Uses", "Expires", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase font-semibold"
                    style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => {
                const expired = c.expiresAt ? c.expiresAt < now : false;
                const exhausted = c.maxUses !== undefined && c.usedCount >= c.maxUses;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: i < coupons.length - 1 ? "1px solid rgba(13,13,13,0.07)" : "none",
                    }}
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span
                        className="font-semibold text-xs tracking-[0.1em] px-2 py-1"
                        style={{
                          backgroundColor: "rgba(201,168,76,0.12)",
                          color: "#0D0D0D",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {c.code}
                      </span>
                    </td>
                    {/* Discount */}
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {Math.round(c.discount * 100)}%
                    </td>
                    {/* Description */}
                    <td
                      className="px-4 py-3 max-w-[200px] truncate"
                      style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {c.description || <span className="italic text-xs">—</span>}
                    </td>
                    {/* Uses */}
                    <td className="px-4 py-3" style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}>
                      {c.usedCount}
                      {c.maxUses !== undefined ? ` / ${c.maxUses}` : " / ∞"}
                      {exhausted && (
                        <span
                          className="ml-1.5 text-xs px-1.5 py-0.5"
                          style={{ backgroundColor: "#e53935", color: "#fff", borderRadius: 2 }}
                        >
                          Full
                        </span>
                      )}
                    </td>
                    {/* Expires */}
                    <td className="px-4 py-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {c.expiresAt ? (
                        <span style={{ color: expired ? "#e53935" : "#6B6560" }}>
                          {c.expiresAt.toLocaleDateString()}
                          {expired && (
                            <span
                              className="ml-1.5 text-xs px-1.5 py-0.5"
                              style={{ backgroundColor: "#e53935", color: "#fff", borderRadius: 2 }}
                            >
                              Expired
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#6B6560" }}>No expiry</span>
                      )}
                    </td>
                    {/* Active */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        disabled={togglingId === c.id}
                        title={c.active ? "Deactivate" : "Activate"}
                        className="text-xs tracking-[0.08em] uppercase font-semibold px-2.5 py-1 disabled:opacity-50"
                        style={{
                          backgroundColor: c.active ? "rgba(34,197,94,0.12)" : "rgba(107,101,96,0.1)",
                          color: c.active ? "#16a34a" : "#6B6560",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {togglingId === c.id ? "…" : c.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          title="Edit"
                          className="w-7 h-7 flex items-center justify-center hover:opacity-60"
                        >
                          <Pencil size={14} style={{ color: "#6B6560" }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
                          title="Delete"
                          className="w-7 h-7 flex items-center justify-center hover:opacity-60"
                        >
                          <Trash2 size={14} style={{ color: "#e53935" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in panel */}
      {panelOpen && (
        <CouponPanel
          coupon={editing}
          onClose={closePanel}
          onSaved={load}
          adminUser={user ? { id: user.id, email: user.email ?? null } : null}
        />
      )}

      {/* Delete dialog */}
      {deleting && (
        <DeleteDialog
          coupon={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          deleting={deleteLoading}
        />
      )}
    </div>
  );
}
