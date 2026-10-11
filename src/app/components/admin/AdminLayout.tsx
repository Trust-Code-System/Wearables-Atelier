import { useState, Suspense } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router";
import { authService } from "../../lib/auth";
import { useAdmin } from "../../context/AdminContext";
import type { AdminRole } from "../../context/AdminContext";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Image,
  Layers,
  Tag,
  Users,
  Mail,
  MessageSquare,
  FileEdit,
  Settings,
  Shield,
  ScrollText,
  LogOut,
  Menu,
  X,
  Loader2,
  Paintbrush,
  Briefcase,
  Star,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  minRole?: AdminRole;
};

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Orders", to: "/admin/orders", icon: ClipboardList },
      { label: "Products", to: "/admin/products", icon: Package },
    ],
  },
  {
    title: "Media",
    items: [
      { label: "Media Library", to: "/admin/media", icon: Image },
      { label: "Collections", to: "/admin/collections", icon: Layers },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "Coupons", to: "/admin/coupons", icon: Tag },
      { label: "Customers", to: "/admin/customers", icon: Users },
      { label: "Custom Orders", to: "/admin/custom-orders", icon: Paintbrush },
      { label: "Wholesale Leads", to: "/admin/wholesale", icon: Briefcase },
    ],
  },
  {
    title: "Comms",
    items: [
      { label: "Newsletter", to: "/admin/newsletter", icon: Mail },
      { label: "Messages", to: "/admin/messages", icon: MessageSquare },
      { label: "Reviews", to: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Site",
    items: [
      { label: "Flyers", to: "/admin/flyers", icon: Megaphone },
      { label: "Content", to: "/admin/content", icon: FileEdit },
      { label: "Settings", to: "/admin/settings", icon: Settings },
      { label: "Admin Users", to: "/admin/users", icon: Shield, minRole: "owner" },
      { label: "Audit Log", to: "/admin/audit", icon: ScrollText },
    ],
  },
];

const ROLE_RANK: Record<NonNullable<AdminRole>, number> = {
  editor: 1,
  manager: 2,
  owner: 3,
};

function canSeeItem(role: AdminRole, minRole: AdminRole): boolean {
  if (!minRole) return true;
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

function pageTitleFromPath(pathname: string): string {
  const map: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/orders": "Orders",
    "/admin/newsletter": "Newsletter",
    "/admin/messages": "Messages",
    "/admin/products": "Products",
    "/admin/media": "Media Library",
    "/admin/collections": "Collections",
    "/admin/coupons": "Coupons & Promos",
    "/admin/customers": "Customers",
    "/admin/content": "Site Content",
    "/admin/settings": "Settings",
    "/admin/users": "Admin Users",
    "/admin/audit": "Audit Log",
    "/admin/custom-orders": "Custom Orders",
    "/admin/wholesale": "Wholesale Leads",
    "/admin/reviews": "Reviews",
    "/admin/flyers": "Popup Flyers",
  };
  if (pathname.startsWith("/admin/orders/")) return "Order Detail";
  return map[pathname] ?? "Admin";
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAdmin();

  const handleLogout = async () => {
    await authService.signOut();
    void navigate("/account");
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#111111", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: "rgba(201,168,76,0.15)" }}
      >
        <img
          src="/logo-transparent.png"
          alt="Wearables Atelier"
          className="h-10 w-auto max-w-[118px] flex-shrink-0 object-contain"
        />
        <div>
          <p
            className="text-xs tracking-[0.25em] uppercase font-semibold"
            style={{ color: "#C9A84C" }}
          >
            Admin
          </p>
          <p
            className="text-[10px] tracking-[0.15em]"
            style={{ color: "rgba(248,245,240,0.4)" }}
          >
            Wearables Atelier
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto"
            style={{ color: "rgba(248,245,240,0.4)" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canSeeItem(role, item.minRole ?? null)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title} className="mb-5">
              <p
                className="text-[9px] tracking-[0.3em] uppercase px-3 mb-2"
                style={{ color: "rgba(248,245,240,0.28)" }}
              >
                {section.title}
              </p>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== "/admin/dashboard" && location.pathname.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm mb-0.5 transition-colors relative group"
                    style={{
                      backgroundColor: isActive ? "#C9A84C" : "transparent",
                      color: isActive
                        ? "#0D0D0D"
                        : "rgba(248,245,240,0.65)",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "rgba(201,168,76,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "transparent";
                      }
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    <span className="flex-1 text-[13px]">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "rgba(201,168,76,0.15)" }}
      >
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "rgba(201,168,76,0.2)", color: "#C9A84C" }}
          >
            {initials}
          </div>
          <p
            className="text-xs truncate flex-1"
            style={{ color: "rgba(248,245,240,0.55)" }}
          >
            {user?.email ?? ""}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors rounded"
          style={{ color: "rgba(248,245,240,0.5)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e53935";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(229,57,53,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(248,245,240,0.5)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAdmin();
  const pageTitle = pageTitleFromPath(location.pathname);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "#F8F5F0", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full z-40"
        style={{ width: "256px" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className="fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 flex flex-col"
        style={{
          width: "256px",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 flex flex-col lg:ml-64">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "rgba(13,13,13,0.08)",
            boxShadow: "0 1px 8px rgba(13,13,13,0.06)",
          }}
        >
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ color: "#0D0D0D" }}
          >
            <Menu size={22} />
          </button>
          <h1
            className="flex-1 text-lg font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "22px",
              color: "#0D0D0D",
            }}
          >
            {pageTitle}
          </h1>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "#C9A84C", color: "#0D0D0D" }}
          >
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <Loader2
                  size={32}
                  className="animate-spin"
                  style={{ color: "#C9A84C" }}
                />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
