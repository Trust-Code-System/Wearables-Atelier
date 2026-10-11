import { RouterProvider } from "react-router";
import { Toaster, toast } from "sonner";
import { useEffect } from "react";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { BackToTop } from "./components/BackToTop";
import { NewsletterPopup } from "./components/NewsletterPopup";
import { FlyerPopup } from "./components/FlyerPopup";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

export default function App() {
  useEffect(() => {
    function simulateExternalContact(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const href = link?.getAttribute("href") ?? "";
      if (/^(mailto:|tel:|https:\/\/wa\.me\/)/i.test(href)) {
        event.preventDefault();
        event.stopPropagation();
        toast.info("Demo contact action simulated. No message or call was sent.");
      }
    }
    document.addEventListener("click", simulateExternalContact, true);
    return () => document.removeEventListener("click", simulateExternalContact, true);
  }, []);

  return (
    <ErrorBoundary>
      <div role="note" className="fixed bottom-2 left-2 z-[150] max-w-[240px] rounded border border-[#C9A84C] bg-[#F8F5F0]/95 px-3 py-2 text-[10px] leading-4 text-[#6B6560] pointer-events-none">
        Demo · Changes stay in this browser.<br />No real payments, emails, or orders.
      </div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:text-xs focus:uppercase focus:tracking-widest"
        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, backgroundColor: "#C9A84C", color: "#0D0D0D" }}
      >
        Skip to content
      </a>
      <CartProvider>
        <WishlistProvider>
          <SiteSettingsProvider>
            <RouterProvider router={router} />
            <CookieConsent />
            <BackToTop />
            <NewsletterPopup />
            <FlyerPopup />
            <Toaster position="bottom-right" richColors closeButton />
          </SiteSettingsProvider>
        </WishlistProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}
