import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { getProducts } from "../lib/db";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { getCollectionLabelMap } from "../lib/siteSettings";

type FeaturedProduct = { id: string; slug: string; name: string; category: string; price: string; salePrice?: string; badge?: string; badgeColor?: string; img: string };

function ProductCard({ product }: { product: FeaturedProduct }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex-shrink-0 cursor-pointer group"
      style={{ width: "clamp(220px, 68vw, 280px)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4" }}
      >
        {/* Ghost number top-right */}
        <span
          className="absolute top-3 right-4 z-10 select-none pointer-events-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "64px",
            color: "rgba(248,245,240,0.15)",
            lineHeight: 1,
          }}
        >
          {product.id}
        </span>

        {/* Badge top-left */}
        {product.badge && (
          <div
            className="absolute top-3 left-3 z-10 px-2.5 py-1"
            style={{ backgroundColor: product.badgeColor }}
          >
            <span
              className="text-[9px] tracking-[0.18em] text-white uppercase"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                color: product.badgeColor === "#C9A84C" ? "#0D0D0D" : "#fff",
              }}
            >
              {product.badge}
            </span>
          </div>
        )}

        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />

        {/* Quick Shop bar slides up */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 transition-all duration-400"
          style={{
            backgroundColor: "#0D0D0D",
            transform: hovered ? "translateY(0)" : "translateY(100%)",
          }}
        >
          <span
            className="text-xs tracking-[0.2em] uppercase"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              color: "#C9A84C",
            }}
          >
            Quick Shop
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="pt-4">
        <p
          className="text-[10px] tracking-[0.2em] uppercase mb-1"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#6B6560",
          }}
        >
          {product.category}
        </p>
        <p
          className="mb-2"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "18px",
            color: "#0D0D0D",
          }}
        >
          {product.name}
        </p>
        <div className="flex items-center gap-3">
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              color: product.salePrice ? "#e53935" : "#0D0D0D",
            }}
          >
            {product.salePrice ?? product.price}
          </span>
          {product.salePrice && (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                color: "#6B6560",
                textDecoration: "line-through",
              }}
            >
              {product.price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const { settings } = useSiteSettings();
  useEffect(() => {
    const labels = getCollectionLabelMap(settings.collections);
    void getProducts().then((data) => setProducts(data.filter((p) => p.featured && p.inStock).map((p, index) => ({
      id: String(index + 1).padStart(2, "0"), slug: p.slug, name: p.name,
      category: labels[p.category] ?? p.category,
      price: `₦${p.price.toLocaleString("en-NG")}`,
      salePrice: p.salePrice === undefined ? undefined : `₦${p.salePrice.toLocaleString("en-NG")}`,
      badge: p.badge, badgeColor: p.badgeColor, img: p.images[0] ?? "",
    }))));
  }, [settings.collections]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "#0D0D0D" }}>
      <div className="max-w-[1440px] mx-auto">
        {/* Header row */}
        <div className="flex items-end justify-between px-6 lg:px-10 mb-10">
          <div>
            <p
              className="text-xs tracking-[0.3em] mb-3 uppercase"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#C9A84C",
              }}
            >
              Curated Selection
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(36px, 4vw, 52px)",
                color: "#F8F5F0",
                lineHeight: 1.1,
              }}
            >
              Featured Pieces
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll featured products left"
              className="w-10 h-10 border flex items-center justify-center transition-colors hover:border-[#C9A84C]"
              style={{ borderColor: "rgba(248,245,240,0.2)", color: "#F8F5F0" }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll featured products right"
              className="w-10 h-10 border flex items-center justify-center transition-colors hover:border-[#C9A84C]"
              style={{ borderColor: "rgba(248,245,240,0.2)", color: "#F8F5F0" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto px-6 lg:px-10 pb-6 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}

          {/* View All card */}
          <Link
            to="/shop"
            className="flex-shrink-0 flex flex-col items-center justify-center border transition-colors hover:border-[#C9A84C] group"
            style={{
              width: "clamp(220px, 68vw, 280px)",
              aspectRatio: "3/4",
              borderColor: "rgba(248,245,240,0.15)",
            }}
          >
            <span
              className="text-xs tracking-[0.2em] uppercase mb-3 transition-colors group-hover:text-[#C9A84C]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#F8F5F0",
              }}
            >
              View All
            </span>
            <ArrowRight
              size={20}
              className="transition-colors group-hover:text-[#C9A84C]"
              style={{ color: "#F8F5F0" }}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}