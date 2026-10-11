import { useState, useEffect, useRef } from "react";
import NotFound from "./NotFound";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WhatsAppFAB } from "../components/WhatsAppFAB";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { ShoppingBag, MessageCircle, ChevronDown, Ruler, Heart, Share2, Check } from "lucide-react";
import { Link, useParams } from "react-router";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { getProduct, getProducts, type Product, getProductReviews, saveProductReview, type ProductReview } from "../lib/db";
import { buildWhatsAppHref } from "../lib/siteSettings";

const RECENTLY_VIEWED_KEY = "wba_demo_recently_viewed";
const MAX_RECENT = 6;

function saveRecentlyViewed(item: { slug: string; name: string; category: string; price: number; salePrice?: number; img: string }) {
  try {
    const existing: typeof item[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    const filtered = existing.filter((i) => i.slug !== item.slug);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([item, ...filtered].slice(0, MAX_RECENT)));
  } catch {}
}

function getRecentlyViewed(): { slug: string; name: string; category: string; price: number; salePrice?: number; img: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
  } catch { return []; }
}

const relatedPool = [
  { slug: "embellished-lace-boubou", name: "Embellished Lace Boubou", category: "Ready to Wear", price: 120000, badge: "New In", badgeColor: "#0D0D0D", img: "/images/collection/look-01.png" },
  { slug: "aso-oke-occasion-gown", name: "Aso Oke Occasion Gown", category: "Ready to Wear", price: 85000, badge: "Limited Edition", badgeColor: "#C9A84C", img: "/images/collection/look-02.png" },
  { slug: "luxury-kaftan-set", name: "Luxury Kaftan Set", category: "Ashabi", price: 135000, salePrice: 81000, badge: "Sale", badgeColor: "#e53935", img: "/images/collection/look-03.png" },
  { slug: "woven-turban-set", name: "Woven Turban Set", category: "Turbans", price: 25000, badge: "New In", badgeColor: "#0D0D0D", img: "/images/collection/look-04.png" },
  { slug: "gold-statement-necklace", name: "Gold Statement Necklace", category: "Jewellery", price: 45000, badge: "Exclusive", badgeColor: "#C9A84C", img: "/images/collection/look-05.png" },
  { slug: "ashabi-signature-dress", name: "Ashabi Signature Dress", category: "Ashabi", price: 110000, badge: "Exclusive", badgeColor: "#C9A84C", img: "/images/collection/look-06.png" },
  { slug: "damask-iro-buba-set", name: "Damask Iro & Buba Set", category: "Ready to Wear", price: 95000, badge: "New In", badgeColor: "#0D0D0D", img: "/images/collection/look-07.png" },
  { slug: "velvet-evening-kaftan", name: "Velvet Evening Kaftan", category: "Ready to Wear", price: 105000, salePrice: 63000, badge: "Sale", badgeColor: "#e53935", img: "/images/collection/look-09.png" },
];

