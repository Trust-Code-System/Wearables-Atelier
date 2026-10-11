import { useState, useMemo, useEffect, useRef } from "react";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WhatsAppFAB } from "../components/WhatsAppFAB";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { SlidersHorizontal, ChevronDown, X, Check, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getProducts, type Product } from "../lib/db";
import { getCollectionLabelMap } from "../lib/siteSettings";

type ShopProduct = {
  id: string; slug: string; name: string; category: string;
  price: number; salePrice?: number; badge?: string | null; badgeColor?: string; img: string; sizes?: string[];
};

function toShopProduct(p: Product): ShopProduct {
  return { id: p.id, slug: p.slug, name: p.name, category: p.category, price: p.price, salePrice: p.salePrice, badge: p.badge, badgeColor: p.badgeColor, img: p.images[0] ?? "", sizes: p.sizes };
}

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  "new-in": "New In",
  "ready-to-wear": "Ready to Wear",
  jewellery: "Jewellery",
  fabrics: "Fabrics",
  turbans: "Turbans",
  wholesale: "Wholesale",
  sale: "Sale",
  ashabi: "Ashabi",
  exclusive: "Exclusive",
  "limited-edition": "Limited Edition",
};

const BADGES = ["New In", "Exclusive", "Limited Edition", "Sale"];
const MAX_PRICE = 150000;

const productSizes: Record<string, string[]> = {
  "embellished-lace-boubou": ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
  "aso-oke-occasion-gown": ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
  "luxury-kaftan-set": ["S", "M", "L", "XL", "Custom"],
  "woven-turban-set": ["One Size"],
  "gold-statement-necklace": ["One Size"],
  "ashabi-signature-dress": ["XS", "S", "M", "L", "XL", "Custom"],
  "damask-iro-buba-set": ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
  "kente-fabric-yard": ["1 yard", "2 yards", "3 yards", "5 yards"],
  "velvet-evening-kaftan": ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
  "bridal-aso-oke": ["Custom Only"],
};

type QuickViewProduct = ShopProduct;

