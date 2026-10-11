import { useState, useEffect, useRef } from "react";
import { Search, User, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import type { User as AuthUser } from "../lib/auth";
import { authService } from "../lib/auth";
import { buildWhatsAppHref, getCollectionHref } from "../lib/siteSettings";

export function Navbar() {
  const { cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { settings } = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      setScrolled(currentScrollY > 40);

      if (currentScrollY <= 20) {
        setNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(scrollDelta) < 8) return;

      if (!mobileOpen && !searchOpen) {
        setNavVisible(scrollDelta < 0);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    if (mobileOpen || searchOpen) {
      setNavVisible(true);
    }
  }, [mobileOpen, searchOpen]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Escape closes search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    void authService.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const collectionLinks = settings.collections.filter((collection) => collection.showInNavbar);
  const navLinks: Array<{ label: string; href: string; isRed?: boolean }> = [
    ...collectionLinks
      .filter((collection) => collection.navAccent !== "sale")
      .map((collection) => ({
        label: collection.label.toUpperCase(),
        href: getCollectionHref(collection.slug),
      })),
    { label: "CUSTOM ORDER", href: "/custom-order" },
    { label: "WHOLESALE", href: "/wholesale" },
    ...collectionLinks
      .filter((collection) => collection.navAccent === "sale")
      .map((collection) => ({
        label: collection.label.toUpperCase(),
        href: getCollectionHref(collection.slug),
        isRed: true,
      })),
  ];
  const whatsappHref = buildWhatsAppHref(settings.storefront);

  function openSearch() {
    setMobileOpen(false);
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    void navigate(`/shop?q=${encodeURIComponent(q)}`);
    closeSearch();
  }

  const isActive = (href: string) =>
    location.pathname === href ||
    (href !== "/shop" && location.pathname.startsWith(href));

  const headerVisible = navVisible || mobileOpen || searchOpen;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        transform: headerVisible ? "translateY(0)" : "translateY(calc(-100% - 1px))",
        backgroundColor: scrolled ? "rgba(8,8,8,0.94)" : "rgba(8,8,8,0.74)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(201,168,76,0.25)"
          : "1px solid rgba(201,168,76,0.12)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <div className="max-w-[1560px] mx-auto h-20 lg:h-24 px-5 lg:px-8 xl:px-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 xl:gap-8">

        {/* Logo */}
        <Link to="/" className="z-10 flex shrink-0 items-center" aria-label="Wearables Atelier home">
          <img
            src="/logo-transparent.png"
            alt="Wearables Atelier"
            className="block h-12 sm:h-14 lg:h-[3.75rem] w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex min-w-0 items-center justify-center px-2 xl:px-4">
          <nav className="flex min-w-0 items-center justify-center gap-4 xl:gap-5 2xl:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative shrink-0 whitespace-nowrap px-1 py-2 text-[10.5px] xl:text-[11px] tracking-[0.16em] uppercase leading-none transition-colors duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  color: link.isRed
                    ? "#e53935"
                    : isActive(link.href)
                    ? "#C9A84C"
                    : "#F8F5F0",
                  borderBottom:
                    !link.isRed && isActive(link.href)
                      ? "1px solid rgba(201,168,76,0.75)"
                      : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right icons */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 lg:gap-3 xl:gap-3.5">
          <button
            type="button"
            onClick={openSearch}
            className="rounded-full p-2 transition-all duration-200 hover:bg-white/5"
            style={{ color: "#F8F5F0" }}
            aria-label="Open search"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#F8F5F0")}
          >
            <Search size={18} />
          </button>
          <Link
            to={currentUser ? "/account?view=settings" : "/account"}
            className="hidden md:flex rounded-full p-2 transition-all duration-200 hover:bg-white/5"
            style={{ color: "#F8F5F0" }}
            aria-label={currentUser ? "Profile settings" : "Account"}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#F8F5F0")}
            title={currentUser ? "Profile settings" : "Sign in or create account"}
          >
            <User size={18} />
          </Link>
          <Link
            to="/wishlist"
            className="relative rounded-full p-2 transition-all duration-200 hover:bg-white/5"
            style={{ color: "#F8F5F0" }}
            aria-label="Wishlist"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#F8F5F0")}
          >
            <Heart size={18} />
            {wishlistItems.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                style={{ backgroundColor: "#e53935", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative rounded-full p-2 transition-all duration-200 hover:bg-white/5"
            style={{ color: "#F8F5F0" }}
            aria-label="Cart"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A84C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#F8F5F0")}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                style={{ backgroundColor: "#C9A84C", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                {cartCount}
              </span>
            )}
          </Link>
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden rounded-full p-2 transition-all duration-200 hover:bg-white/5"
            style={{ color: "#F8F5F0" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Full-width search overlay */}
      {searchOpen && (
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center px-6 lg:px-10 h-20 lg:h-24"
          style={{ backgroundColor: "rgba(13,13,13,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-3xl mx-auto flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{
              border: "1px solid rgba(201,168,76,0.26)",
              backgroundColor: "rgba(248,245,240,0.04)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <Search size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, fabrics, styles..."
              className="flex-1 bg-transparent focus:outline-none text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#F8F5F0" }}
            />
            {query && (
              <button
                type="submit"
                className="shrink-0 px-3.5 py-1.5 text-[10px] tracking-[0.14em] uppercase font-semibold rounded-full transition-colors hover:opacity-90"
                style={{ backgroundColor: "#C9A84C", color: "#0D0D0D", fontFamily: "'DM Sans', sans-serif" }}
              >
                Search
              </button>
            )}
          </form>
          <button
            type="button"
            onClick={closeSearch}
            className="ml-3 p-1.5 transition-colors"
            style={{ color: "rgba(248,245,240,0.5)" }}
            aria-label="Close search"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F8F5F0")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(248,245,240,0.5)")}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      <div
        className="lg:hidden transition-all duration-500"
        style={{
          maxHeight: mobileOpen ? "calc(100dvh - 80px)" : "0",
          overflowY: mobileOpen ? "auto" : "hidden",
          overflowX: "hidden",
          backgroundColor: "rgba(13,13,13,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: mobileOpen ? "1px solid rgba(201,168,76,0.15)" : "none",
        }}
      >
        {/* Mobile search */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-3">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{
              border: "1px solid rgba(201,168,76,0.24)",
              backgroundColor: "rgba(248,245,240,0.03)",
            }}
          >
            <Search size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#F8F5F0" }}
            />
            {query && (
              <button type="submit" aria-label="Submit search" style={{ color: "#C9A84C", flexShrink: 0 }}>
                <Search size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Mobile nav links */}
        <nav className="px-6 pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center justify-between py-4 border-b text-[11px] tracking-widest uppercase font-medium transition-colors"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderColor: "rgba(255,255,255,0.06)",
                color: link.isRed ? "#e53935" : isActive(link.href) ? "#C9A84C" : "rgba(248,245,240,0.75)",
              }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              <span style={{ color: "rgba(201,168,76,0.4)", fontSize: "18px" }}>&#8594;</span>
            </Link>
          ))}
        </nav>

        {/* Mobile bottom actions */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <Link
            to={currentUser ? "/account?view=settings" : "/account"}
            className="flex items-center gap-3 text-sm py-2"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(248,245,240,0.6)" }}
            onClick={() => setMobileOpen(false)}
          >
            <User size={16} /> {currentUser ? "Profile Settings" : "My Account"}
          </Link>
          <Link
            to="/wishlist"
            className="flex items-center gap-3 text-sm py-2"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(248,245,240,0.6)" }}
            onClick={() => setMobileOpen(false)}
          >
            <Heart size={16} />
            Wishlist
            {wishlistItems.length > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                style={{ backgroundColor: "#e53935", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
              >
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 text-[11px] tracking-widest uppercase font-semibold transition-opacity hover:opacity-90"
            style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#C9A84C", color: "#0D0D0D" }}
          >
            Order via WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