const productData: Record<string, {
  name: string; category: string; price: number; salePrice?: number; badge?: string;
  badgeColor?: string; description: string; sizes: string[];
  imgs: string[]; details: string[];
}> = {
  "embellished-lace-boubou": {
    name: "Embellished Lace Boubou",
    category: "Ready to Wear",
    price: 120000,
    badge: "New In",
    badgeColor: "#0D0D0D",
    description: "A statement piece crafted from premium Nigerian lace with hand-applied embellishments. This floor-length Boubou drapes beautifully and is perfect for Owambe celebrations, weddings, and high-society occasions.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
    details: ["100% premium lace", "Hand-applied embellishments", "Fully lined", "Dry clean only", "Ships within 5–7 business days"],
    imgs: [
      "/images/collection/look-01.png",
      "/images/collection/look-02.png",
      "/images/collection/look-03.png",
    ],
  },
  "aso-oke-occasion-gown": {
    name: "Aso Oke Occasion Gown",
    category: "Ready to Wear",
    price: 85000,
    badge: "Limited Edition",
    badgeColor: "#C9A84C",
    description: "Woven by master craftsmen in Iseyin, this hand-loomed Aso Oke gown is a celebration of Yoruba textile heritage. Each piece is unique — the subtle colour variations in the weave are a mark of authentic handcraft, not imperfection.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
    details: ["Authentic hand-loomed Aso Oke", "Sourced from master weavers in Iseyin", "Unlined for breathability", "Gentle hand wash or dry clean", "Limited stock — no reorders"],
    imgs: [
      "/images/collection/look-02.png",
      "/images/collection/look-01.png",
      "/images/collection/look-07.png",
    ],
  },
  "luxury-kaftan-set": {
    name: "Luxury Kaftan Set",
    category: "Ashabi",
    price: 135000,
    salePrice: 81000,
    badge: "Sale",
    badgeColor: "#e53935",
    description: "Designed by Ashabi herself, this stunning kaftan set features rich velvet fabric adorned with gold thread detailing. A masterpiece of Nigerian couture, crafted for the modern woman who honours tradition.",
    sizes: ["S", "M", "L", "XL", "Custom"],
    details: ["Premium velvet fabric", "Gold thread embroidery", "Matching headpiece included", "Dry clean only", "Custom sizing available"],
    imgs: [
      "/images/collection/look-03.png",
      "/images/collection/look-07.png",
    ],
  },
  "woven-turban-set": {
    name: "Woven Turban Set",
    category: "Turbans",
    price: 25000,
    badge: "New In",
    badgeColor: "#0D0D0D",
    description: "Elevate any outfit with this expertly pre-tied turban set. Crafted from lightweight Aso Oke fabric, it sits beautifully on the head with no pinning required. Arrives with a matching gele pin and wear guide.",
    sizes: ["One Size", "Custom"],
    details: ["Lightweight Aso Oke fabric", "Pre-tied — no styling required", "Includes matching gele pin", "Spot clean only", "Ships within 3–5 business days"],
    imgs: [
      "/images/collection/look-04.png",
      "/images/collection/look-01.png",
    ],
  },
  "gold-statement-necklace": {
    name: "Gold Statement Necklace",
    category: "Jewellery",
    price: 45000,
    badge: "Exclusive",
    badgeColor: "#C9A84C",
    description: "Handcrafted by Lagos artisans, this layered gold statement necklace draws on traditional Yoruba adornment. The interlocking beaded strands are finished with 18k gold-plated brass — bold enough to stand alone, elegant enough to layer.",
    sizes: ["One Size"],
    details: ["18k gold-plated brass", "Handcrafted in Lagos", "Adjustable clasp — fits all neck sizes", "Avoid water and perfume contact", "Presented in branded gift box"],
    imgs: [
      "/images/collection/look-05.png",
      "/images/collection/look-01.png",
    ],
  },
  "ashabi-signature-dress": {
    name: "Ashabi Signature Dress",
    category: "Ashabi",
    price: 110000,
    badge: "Exclusive",
    badgeColor: "#C9A84C",
    description: "The crown jewel of the Ashabi collection. This sculptural midi dress merges structured tailoring with flowing damask panels, creating a silhouette that commands attention at every entrance. Available exclusively through Wearables Atelier.",
    sizes: ["XS", "S", "M", "L", "XL", "Custom"],
    details: ["Premium imported damask", "Structured boning at the bodice", "Hand-finished seams", "Dry clean only", "Exclusive to Wearables Atelier — strictly limited"],
    imgs: [
      "/images/collection/look-06.png",
      "/images/collection/look-03.png",
      "/images/collection/look-07.png",
    ],
  },
  "damask-iro-buba-set": {
    name: "Damask Iro & Buba Set",
    category: "Ready to Wear",
    price: 95000,
    badge: "New In",
    badgeColor: "#0D0D0D",
    description: "The Iro & Buba is the cornerstone of Yoruba women's fashion, and this damask version is its most elevated expression. The set includes a fully lined buba top and a generous iro wrap skirt with enough fabric for a stylish sash.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
    details: ["Premium damask fabric", "Includes buba top + iro wrap skirt + gele", "Fully lined buba", "Dry clean only", "Custom sizing — contact us for measurements"],
    imgs: [
      "/images/collection/look-07.png",
      "/images/collection/look-02.png",
      "/images/collection/look-01.png",
    ],
  },
  "kente-fabric-yard": {
    name: "Kente Fabric (per yard)",
    category: "Fabrics",
    price: 18000,
    description: "Authentic hand-woven Kente cloth, sold per yard. Each strip is individually woven on a traditional narrow-loom and hand-stitched together — a process unchanged for centuries. Perfect for bespoke tailoring or statement accessories.",
    sizes: ["1 yard", "2 yards", "3 yards", "5 yards"],
    details: ["100% authentic hand-woven Kente", "Width: approx. 10cm strips, assembled to ~120cm wide", "Colour: Gold/Black/Green (Royalty pattern)", "Priced per yard — select quantity as size", "Allow 2–3 days for cutting and dispatch"],
    imgs: [
      "/images/collection/look-08.png",
      "/images/collection/look-02.png",
    ],
  },
  "velvet-evening-kaftan": {
    name: "Velvet Evening Kaftan",
    category: "Ready to Wear",
    price: 105000,
    salePrice: 63000,
    badge: "Sale",
    badgeColor: "#e53935",
    description: "Draped in midnight-black stretch velvet with hand-embroidered gold trim at the neckline and cuffs, this evening kaftan is pure luxury. Effortlessly glamorous — wear it to your next gala, nikkah, or Owambe and let it do the talking.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
    details: ["Premium stretch velvet", "Hand-embroidered gold trim", "Fully lined with silk-touch fabric", "Dry clean only", "40% off — limited stock remaining"],
    imgs: [
      "/images/collection/look-09.png",
      "/images/collection/look-03.png",
      "/images/collection/look-01.png",
    ],
  },
  "bridal-aso-oke": {
    name: "Bridal Aso Oke Collection",
    category: "New In",
    price: 130000,
    badge: "New In",
    badgeColor: "#0D0D0D",
    description: "Our most anticipated launch. The Bridal Aso Oke Collection is a full ceremonial set — iro, buba, ipele, and gele — woven to order in your chosen colour palette. Each set is unique, made specifically for your wedding day.",
    sizes: ["Custom Only"],
    details: ["Full set: iro, buba, ipele & gele", "Woven to order — colour palette of your choice", "Lead time: 3–4 weeks from order confirmation", "Complimentary consultation call included", "Worldwide delivery via DHL Express"],
    imgs: [
      "/images/collection/look-10.png",
      "/images/collection/look-02.png",
      "/images/collection/look-04.png",
    ],
  },
};