function QuickViewModal({ p, onClose, categoryLabels }: { p: QuickViewProduct; onClose: () => void; categoryLabels: Record<string, string> }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(p.slug);
  const sizes = p.sizes ?? productSizes[p.slug] ?? ["XS", "S", "M", "L", "XL", "Custom"];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleAdd() {
    if (!selectedSize) return;
    addItem({ id: p.slug, slug: p.slug, name: p.name, category: p.category, size: selectedSize, price: p.price, salePrice: p.salePrice, img: p.img });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const displayPrice = p.salePrice ?? p.price;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: "rgba(13,13,13,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl flex flex-col sm:flex-row"
        style={{ backgroundColor: "#F8F5F0", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close quick view"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-60"
          style={{ color: "#6B6560" }}
        >
          <X size={18} />
        </button>

        {/* Image */}
        <div className="w-full sm:w-56 flex-shrink-0" style={{ aspectRatio: "3/4", maxHeight: "40vh" }}>
          <img
            src={p.img}
            alt={p.name}
            className="w-full h-full object-cover"
            style={{ maxHeight: "40vh" }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {p.badge && (
            <span
              className="self-start text-[9px] tracking-[0.18em] uppercase px-2.5 py-1 mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: p.badgeColor, color: p.badgeColor === "#C9A84C" ? "#0D0D0D" : "#fff" }}
            >
              {p.badge}
            </span>
          )}

          <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>
            {categoryLabels[p.category] ?? p.category}
          </p>
          <h2 className="mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "26px", color: "#0D0D0D", lineHeight: 1.2 }}>
            {p.name}
          </h2>

          <div className="flex items-center gap-3 mb-5">
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "18px", color: p.salePrice ? "#e53935" : "#0D0D0D" }}>
              ₦{displayPrice.toLocaleString()}
            </span>
            {p.salePrice && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#6B6560", textDecoration: "line-through" }}>
                ₦{p.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Size picker */}
          <p className="text-xs tracking-[0.15em] uppercase mb-2" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Select Size</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className="px-3 py-2 border text-xs tracking-[0.1em] transition-all"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  borderColor: selectedSize === size ? "#0D0D0D" : "rgba(13,13,13,0.2)",
                  backgroundColor: selectedSize === size ? "#0D0D0D" : "transparent",
                  color: selectedSize === size ? "#C9A84C" : "#0D0D0D",
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedSize}
              className="flex items-center justify-center gap-2 py-3.5 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-40"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: added ? "#1a6e2e" : "#0D0D0D", color: "#C9A84C" }}
            >
              <ShoppingBag size={14} />
              {added ? "Added to Bag ✓" : "Add to Bag"}
            </button>
            <div className="flex gap-2">
              <Link
                to={`/product/${p.slug}`}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-xs tracking-[0.15em] uppercase border transition-all hover:border-[#0D0D0D]"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, borderColor: "rgba(13,13,13,0.25)", color: "#0D0D0D" }}
              >
                Full Details <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                onClick={() => toggle({ slug: p.slug, name: p.name, category: p.category, price: p.price, salePrice: p.salePrice, img: p.img })}
                aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className="w-12 flex items-center justify-center border transition-all"
                style={{ borderColor: "rgba(13,13,13,0.25)", color: wishlisted ? "#e53935" : "#6B6560" }}
              >
                <Heart size={16} fill={wishlisted ? "#e53935" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p, onQuickView, categoryLabels }: { p: ShopProduct; onQuickView: (p: QuickViewProduct) => void; categoryLabels: Record<string, string> }) {
  const [hovered, setHovered] = useState(false);
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(p.slug);
  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {p.badge && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1" style={{ backgroundColor: p.badgeColor }}>
            <span className="text-[9px] tracking-[0.18em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: p.badgeColor === "#C9A84C" ? "#0D0D0D" : "#fff" }}>
              {p.badge}
            </span>
          </div>
        )}
        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => toggle({ slug: p.slug, name: p.name, category: p.category, price: p.price, salePrice: p.salePrice, img: p.img })}
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute top-2.5 right-2.5 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
          style={{ backgroundColor: "rgba(248,245,240,0.9)", color: wishlisted ? "#e53935" : "#6B6560", opacity: hovered || wishlisted ? 1 : 0 }}
        >
          <Heart size={14} fill={wishlisted ? "#e53935" : "none"} />
        </button>
        <Link to={`/product/${p.slug}`} className="block w-full h-full">
          <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-600" style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }} />
        </Link>
        {/* Quick Shop bar */}
        <button
          type="button"
          onClick={() => onQuickView(p)}
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-3.5 transition-all duration-300"
          style={{ backgroundColor: "#0D0D0D", transform: hovered ? "translateY(0)" : "translateY(100%)" }}
        >
          <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#C9A84C" }}>Quick Shop</span>
        </button>
      </div>
      <Link to={`/product/${p.slug}`} className="block pt-3">
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>{categoryLabels[p.category] ?? p.category}</p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400, fontSize: "17px", color: "#0D0D0D" }}>{p.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", color: p.salePrice ? "#e53935" : "#0D0D0D" }}>₦{(p.salePrice ?? p.price).toLocaleString()}</span>
          {p.salePrice && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#6B6560", textDecoration: "line-through" }}>₦{p.price.toLocaleString()}</span>}
        </div>
      </Link>
    </div>
  );
}

