import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { saveSiteSettings } from "../../lib/db";
import {
  getCollectionHref,
  type SiteCollection,
} from "../../lib/siteSettings";
import { uploadImageFile } from "../../lib/uploads";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyForm: SiteCollection = {
  slug: "",
  label: "",
  image: "",
  showInNavbar: true,
  showInFooter: true,
  showOnHomepage: false,
  navAccent: "default",
  homeLayout: "standard",
  homeBadge: "",
};

type PanelProps = {
  form: SiteCollection;
  editingSlug: string | null;
  saving: boolean;
  error: string;
  onChange: <K extends keyof SiteCollection>(key: K, value: SiteCollection[K]) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

function CollectionPanel({
  form,
  editingSlug,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: PanelProps) {
  const isEdit = !!editingSlug;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const inputCls =
    "w-full px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white";
  const inputStyle = {
    borderColor: "rgba(13,13,13,0.2)",
    color: "#0D0D0D",
    fontFamily: "'DM Sans', sans-serif",
  };
  const labelCls = "text-xs tracking-[0.12em] uppercase block mb-1.5 font-semibold";
  const labelStyle = { color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" };
  const previewImage = form.image.trim();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const folderSlug = slugify(form.slug || form.label || "collection");
      const nextImage = await uploadImageFile(file, `collections/${folderSlug || "draft"}`);
      onChange("image", nextImage);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl h-full overflow-y-auto"
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
            {isEdit ? "Edit Collection" : "Add Collection"}
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

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>
                Label
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                value={form.label}
                onChange={(e) => {
                  onChange("label", e.target.value);
                  if (!isEdit) {
                    onChange("slug", slugify(e.target.value));
                  }
                }}
                placeholder="New In"
                required
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>
                Shop Slug
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                value={form.slug}
                onChange={(e) => onChange("slug", slugify(e.target.value))}
                placeholder="new-in"
                required
              />
              <p className="mt-1 text-xs" style={{ color: "#6B6560" }}>
                Public page: {getCollectionHref(form.slug || "...")}
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              Image
            </label>
            <div
              className="border p-4"
              style={{ borderColor: "rgba(13,13,13,0.12)", backgroundColor: "#fff" }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className="w-full h-48 overflow-hidden border sm:w-32 sm:h-36"
                  style={{ borderColor: "rgba(13,13,13,0.12)", backgroundColor: "#EDE8DF" }}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={form.label || "Collection preview"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <ImageIcon size={18} style={{ color: "#6B6560" }} />
                      <span
                        className="text-xs"
                        style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        No image yet
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold cursor-pointer"
                    style={{
                      backgroundColor: "#C9A84C",
                      color: "#0D0D0D",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: saving || uploading ? 0.7 : 1,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={saving || uploading}
                      className="hidden"
                    />
                    {uploading && <Loader2 size={14} className="animate-spin" />}
                    {uploading ? "Uploading..." : previewImage ? "Replace Image" : "Upload Image"}
                  </label>

                  <p
                    className="mt-3 text-xs"
                    style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Select an image file to save a demo preview in this browser.
                  </p>

                  {previewImage && (
                    <p
                      className="mt-3 text-xs break-all"
                      style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Stored image: {previewImage}
                    </p>
                  )}

                  {uploadError && (
                    <p
                      className="mt-3 text-xs"
                      style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>
                Navbar Accent
              </label>
              <select
                title="Navbar accent"
                className={inputCls}
                style={inputStyle}
                value={form.navAccent}
                onChange={(e) =>
                  onChange("navAccent", e.target.value as SiteCollection["navAccent"])
                }
              >
                <option value="default">Default</option>
                <option value="sale">Sale Highlight</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>
                Home Layout
              </label>
              <select
                title="Home layout"
                className={inputCls}
                style={inputStyle}
                value={form.homeLayout}
                onChange={(e) =>
                  onChange("homeLayout", e.target.value as SiteCollection["homeLayout"])
                }
              >
                <option value="standard">Standard</option>
                <option value="wide">Wide</option>
                <option value="hero">Hero</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>
              Home Badge
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={form.homeBadge ?? ""}
              onChange={(e) => onChange("homeBadge", e.target.value)}
              placeholder="Optional sale tag on home grid"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label
              className="flex items-center gap-3 border px-4 py-3 cursor-pointer"
              style={{ borderColor: "rgba(13,13,13,0.12)", backgroundColor: "#fff" }}
            >
              <input
                type="checkbox"
                checked={form.showInNavbar}
                onChange={(e) => onChange("showInNavbar", e.target.checked)}
                className="accent-[#C9A84C]"
              />
              <span className="text-sm" style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}>
                Show in Navbar
              </span>
            </label>
            <label
              className="flex items-center gap-3 border px-4 py-3 cursor-pointer"
              style={{ borderColor: "rgba(13,13,13,0.12)", backgroundColor: "#fff" }}
            >
              <input
                type="checkbox"
                checked={form.showInFooter}
                onChange={(e) => onChange("showInFooter", e.target.checked)}
                className="accent-[#C9A84C]"
              />
              <span className="text-sm" style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}>
                Show in Footer
              </span>
            </label>
            <label
              className="flex items-center gap-3 border px-4 py-3 cursor-pointer"
              style={{ borderColor: "rgba(13,13,13,0.12)", backgroundColor: "#fff" }}
            >
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                onChange={(e) => onChange("showOnHomepage", e.target.checked)}
                className="accent-[#C9A84C]"
              />
              <span className="text-sm" style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}>
                Show on Homepage
              </span>
            </label>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}>
              {error}
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
              {saving ? "Saving..." : isEdit ? "Save Collection" : "Create Collection"}
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

export default function Collections() {
  const { settings, refresh } = useSiteSettings();
  const [collections, setCollections] = useState<SiteCollection[]>(settings.collections);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<SiteCollection>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCollections(settings.collections);
  }, [settings.collections]);

  function updateForm<K extends keyof SiteCollection>(key: K, value: SiteCollection[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setEditingSlug(null);
    setForm(emptyForm);
    setError("");
    setPanelOpen(true);
  }

  function openEdit(collection: SiteCollection) {
    setEditingSlug(collection.slug);
    setForm({ ...collection, homeBadge: collection.homeBadge ?? "" });
    setError("");
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingSlug(null);
    setError("");
  }

  async function persist(nextCollections: SiteCollection[]) {
    setSaving(true);
    setError("");
    try {
      await saveSiteSettings({ collections: nextCollections });
      await refresh();
      setCollections(nextCollections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save collections");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalized = {
      ...form,
      slug: slugify(form.slug),
      label: form.label.trim(),
      image: form.image.trim(),
      homeBadge: form.homeBadge?.trim() || undefined,
    };

    if (!normalized.label || !normalized.slug || !normalized.image) {
      setError("Label, slug, and image are required.");
      return;
    }

    const duplicate = collections.some(
      (collection) =>
        collection.slug === normalized.slug && collection.slug !== editingSlug
    );

    if (duplicate) {
      setError("That slug already exists. Choose a different one.");
      return;
    }

    const nextCollections = editingSlug
      ? collections.map((collection) =>
          collection.slug === editingSlug ? normalized : collection
        )
      : [...collections, normalized];

    await persist(nextCollections);
    closePanel();
  }

  async function handleDelete(slug: string) {
    if (!window.confirm("Delete this collection from the storefront settings?")) {
      return;
    }

    const nextCollections = collections.filter((collection) => collection.slug !== slug);
    await persist(nextCollections);
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= collections.length) return;

    const nextCollections = [...collections];
    const [moved] = nextCollections.splice(index, 1);
    nextCollections.splice(nextIndex, 0, moved);
    setCollections(nextCollections);

    try {
      await persist(nextCollections);
    } catch {
      setCollections(settings.collections);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
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
            Collections
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Control which collections appear on the home page, navbar, footer, and shop links.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold border"
            style={{
              borderColor: "rgba(13,13,13,0.18)",
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <ExternalLink size={13} />
            Preview Home
          </a>
          <a
            href="/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold border"
            style={{
              borderColor: "rgba(13,13,13,0.18)",
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <ExternalLink size={13} />
            Preview Shop
          </a>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold"
            style={{
              backgroundColor: "#C9A84C",
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Plus size={14} />
            Add Collection
          </button>
        </div>
      </div>

      <div
        className="flex items-start gap-2.5 px-4 py-3 mb-6 text-xs border-l-2"
        style={{
          borderColor: "#C9A84C",
          backgroundColor: "rgba(201,168,76,0.08)",
          color: "#6B6560",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <LayoutTemplate size={13} className="mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
        <span>
          Reorder items here to change the navbar, shop pills, footer explore links, and home
          collection grid sequence.
        </span>
      </div>

      <div
        className="border overflow-x-auto"
        style={{ borderColor: "rgba(13,13,13,0.1)", backgroundColor: "#fff" }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(13,13,13,0.1)" }}>
              {["Order", "Collection", "Placements", "Preview", ""].map((heading) => (
                <th
                  key={heading}
                  className="text-left px-4 py-3 text-xs tracking-[0.1em] uppercase font-semibold"
                  style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collections.map((collection, index) => (
              <tr
                key={collection.slug}
                style={{
                  borderBottom:
                    index < collections.length - 1 ? "1px solid rgba(13,13,13,0.07)" : "none",
                }}
              >
                <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={saving || index === 0}
                      className="w-7 h-7 flex items-center justify-center border disabled:opacity-35"
                      style={{ borderColor: "rgba(13,13,13,0.14)", color: "#6B6560" }}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={saving || index === collections.length - 1}
                      className="w-7 h-7 flex items-center justify-center border disabled:opacity-35"
                      style={{ borderColor: "rgba(13,13,13,0.14)", color: "#6B6560" }}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-20 overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: "#EDE8DF" }}
                    >
                      {collection.image ? (
                        <img
                          src={collection.image}
                          alt={collection.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={16} style={{ color: "#6B6560" }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}>
                        {collection.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
                        {getCollectionHref(collection.slug)}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className="text-[10px] uppercase tracking-[0.1em] px-2 py-1"
                          style={{
                            backgroundColor: collection.navAccent === "sale"
                              ? "rgba(229,57,53,0.1)"
                              : "rgba(201,168,76,0.12)",
                            color: collection.navAccent === "sale" ? "#e53935" : "#0D0D0D",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {collection.navAccent}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-[0.1em] px-2 py-1"
                          style={{
                            backgroundColor: "rgba(13,13,13,0.06)",
                            color: "#6B6560",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {collection.homeLayout}
                        </span>
                        {collection.homeBadge && (
                          <span
                            className="text-[10px] uppercase tracking-[0.1em] px-2 py-1"
                            style={{
                              backgroundColor: "rgba(229,57,53,0.1)",
                              color: "#e53935",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {collection.homeBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      collection.showInNavbar ? "Navbar" : null,
                      collection.showInFooter ? "Footer" : null,
                      collection.showOnHomepage ? "Homepage" : null,
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <span
                          key={item}
                          className="text-[10px] uppercase tracking-[0.1em] px-2.5 py-1"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.12)",
                            color: "#15803d",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <a
                    href={getCollectionHref(collection.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Open page
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(collection)}
                      title="Edit"
                      className="w-8 h-8 flex items-center justify-center border"
                      style={{ borderColor: "rgba(13,13,13,0.16)", color: "#0D0D0D" }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(collection.slug)}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center border"
                      style={{ borderColor: "rgba(13,13,13,0.16)", color: "#e53935" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!saving && error && !panelOpen && (
        <p className="mt-3 text-xs" style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      )}

      {panelOpen && (
        <CollectionPanel
          form={form}
          editingSlug={editingSlug}
          saving={saving}
          error={error}
          onChange={updateForm}
          onClose={closePanel}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
