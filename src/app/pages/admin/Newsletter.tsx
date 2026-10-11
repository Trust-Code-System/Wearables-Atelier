import { useEffect, useState, useMemo } from "react";
import { Download, Trash2, Search, Send, X, CheckCircle2, AlertCircle } from "lucide-react";
import { getSubscribers, removeSubscriber, type NewsletterSubscriber } from "../../lib/db";
import { sendBroadcast } from "../../lib/email";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function exportCSV(subscribers: NewsletterSubscriber[]) {
  const headers = ["Email", "Source", "Status", "Date Subscribed"];
  const rows = subscribers.map((s) => [
    s.email,
    s.source,
    s.status,
    formatDate(s.subscribedAt),
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    getSubscribers()
      .then(setSubscribers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = subscribers.filter((s) => s.status === "active");
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisMonth = active.filter((s) => s.subscribedAt >= thisMonthStart).length;
  const thisWeek = active.filter((s) => s.subscribedAt >= thisWeekStart).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscribers.filter((s) =>
      !q || s.email.toLowerCase().includes(q)
    );
  }, [subscribers, search]);

  const handleRemove = async (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    try {
      await removeSubscriber(id);
      setSubscribers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "unsubscribed" as const } : s))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setConfirmId(null);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    const recipients = active.map((s) => s.email);
    if (recipients.length === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = await sendBroadcast({ subject: subject.trim(), body: body.trim(), recipients });
      setSendResult(result);
      if (result.failed === 0) {
        setSubject("");
        setBody("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Active", value: active.length },
          { label: "This Month", value: thisMonth },
          { label: "This Week", value: thisWeek },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(13,13,13,0.08)",
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: "#6B6560" }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: "#0D0D0D" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 border"
          style={{ borderColor: "rgba(13,13,13,0.2)", backgroundColor: "#ffffff" }}
        >
          <Search size={15} style={{ color: "#9B9590", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}
          />
        </div>
        <button
          onClick={() => { setComposeOpen(true); setSendResult(null); }}
          className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#C9A84C", color: "#0D0D0D", fontWeight: 600 }}
        >
          <Send size={14} />
          Send Newsletter
        </button>
        <button
          onClick={() => exportCSV(active)}
          className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#0D0D0D", color: "#C9A84C", fontWeight: 600 }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Compose Panel */}
      {composeOpen && (
        <div
          className="mb-6 p-5"
          style={{ backgroundColor: "#ffffff", border: "1px solid rgba(13,13,13,0.1)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>
                Compose Newsletter
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#6B6560" }}>
                Sending to <strong>{active.length}</strong> active subscriber{active.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button type="button" aria-label="Close compose" onClick={() => { setComposeOpen(false); setSendResult(null); }}>
              <X size={16} style={{ color: "#6B6560" }} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#6B6560" }}>
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New Collection Drop — Summer 2026"
                className="w-full px-3 py-2 text-sm border outline-none"
                style={{
                  borderColor: "rgba(13,13,13,0.2)",
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#0D0D0D",
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#6B6560" }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your newsletter message here..."
                rows={7}
                className="w-full px-3 py-2 text-sm border outline-none resize-y"
                style={{
                  borderColor: "rgba(13,13,13,0.2)",
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#0D0D0D",
                  lineHeight: "1.6",
                }}
              />
            </div>

            {sendResult && (
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm"
                style={{
                  backgroundColor: sendResult.failed === 0 ? "rgba(34,197,94,0.08)" : "rgba(229,57,53,0.08)",
                  color: sendResult.failed === 0 ? "#15803d" : "#c62828",
                }}
              >
                {sendResult.failed === 0
                  ? <><CheckCircle2 size={15} /> Simulated delivery to {sendResult.sent} subscriber{sendResult.sent !== 1 ? "s" : ""} in this browser. No emails sent.</>
                  : <><AlertCircle size={15} /> {sendResult.sent} sent, {sendResult.failed} failed. Check console for details.</>
                }
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setComposeOpen(false); setSendResult(null); }}
                className="px-4 py-2 text-xs uppercase tracking-wider"
                style={{ backgroundColor: "rgba(13,13,13,0.06)", color: "#0D0D0D" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim() || active.length === 0}
                className="flex items-center gap-2 px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: "#C9A84C", color: "#0D0D0D" }}
              >
                <Send size={13} />
                {sending ? `Sending…` : `Send to ${active.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

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
            {search ? "No results matching your search" : "No subscribers yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(13,13,13,0.08)",
                    backgroundColor: "rgba(13,13,13,0.02)",
                  }}
                >
                  {["Email", "Source", "Date", "Status", "Actions"].map((h) => (
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
                {filtered.map((sub) => (
                  <tr
                    key={sub.id}
                    style={{ borderBottom: "1px solid rgba(13,13,13,0.04)" }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "#0D0D0D" }}>
                      {sub.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide capitalize"
                        style={{
                          backgroundColor:
                            sub.source === "popup"
                              ? "rgba(99,102,241,0.1)"
                              : "rgba(34,197,94,0.1)",
                          color: sub.source === "popup" ? "#4338ca" : "#15803d",
                        }}
                      >
                        {sub.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B6560" }}>
                      {formatDate(sub.subscribedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2.5 py-1 text-[11px] font-semibold capitalize"
                        style={{
                          backgroundColor:
                            sub.status === "active"
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(107,114,128,0.12)",
                          color: sub.status === "active" ? "#15803d" : "#374151",
                        }}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.status === "active" && (
                        <>
                          {confirmId === sub.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: "#6B6560" }}>
                                Unsubscribe?
                              </span>
                              <button
                                onClick={() => handleRemove(sub.id)}
                                disabled={removingIds.has(sub.id)}
                                className="text-xs px-2 py-1 font-semibold transition-opacity hover:opacity-80"
                                style={{ backgroundColor: "#e53935", color: "#fff" }}
                              >
                                {removingIds.has(sub.id) ? "..." : "Yes"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-xs px-2 py-1 font-semibold"
                                style={{
                                  backgroundColor: "rgba(13,13,13,0.08)",
                                  color: "#0D0D0D",
                                }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(sub.id)}
                              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                              style={{ color: "#e53935" }}
                            >
                              <Trash2 size={13} />
                              Remove
                            </button>
                          )}
                        </>
                      )}
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