export default function Shop() {
  const { category } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const { settings } = useSiteSettings();
  const categoryLabels = {
    ...DEFAULT_CATEGORY_LABELS,
    ...getCollectionLabelMap(settings.collections),
  };
  const visibleCollections = settings.collections.filter(
    (collection) =>
      collection.showInNavbar || collection.showInFooter || collection.showOnHomepage
  );
  usePageTitle(category ? `${categoryLabels[category] ?? category} | Wearables Atelier` : "Shop | Wearables Atelier");
  const searchQuery = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const [allProducts, setAllProducts] = useState<ShopProduct[]>([]);
  const [sort, setSort] = useState("Newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const inStock = data.filter((p) => p.inStock !== false).map(toShopProduct);
        setAllProducts(inStock);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (maxPrice < MAX_PRICE) activeFilters.push({ label: `Under ₦${maxPrice.toLocaleString()}`, clear: () => setMaxPrice(MAX_PRICE) });
  if (selectedBadge) activeFilters.push({ label: selectedBadge, clear: () => setSelectedBadge(null) });

  const filtered = useMemo(() => {
    let list = category && category !== "all"
      ? allProducts.filter((p) => {
          if (category === "sale") return !!p.salePrice;
          if (category === "new-in") return p.badge === "New In";
          return p.category === category;
        })
      : [...allProducts];

    if (searchQuery) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery) ||
        (p.badge ?? "").toLowerCase().includes(searchQuery)
      );
    }

    if (maxPrice < MAX_PRICE) list = list.filter((p) => (p.salePrice ?? p.price) <= maxPrice);
    if (selectedBadge) list = list.filter((p) => p.badge === selectedBadge);

    switch (sort) {
      case "Price: Low to High": list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)); break;
      case "Price: High to Low": list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)); break;
      case "Name A–Z": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break; // Newest = original order
    }

    return list;
  }, [allProducts, category, searchQuery, maxPrice, selectedBadge, sort]);

  useEffect(() => { setVisibleCount(8); }, [filtered]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!sortRef.current) return;
      if (!sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const title = searchQuery
    ? `Results for "${searchParams.get("q")}"`
    : category ? (categoryLabels[category] ?? category) : "All Products";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="pt-24 pb-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">

          {/* Header */}
          <div className="text-center py-12 border-b mb-10" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
            <p className="text-xs tracking-[0.3em] mb-2 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>Shop</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(40px, 5vw, 64px)", color: "#0D0D0D", lineHeight: 1 }}>{title}</h1>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[{ slug: "", label: "All" }, ...visibleCollections.map((collection) => ({ slug: collection.slug, label: collection.label }))].map(({ slug, label }) => (
              <Link
                key={slug}
                to={slug ? `/shop/${slug}` : "/shop"}
                className="px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-all"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  borderColor: (category ?? "") === slug ? "#0D0D0D" : "rgba(13,13,13,0.2)",
                  backgroundColor: (category ?? "") === slug ? "#0D0D0D" : "transparent",
                  color: (category ?? "") === slug ? "#C9A84C" : "#0D0D0D",
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-1.5 sm:gap-2 border px-2.5 sm:px-3 py-2 text-xs tracking-[0.1em] uppercase transition-colors"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  borderColor: filtersOpen ? "#0D0D0D" : "rgba(13,13,13,0.2)",
                  backgroundColor: filtersOpen ? "#0D0D0D" : "transparent",
                  color: filtersOpen ? "#C9A84C" : "#0D0D0D",
                }}
              >
                <SlidersHorizontal size={14} />
                Filter{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
              </button>
              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-1.5 sm:gap-2 border px-2.5 sm:px-3 py-2 text-xs tracking-[0.1em] uppercase"
                  style={{
                    borderColor: "rgba(13,13,13,0.2)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    color: "#0D0D0D",
                    justifyContent: "space-between",
                    backgroundColor: "#F8F5F0",
                  }}
                >
                  <span className="hidden sm:inline">{sort}</span>
                  <span className="sm:hidden truncate max-w-[80px]">{sort.split(":")[0]}</span>
                  <ChevronDown
                    size={12}
                    color="#0D0D0D"
                    style={{ transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
                  />
                </button>
                {sortOpen && (
                  <div
                    className="absolute right-0 mt-1 border z-30"
                    style={{ minWidth: "190px",
                      borderColor: "rgba(13,13,13,0.2)",
                      backgroundColor: "#F8F5F0",
                      boxShadow: "0 12px 30px rgba(13,13,13,0.12)",
                    }}
                  >
                    {["Newest", "Price: Low to High", "Price: High to Low", "Name A–Z"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => { setSort(o); setSortOpen(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs tracking-[0.1em] uppercase transition-colors"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 500,
                          color: sort === o ? "#C9A84C" : "#0D0D0D",
                          backgroundColor: sort === o ? "#0D0D0D" : "transparent",
                        }}
                      >
                        {o}
                        {sort === o && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div className="mb-6 p-6 border" style={{ backgroundColor: "#EDE8DF", borderColor: "rgba(13,13,13,0.12)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Price range */}
                <div>
                  <p className="text-xs tracking-[0.15em] uppercase mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>
                    Max Price — ₦{maxPrice.toLocaleString()}
                  </p>
                  <input
                    type="range"
                    min={10000}
                    max={MAX_PRICE}
                    step={5000}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    aria-label={`Maximum price: ₦${maxPrice.toLocaleString()}`}
                    className="w-full accent-[#C9A84C]"
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                    <span>₦10,000</span><span>₦{MAX_PRICE.toLocaleString()}</span>
                  </div>
                </div>
                {/* Badge filter */}
                <div>
                  <p className="text-xs tracking-[0.15em] uppercase mb-4" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Collection</p>
                  <div className="flex flex-wrap gap-2">
                    {BADGES.map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => setSelectedBadge(selectedBadge === b ? null : b)}
                        className="px-3 py-1.5 text-xs tracking-[0.1em] uppercase border transition-all"
                        style={{
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                          borderColor: selectedBadge === b ? "#0D0D0D" : "rgba(13,13,13,0.2)",
                          backgroundColor: selectedBadge === b ? "#0D0D0D" : "transparent",
                          color: selectedBadge === b ? "#C9A84C" : "#0D0D0D",
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setMaxPrice(MAX_PRICE); setSelectedBadge(null); }}
                  className="mt-4 text-xs tracking-[0.1em] uppercase underline"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {activeFilters.map((f) => (
                <button
                  type="button"
                  key={f.label}
                  onClick={f.clear}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-[0.1em] uppercase border transition-all hover:border-red-400 hover:text-red-500"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderColor: "#0D0D0D", color: "#0D0D0D" }}
                >
                  {f.label} <X size={11} />
                </button>
              ))}
            </div>
          )}

          {/* Grid or empty state */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
                {filtered.slice(0, visibleCount).map((p) => <ProductCard key={p.id} p={p} onQuickView={setQuickViewProduct} categoryLabels={categoryLabels} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="text-center mt-14">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 8)}
                    className="px-12 py-4 border text-xs tracking-[0.2em] uppercase transition-all hover:border-[#0D0D0D] hover:opacity-70"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderColor: "rgba(13,13,13,0.3)", color: "#0D0D0D" }}
                  >
                    LOAD MORE — {filtered.length - visibleCount} remaining
                  </button>
                </div>
              )}
            </>
          ) : searchQuery ? (
            <div className="text-center py-24">
              <svg className="mx-auto mb-6" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(13,13,13,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "28px", color: "#0D0D0D" }}>
                No results for <em>"{searchParams.get("q")}"</em>
              </p>
              <p className="mt-3 mb-8 text-sm max-w-sm mx-auto" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560", lineHeight: 1.8 }}>
                We couldn't find anything matching that search. Try a different term or explore our collections.
              </p>
              <Link
                to="/shop"
                className="px-10 py-3.5 text-xs tracking-[0.2em] uppercase inline-block"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#0D0D0D", color: "#C9A84C" }}
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="text-center py-24">
              <svg className="mx-auto mb-6" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(13,13,13,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "28px", color: "#0D0D0D" }}>No products match these filters</p>
              <p className="mt-3 mb-8 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                Try adjusting your price range or collection filter.
              </p>
              <button
                type="button"
                onClick={() => { setMaxPrice(MAX_PRICE); setSelectedBadge(null); }}
                className="px-10 py-3.5 text-xs tracking-[0.2em] uppercase"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#0D0D0D", color: "#C9A84C" }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
      {quickViewProduct && (
        <QuickViewModal p={quickViewProduct} onClose={() => setQuickViewProduct(null)} categoryLabels={categoryLabels} />
      )}
    </div>
  );
}
