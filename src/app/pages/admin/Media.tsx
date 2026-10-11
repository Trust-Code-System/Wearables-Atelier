import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { uploadImageFile } from "../../lib/uploads";

const STORAGE_KEY = "wba_demo_media_library";

function loadUrls(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(Array.from({ length: 6 }, (_, i) => `/images/collection/look-${String(i + 1).padStart(2, "0")}.png`)));
  } catch {
    return [];
  }
}

function saveUrls(urls: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export default function Media() {
  const [urls, setUrls] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setUrls(loadUrls());
  }, []);

  function addUrl(url: string) {
    if (!url || urls.includes(url)) {
      return;
    }

    const next = [url, ...urls];
    setUrls(next);
    saveUrls(next);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    addUrl(trimmed);
    setInput("");
    setError("");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedUrl = await uploadImageFile(file, "media-library");
      addUrl(uploadedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDelete(url: string) {
    const next = urls.filter((u) => u !== url);
    setUrls(next);
    saveUrls(next);
    setBroken((prev) => {
      const nextBroken = new Set(prev);
      nextBroken.delete(url);
      return nextBroken;
    });
  }

  function handleCopy(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  function handleImgError(url: string) {
    setBroken((prev) => new Set(prev).add(url));
  }

  const inputStyle = {
    borderColor: "rgba(13,13,13,0.2)" as const,
    color: "#0D0D0D" as const,
    fontFamily: "'DM Sans', sans-serif" as const,
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
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
          Media Library
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
          Save demo images in this browser and copy their local data URL anywhere you need it in admin.
        </p>
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
        <ImageIcon size={13} className="mt-0.5 shrink-0" style={{ color: "#C9A84C" }} />
        <span>
          Upload files directly here. Each image is stored once and the saved URL can be copied into
          products, collections, and other admin forms.
        </span>
      </div>

      <div className="grid gap-4 mb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div
          className="border p-5"
          style={{ borderColor: "rgba(13,13,13,0.1)", backgroundColor: "#fff" }}
        >
          <p
            className="text-xs tracking-[0.12em] uppercase font-semibold"
            style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
          >
            Upload Image
          </p>
          <p className="mt-2 text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Choose a file from your device. We save a browser-only demo image and add it here
            automatically.
          </p>
          <label
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold cursor-pointer"
            style={{
              backgroundColor: "#C9A84C",
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Uploading..." : "Select File"}
          </label>
        </div>

        <form
          onSubmit={handleAdd}
          className="border p-5 flex flex-col gap-3"
          style={{ borderColor: "rgba(13,13,13,0.1)", backgroundColor: "#fff" }}
        >
          <p
            className="text-xs tracking-[0.12em] uppercase font-semibold"
            style={{ color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
          >
            External URL
          </p>
          <p className="text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Optional fallback if you already host an image elsewhere.
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white"
              style={inputStyle}
              required
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-semibold shrink-0"
              style={{
                backgroundColor: "#C9A84C",
                color: "#0D0D0D",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Plus size={14} />
              Add URL
            </button>
          </div>
        </form>
      </div>

      {error && (
        <p className="mb-6 text-xs" style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      )}

      {urls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <ImageIcon size={36} style={{ color: "rgba(13,13,13,0.15)" }} />
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "20px",
              fontWeight: 300,
              color: "#6B6560",
            }}
          >
            No images yet
          </p>
          <p className="text-xs" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            Upload an image above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {urls.map((url) => {
            const isBroken = broken.has(url);
            const isCopied = copied === url;

            return (
              <div
                key={url}
                className="border flex flex-col overflow-hidden"
                style={{ borderColor: "rgba(13,13,13,0.1)", backgroundColor: "#fff" }}
              >
                <div
                  className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: "#EDE8DF" }}
                >
                  {isBroken ? (
                    <div className="flex flex-col items-center gap-1">
                      <X size={20} style={{ color: "rgba(13,13,13,0.25)" }} />
                      <span className="text-xs" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
                        Broken
                      </span>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => handleImgError(url)}
                    />
                  )}
                </div>

                <div className="p-2 flex flex-col gap-2">
                  <p
                    className="text-xs truncate"
                    title={url}
                    style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {url}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(url)}
                      title="Copy URL"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs tracking-[0.08em] uppercase font-semibold border hover:opacity-70"
                      style={{
                        borderColor: "rgba(13,13,13,0.15)",
                        color: isCopied ? "#16a34a" : "#6B6560",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}
                      {isCopied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(url)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center border hover:opacity-70 shrink-0"
                      style={{ borderColor: "rgba(13,13,13,0.15)" }}
                    >
                      <Trash2 size={12} style={{ color: "#e53935" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