const fallbackProduct = {
  name: "Wearables Atelier Piece",
  category: "Ready to Wear",
  price: 95000,
  salePrice: undefined as number | undefined,
  badge: undefined as string | undefined,
  badgeColor: undefined as string | undefined,
  description: "An exquisite piece from the Wearables Atelier collection, handcrafted in Lagos using the finest Nigerian fabrics.",
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
  details: ["Premium Nigerian fabric", "Handcrafted in Lagos", "Custom sizing available", "Ships worldwide"],
  imgs: [
    "/images/collection/look-11.png",
    "/images/collection/look-01.png",
  ],
};

function toDetailProduct(p: Product) {
  return {
    name: p.name,
    category: p.category,
    price: p.price,
    salePrice: p.salePrice,
    badge: p.badge,
    badgeColor: p.badgeColor,
    description: p.description,
    sizes: p.sizes,
    details: p.details,
    imgs: p.images,
  };
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={(hovered || value) >= n ? "#C9A84C" : "none"}
            stroke="#C9A84C" strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="13" height="13" viewBox="0 0 24 24"
          fill={n <= rating ? "#C9A84C" : "none"}
          stroke="#C9A84C" strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function ReviewsSection({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", location: "", rating: 0, body: "" });

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getProductReviews(slug)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    label: `${n} star${n !== 1 ? "s" : ""}`,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) { setSubmitError("Please select a star rating"); return; }
    if (!form.name.trim()) { setSubmitError("Please enter your name"); return; }
    if (!form.body.trim()) { setSubmitError("Please write your review"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await saveProductReview({ productSlug: slug, ...form });
      setSubmitted(true);
      setForm({ name: "", location: "", rating: 0, body: "" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.3em] mb-2 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>Customer Reviews</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(28px, 3vw, 40px)", color: "#0D0D0D" }}>What Our Clients Say</h2>
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 pb-10 border-b" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
          <div className="text-center flex-shrink-0">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(48px, 12vw, 72px)", fontWeight: 300, color: "#0D0D0D", lineHeight: 1 }}>
              {avgRating.toFixed(1)}
            </p>
            <div className="flex justify-center gap-0.5 my-2">
              {[1,2,3,4,5].map((n) => (
                <svg key={n} width="16" height="16" viewBox="0 0 24 24"
                  fill={n <= Math.round(avgRating) ? "#C9A84C" : "none"}
                  stroke="#C9A84C" strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
              Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 w-full flex flex-col gap-2">
            {ratingCounts.map(({ label, count }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs w-12 text-right flex-shrink-0" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>{label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(13,13,13,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: reviews.length > 0 ? `${Math.round((count / reviews.length) * 100)}%` : "0%", backgroundColor: "#C9A84C" }} />
                </div>
                <span className="text-xs w-6 flex-shrink-0" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
          {reviews.map((review) => (
            <div key={review.id} className="p-6" style={{ backgroundColor: "#fff", borderTop: "2px solid #C9A84C" }}>
              <StarDisplay rating={review.rating} />
              <p className="mt-3 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: "#0D0D0D", lineHeight: 1.7 }}>
                "{review.body}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>{review.name}</p>
                  {review.location && <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>{review.location}</p>}
                </div>
                <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                  {review.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 mb-10" style={{ color: "#9B9590", fontFamily: "'DM Sans', sans-serif" }}>
          <p className="text-sm">No reviews yet — be the first to share your experience.</p>
        </div>
      )}

      {/* Write a Review form */}
      <div className="max-w-2xl mx-auto border-t pt-10" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
        <h3 className="mb-6 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "26px", color: "#0D0D0D" }}>
          Write a Review
        </h3>

        {submitted ? (
          <div className="px-6 py-5 text-center border-l-2" style={{ borderColor: "#C9A84C", backgroundColor: "rgba(201,168,76,0.08)" }}>
            <p className="font-semibold text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>Thank you for your review!</p>
            <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>Your review is awaiting approval and will appear shortly.</p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-4 text-xs underline"
              style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
            >
              Write another review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <p className="text-xs tracking-[0.12em] uppercase mb-2 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>
                Your Rating *
              </p>
              <StarPicker value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs tracking-[0.12em] uppercase block mb-1.5 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white"
                  style={{ borderColor: "rgba(13,13,13,0.2)", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="text-xs tracking-[0.12em] uppercase block mb-1.5 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white"
                  style={{ borderColor: "rgba(13,13,13,0.2)", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
                  placeholder="Lagos, London, NYC…"
                />
              </div>
            </div>

            <div>
              <label className="text-xs tracking-[0.12em] uppercase block mb-1.5 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#0D0D0D" }}>
                Your Review *
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] bg-white resize-none"
                style={{ borderColor: "rgba(13,13,13,0.2)", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
                placeholder="Share your experience with this piece…"
                required
              />
            </div>

            {submitError && (
              <p className="text-xs" style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}>{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="py-3 text-xs tracking-[0.2em] uppercase font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#0D0D0D", color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSiteSettings();
  const hardcoded = (slug && productData[slug]) || null;
  const [serviceProduct, setServiceProduct] = useState<ReturnType<typeof toDetailProduct> | null>(null);
  const [related, setRelated] = useState<Array<{ slug: string; name: string; category: string; price: number; salePrice?: number; badge?: string; badgeColor?: string; img: string }>>(relatedPool.filter((p) => p.slug !== slug).slice(0, 4));
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    setLoadingProduct(true);
    setServiceProduct(null);
    setActiveImg(0);
    setSelectedSize("");
    let cancelled = false;
    if (!slug) { setLoadingProduct(false); return; }
    void getProduct(slug).then((p) => {
      if (!cancelled) setServiceProduct(p ? toDetailProduct(p) : null);
    }).finally(() => { if (!cancelled) setLoadingProduct(false); });
    // Load related products from the frontend service
    void getProducts().then((all) => {
      const others = all.filter((p) => p.slug !== slug && p.inStock !== false);
      if (!cancelled) {
        setRelated(others.slice(0, 4).map((p) => ({ slug: p.slug, name: p.name, category: p.category, price: p.price, salePrice: p.salePrice, badge: p.badge, badgeColor: p.badgeColor ?? "", img: p.images[0] ?? "" })));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [slug]);

  const product = serviceProduct ?? hardcoded ?? fallbackProduct;
  usePageTitle(`${product.name} | Wearables Atelier`);

  const { addItem } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = slug ? isWishlisted(slug) : false;
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Save to recently viewed & load list
  useEffect(() => {
    if (slug && !loadingProduct && serviceProduct) {
      saveRecentlyViewed({ slug, name: product.name, category: product.category, price: product.price, salePrice: product.salePrice, img: product.imgs[0] });
    }
    setRecentlyViewed(getRecentlyViewed().filter((i) => i.slug !== slug));
  }, [slug, loadingProduct]);

  // JSON-LD Product schema
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.imgs,
      brand: { "@type": "Brand", name: "Wearables Atelier" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        price: product.salePrice ?? product.price,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Wearables Atelier" },
        url: `https://www.wearablesatelier.com/product/${slug}`,
      },
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "product-schema";
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => { document.getElementById("product-schema")?.remove(); };
  }, [slug]);

  // Close zoom on ESC
  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen]);

  // Sticky bar — show when CTA scrolls out of view
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 });
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  function handleShare() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleAddToCart = () => {
    if (!selectedSize || !slug) return;
    addItem({
      id: slug,
      slug: slug,
      name: product.name,
      category: product.category,
      size: selectedSize,
      price: product.price,
      salePrice: product.salePrice,
      img: product.imgs[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const displayPrice = product.salePrice ?? product.price;

  // Deterministic "stock" from slug so it's consistent without a backend
  const stockSeed = slug ? slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 50;
  const stockLeft = (stockSeed % 7) + 2; // 2–8 units
  const isLowStock = stockLeft <= 4;

  if (!loadingProduct && !serviceProduct) return <NotFound />;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="pt-24 pb-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-8 pt-4 min-w-0" style={{ color: "#6B6560", fontFamily: "'DM Sans', sans-serif" }}>
            <Link to="/" className="hover:text-[#C9A84C] transition-colors whitespace-nowrap">Home</Link>
            <span className="flex-shrink-0">/</span>
            <Link to="/shop" className="hover:text-[#C9A84C] transition-colors whitespace-nowrap">Shop</Link>
            <span className="flex-shrink-0">/</span>
            <span className="truncate min-w-0" style={{ color: "#0D0D0D" }}>{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 xl:gap-20">
            {/* Images */}
            <div>
              <div
                className="relative overflow-hidden mb-4 group/zoom"
                style={{ aspectRatio: "3/4", cursor: "zoom-in" }}
                onClick={() => setZoomOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Enlarge image"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setZoomOpen(true); }}
              >
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1.5" style={{ backgroundColor: product.badgeColor }}>
                    <span className="text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: (product.badgeColor === "#C9A84C") ? "#0D0D0D" : "#fff" }}>
                      {product.badge}
                    </span>
                  </div>
                )}
                <img src={product.imgs[activeImg]} alt={product.name} fetchPriority="high" className="w-full h-full object-cover transition-transform duration-500 group-hover/zoom:scale-105" />
                <div className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center opacity-0 group-hover/zoom:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(248,245,240,0.9)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </div>
              </div>
              <div className="flex gap-3">
                {product.imgs.map((img, i) => (
                  <button type="button" key={i} onClick={() => setActiveImg(i)} aria-label={`View image ${i + 1}`} className="flex-1 overflow-hidden border-2 transition-all" style={{ aspectRatio: "3/4", borderColor: i === activeImg ? "#C9A84C" : "transparent" }}>
                    <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs tracking-[0.25em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>{product.category}</p>
                <button
                  type="button"
                  onClick={() => slug && toggleWishlist({ slug, name: product.name, category: product.category, price: product.price, salePrice: product.salePrice, img: product.imgs[0] })}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="p-1.5 transition-colors"
                  style={{ color: wishlisted ? "#e53935" : "#6B6560" }}
                >
                  <Heart size={20} fill={wishlisted ? "#e53935" : "none"} />
                </button>
              </div>
              <h1 className="mb-5" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(32px, 3.5vw, 52px)", color: "#0D0D0D", lineHeight: 1.1 }}>{product.name}</h1>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "22px", color: product.salePrice ? "#e53935" : "#0D0D0D" }}>₦{displayPrice.toLocaleString()}</span>
                {product.salePrice && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "16px", color: "#6B6560", textDecoration: "line-through" }}>₦{product.price.toLocaleString()}</span>}
                {product.salePrice && <span className="px-2 py-0.5 text-xs" style={{ backgroundColor: "#e53935", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>40% OFF</span>}
              </div>

              <p className="mb-8" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#6B6560", lineHeight: 1.8 }}>{product.description}</p>

              {/* Size picker */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Select Size</p>
                  <Link to="/size-guide" className="flex items-center gap-1 text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                    <Ruler size={12} /> Size Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className="px-4 py-2.5 border text-xs tracking-[0.1em] transition-all"
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
                {!selectedSize && <p className="mt-2 text-xs" style={{ color: "#C9A84C", fontFamily: "'DM Sans', sans-serif" }}>Please select a size</p>}
              </div>

              {/* CTAs */}
              <div ref={ctaRef} className="flex flex-col gap-3 mb-8">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className="flex items-center justify-center gap-3 py-4 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-40"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: added ? "#1a6e2e" : "#0D0D0D", color: "#C9A84C" }}
                >
                  <ShoppingBag size={16} />
                  {added ? "ADDED TO CART ✓" : "ADD TO BAG"}
                </button>
                <a
                  href={buildWhatsAppHref(
                    settings.storefront,
                    `Hello Wearables Atelier! I'd like to order: ${product.name} (Size: ${selectedSize || "TBD"})`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 py-4 text-xs tracking-[0.2em] uppercase border transition-all hover:border-[#25D366] hover:text-[#25D366]"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, borderColor: "rgba(13,13,13,0.3)", color: "#0D0D0D" }}
                >
                  <MessageCircle size={16} />
                  ORDER VIA WHATSAPP
                </a>
                {/* Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: copied ? "#1a6e2e" : "#6B6560" }}
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                  {copied ? "Link copied!" : "Share this piece"}
                </button>
              </div>

              {/* Product details accordion */}
              <div className="border-t" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
                <button type="button" className="flex items-center justify-between w-full py-4" onClick={() => setDetailsOpen(!detailsOpen)}>
                  <span className="text-xs tracking-[0.2em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0D0D0D" }}>Product Details</span>
                  <ChevronDown size={16} color="#0D0D0D" className="transition-transform" style={{ transform: detailsOpen ? "rotate(180deg)" : "rotate(0)" }} />
                </button>
                {detailsOpen && (
                  <ul className="pb-4 flex flex-col gap-2">
                    {product.details.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                        <span style={{ color: "#C9A84C" }}>—</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Stock / urgency */}
              {isLowStock && (
                <div className="mt-4 flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "rgba(229,57,53,0.07)", borderLeft: "2px solid #e53935" }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#e53935" }} />
                  <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#e53935", fontWeight: 600 }}>
                    Only {stockLeft} left in stock — order soon
                  </p>
                </div>
              )}

              {/* Shipping note */}
              <div className="mt-3 px-4 py-3" style={{ backgroundColor: "rgba(201,168,76,0.1)", borderLeft: "2px solid #C9A84C" }}>
                <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>
                  🌍 Free worldwide shipping on orders over ₦80,000 · Delivered in 5–14 business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof / Reviews */}
        <div className="mt-16">
          <div className="border-t pt-14" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
              <ReviewsSection slug={slug ?? ""} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-24">
            <div className="border-t pt-16" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
              <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
                <div className="text-center mb-10">
                  <p className="text-xs tracking-[0.3em] mb-2 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#C9A84C" }}>You May Also Like</p>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(28px, 3vw, 40px)", color: "#0D0D0D" }}>More from the Collection</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-10">
                  {related.map((r) => (
                    <Link key={r.slug} to={`/product/${r.slug}`} className="group block">
                      <div className="relative overflow-hidden mb-3" style={{ aspectRatio: "3/4" }}>
                        {r.badge && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5" style={{ backgroundColor: r.badgeColor }}>
                            <span className="text-[9px] tracking-[0.15em] uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: r.badgeColor === "#C9A84C" ? "#0D0D0D" : "#fff" }}>{r.badge}</span>
                          </div>
                        )}
                        <img
                          src={r.img}
                          alt={r.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>{r.category}</p>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: "#0D0D0D" }}>{r.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", color: r.salePrice ? "#e53935" : "#0D0D0D" }}>
                          ₦{(r.salePrice ?? r.price).toLocaleString()}
                        </span>
                        {r.salePrice && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#6B6560", textDecoration: "line-through" }}>₦{r.price.toLocaleString()}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <div className="border-t pt-14" style={{ borderColor: "rgba(13,13,13,0.1)" }}>
              <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
                <div className="text-center mb-10">
                  <p className="text-xs tracking-[0.3em] mb-2 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>Recently Viewed</p>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(24px, 2.5vw, 36px)", color: "#0D0D0D" }}>Your browsing history</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                  {recentlyViewed.slice(0, 6).map((r) => (
                    <Link key={r.slug} to={`/product/${r.slug}`} className="group block">
                      <div className="relative overflow-hidden mb-2" style={{ aspectRatio: "3/4" }}>
                        <img src={r.img} alt={r.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "14px", color: "#0D0D0D" }}>{r.name}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "12px", color: r.salePrice ? "#e53935" : "#0D0D0D" }}>₦{(r.salePrice ?? r.price).toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Image Zoom Lightbox */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(13,13,13,0.95)" }}
          onClick={() => setZoomOpen(false)}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close zoom"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ color: "#F8F5F0" }}
            onClick={() => setZoomOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Prev */}
          {product.imgs.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "#F8F5F0" }}
              onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg - 1 + product.imgs.length) % product.imgs.length); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}

          {/* Image */}
          <img
            src={product.imgs[activeImg]}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            style={{ cursor: "zoom-out" }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {product.imgs.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "#F8F5F0" }}
              onClick={(e) => { e.stopPropagation(); setActiveImg((activeImg + 1) % product.imgs.length); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {/* Dot indicators */}
          {product.imgs.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.imgs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: i === activeImg ? "#C9A84C" : "rgba(248,245,240,0.35)" }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Add to Bag bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300"
        style={{ transform: stickyVisible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div
          className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-3 flex items-center gap-3 sm:gap-4"
          style={{ backgroundColor: "#0D0D0D", borderTop: "1px solid rgba(201,168,76,0.25)", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0">
            <img src={product.imgs[0]} alt={product.name} className="w-12 h-14 object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs truncate" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "#F8F5F0" }}>{product.name}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "13px", color: "#C9A84C" }}>₦{displayPrice.toLocaleString()}</p>
            </div>
          </div>
          {!selectedSize && (
            <p className="text-xs flex-1 sm:flex-none" style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}>Select a size above</p>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="flex items-center gap-2 px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all disabled:opacity-40 flex-shrink-0"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: added ? "#1a6e2e" : "#C9A84C", color: "#0D0D0D" }}
          >
            <ShoppingBag size={14} />
            {added ? "ADDED ✓" : "ADD TO BAG"}
          </button>
        </div>
      </div>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
