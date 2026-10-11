import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { User } from "../lib/auth";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { authService } from "../lib/auth";
import { checkIsAdmin } from "../lib/db";

type Tab = "signin" | "signup" | "forgot";

function getFriendlyAuthError(error: unknown) {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: string }).message)
      : "";
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "An account with this email already exists.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (msg.includes("password")) {
    if (msg.includes("at least")) return "Password should be at least 6 characters.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Please try again later.";
  }
  if (msg.includes("network")) {
    return "Network error. Please check your internet and try again.";
  }

  return raw || "Something went wrong. Please try again.";
}

function formatAccountDate(value?: string | null) {
  if (!value) return "Not available";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not available";
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function getProfileInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "WA";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Account() {
  usePageTitle("My Account | Wearables Atelier");

  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { clearWishlist } = useWishlist();
  const [tab, setTab] = useState<Tab>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", confirmPassword: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const clearFeedback = () => {
    setSubmitted(false);
    setMessage("");
    setError("");
  };

  useEffect(() => {
    clearFeedback();
  }, [tab]);

  useEffect(() => {
    void authService.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      const meta = user?.user_metadata as { full_name?: string } | undefined;
      setProfileName(meta?.full_name ?? "");
    });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      const meta = user?.user_metadata as { full_name?: string } | undefined;
      setProfileName(meta?.full_name ?? "");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    clearFeedback();
    setLoading(true);

    try {
      const trimmedName = profileName.trim();
      const existingName = (currentUser.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";
      if (trimmedName !== existingName) {
        const { error: metaErr } = await authService.updateUser({
          data: { full_name: trimmedName },
        });
        if (metaErr) throw metaErr;
      }

      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          setError("Password should be at least 6 characters.");
          setLoading(false);
          return;
        }

        if (newPassword.trim() !== confirmNewPassword.trim()) {
          setError("New password and confirm password do not match.");
          setLoading(false);
          return;
        }

        const { error: pwErr } = await authService.updateUser({ password: newPassword.trim() });
        if (pwErr) throw pwErr;
      }

      setSubmitted(true);
      setMessage("Demo profile updated in this browser. Password changes are simulated and not stored.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message).toLowerCase()
          : "";
      if (msg.includes("session") && msg.includes("reauth")) {
        setError("For security, please sign in again before changing your password.");
      } else {
        setError(getFriendlyAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await authService.signOut();
      clearCart();
      clearWishlist();
      void navigate("/account");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!currentUser) return;

    clearFeedback();
    setLoading(true);
    try {
      if (!currentUser.email) {
        setError("No email address on file.");
        setLoading(false);
        return;
      }
      const { error: resendErr } = await authService.resend({
        type: "signup",
        email: currentUser.email,
      });
      if (resendErr) throw resendErr;
      setSubmitted(true);
      setMessage("Email verification simulated. No email was sent.");
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const email = form.email.trim();
    const password = form.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (tab !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }

    if (tab === "signup" && password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (tab === "signin") {
        const { data: signData, error: signErr } = await authService.signInWithPassword({ email, password });
        if (signErr) throw signErr;
        setSubmitted(true);
        setMessage("Demo sign in successful!");
        const isAdmin = await checkIsAdmin(signData.user?.id ?? "", signData.user?.email);
        setTimeout(() => navigate(isAdmin ? "/admin" : "/"), 900);
      } else if (tab === "signup") {
        const { data, error: signUpErr } = await authService.signUp({
          email,
          password,
          options: {
            data: form.name.trim() ? { full_name: form.name.trim() } : undefined,
          },
        });
        if (signUpErr) throw signUpErr;
        setSubmitted(true);
        if (data.session) {
          setMessage("Demo account created in this browser. You are signed in.");
        } else {
          setMessage("Demo account created. No confirmation email is sent.");
        }
      } else {
        const { error: resetErr } = await authService.resetPasswordForEmail(email);
        if (resetErr) throw resetErr;
        setSubmitted(true);
        setMessage("Password reset simulated. No email is sent and passwords are not stored.");
      }
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "signin", label: "Sign In" },
    { key: "signup", label: "Create Account" },
    { key: "forgot", label: "Forgot Password" },
  ];

  const inputClass =
    "w-full rounded-[20px] border border-[rgba(13,13,13,0.14)] bg-[rgba(248,245,240,0.6)] px-5 text-sm text-[#0D0D0D] outline-none transition-colors focus:border-[#C9A84C]";
  const panelClass =
    "rounded-[32px] border border-[rgba(13,13,13,0.08)] bg-[rgba(255,255,255,0.62)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.05)] md:p-8";
  const labelClass = "mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0D0D]";
  const displayName =
    (currentUser?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";
  const profileInitials = getProfileInitials(displayName, currentUser?.email);
  const memberSince = formatAccountDate(currentUser?.created_at);
  const lastSignIn = formatAccountDate(currentUser?.last_sign_in_at);

  if (currentUser) {
    const isVerified = Boolean(currentUser.email_confirmed_at);
    const profileHighlights = [
      { label: "Member Since", value: memberSince, Icon: Calendar },
      { label: "Last Sign In", value: lastSignIn, Icon: Clock3 },
      { label: "Email Status", value: isVerified ? "Verified" : "Not verified", Icon: isVerified ? CheckCircle2 : AlertCircle },
    ];

    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
        <AnnouncementBar />
        <Navbar />

        <main
          id="main-content"
          className="relative overflow-hidden bg-[linear-gradient(180deg,#F8F5F0_0%,#F4EFE7_100%)] px-6 pb-24 pt-32 lg:px-10"
        >
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.14),transparent_68%)]" />

          <div className="relative mx-auto w-full max-w-[1240px]">
            <div className="mb-10 max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#C9A84C]">Atelier Account</p>
              <h1
                className="mt-4 text-[clamp(34px,5vw,58px)] leading-[0.95] text-[#0D0D0D]"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 400 }}
              >
                Profile Settings
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(13,13,13,0.62)] sm:text-base">
                Manage your personal details, email verification, and password security from one refined account dashboard.
              </p>
            </div>

            <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-6">
                <div className="overflow-hidden rounded-[32px] border border-[rgba(201,168,76,0.18)] bg-[linear-gradient(180deg,#111111_0%,#090909_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
                  <div className="border-b border-[rgba(201,168,76,0.12)] px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[rgba(201,168,76,0.18)] bg-[linear-gradient(135deg,rgba(201,168,76,0.26),rgba(201,168,76,0.08))] text-lg font-bold uppercase tracking-[0.12em] text-[#F8F5F0]">
                        {profileInitials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(201,168,76,0.78)]">Client Profile</p>
                        <h2
                          className="mt-2 truncate text-[24px] leading-none text-[#F8F5F0]"
                          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                        >
                          {profileName.trim() || "Wearables Client"}
                        </h2>
                        <p className="mt-2 truncate text-sm text-[rgba(248,245,240,0.62)]">{currentUser.email ?? ""}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${isVerified ? "bg-[rgba(67,160,71,0.16)] text-[#9BE19E]" : "bg-[rgba(201,168,76,0.14)] text-[#E7C96A]"}`}>
                        {isVerified ? "Verified Member" : "Verification Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-px bg-[rgba(201,168,76,0.1)]">
                    {profileHighlights.map(({ label, value, Icon }) => (
                      <div key={label} className="flex items-center gap-4 bg-[rgba(255,255,255,0.01)] px-6 py-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(201,168,76,0.09)] text-[#C9A84C]">
                          <Icon size={18} />
                        </span>
                        <span>
                          <span className="block text-[10px] uppercase tracking-[0.22em] text-[rgba(248,245,240,0.38)]">{label}</span>
                          <span className="mt-1 block text-sm text-[#F8F5F0]">{value}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-5">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(201,168,76,0.16)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F8F5F0] transition-all duration-200 hover:border-[#C9A84C]/45 hover:text-[#C9A84C] disabled:opacity-60"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[rgba(13,13,13,0.1)] bg-[rgba(255,255,255,0.58)] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C9A84C]">Atelier Note</p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(13,13,13,0.66)]">
                    Your primary email stays locked here for account security. You can update your name now and change your password whenever needed.
                  </p>
                </div>
              </aside>

              <form onSubmit={handleProfileSave} className="space-y-6">
                {(submitted || error) && (
                  <div className="space-y-3">
                    {!!submitted && (
                      <div className="rounded-[24px] border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.12)] px-5 py-4 text-sm text-[#0D0D0D]">
                        {message}
                      </div>
                    )}
                    {!!error && (
                      <div className="rounded-[24px] border border-[rgba(229,57,53,0.2)] bg-[rgba(229,57,53,0.08)] px-5 py-4 text-sm text-[#8c1a16]">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                <section className={panelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C9A84C]">Personal Details</p>
                      <h2
                        className="mt-3 text-[30px] leading-none text-[#0D0D0D]"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                      >
                        Your account identity
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(13,13,13,0.05)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B6560]">
                      <UserRound size={14} />
                      Account Holder
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        aria-label="Full name"
                        onChange={(e) => {
                          clearFeedback();
                          setProfileName(e.target.value);
                        }}
                        className={`${inputClass} min-h-[58px]`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="flex min-h-[58px] items-center justify-between rounded-[20px] border border-[rgba(13,13,13,0.12)] bg-[rgba(13,13,13,0.04)] px-5">
                        <span className="min-w-0 truncate text-sm text-[rgba(13,13,13,0.78)]">{currentUser.email ?? ""}</span>
                        <Mail size={16} className="shrink-0 text-[#6B6560]" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className={panelClass}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C9A84C]">Security</p>
                      <h2
                        className="mt-3 text-[30px] leading-none text-[#0D0D0D]"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                      >
                        Verification and password
                      </h2>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isVerified ? "bg-[rgba(67,160,71,0.12)] text-[#2e7d32]" : "bg-[rgba(201,168,76,0.14)] text-[#8C6A14]"}`}>
                      {isVerified ? <CheckCircle2 size={14} /> : <Shield size={14} />}
                      {isVerified ? "Verified" : "Action Needed"}
                    </div>
                  </div>

                  <div className={`mt-7 rounded-[24px] border p-5 ${isVerified ? "border-[rgba(67,160,71,0.18)] bg-[rgba(67,160,71,0.05)]" : "border-[rgba(201,168,76,0.18)] bg-[rgba(201,168,76,0.08)]"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isVerified ? "bg-[rgba(67,160,71,0.12)] text-[#2e7d32]" : "bg-[rgba(201,168,76,0.18)] text-[#8C6A14]"}`}>
                          {isVerified ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#0D0D0D]">
                            {isVerified ? "Your email is fully verified." : "Verify your email to keep your account secure."}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[rgba(13,13,13,0.64)]">
                            {isVerified
                              ? "Your sign-in identity has already been confirmed."
                              : "We will send a fresh verification link to your inbox so you can confirm ownership of this account."}
                          </p>
                        </div>
                      </div>

                      {!isVerified && (
                        <button
                          type="button"
                          onClick={handleSendVerification}
                          disabled={loading}
                          className="rounded-full bg-[#0D0D0D] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C9A84C] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                        >
                          Send Verification Email
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          aria-label="New password"
                          onChange={(e) => {
                            clearFeedback();
                            setNewPassword(e.target.value);
                          }}
                          placeholder="Leave blank to keep current password"
                          className={`${inputClass} min-h-[58px] pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((value) => !value)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] transition-colors hover:text-[#0D0D0D]"
                          aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                        >
                          {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmNewPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          aria-label="Confirm new password"
                          onChange={(e) => {
                            clearFeedback();
                            setConfirmNewPassword(e.target.value);
                          }}
                          placeholder="Repeat new password"
                          className={`${inputClass} min-h-[58px] pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword((value) => !value)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] transition-colors hover:text-[#0D0D0D]"
                          aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-[rgba(13,13,13,0.04)] px-4 py-3">
                    <LockKeyhole size={16} className="mt-[2px] shrink-0 text-[#6B6560]" />
                    <p className="text-sm leading-6 text-[rgba(13,13,13,0.58)]">
                      Use any sample password with at least 6 characters. This is a simulation; passwords are never stored or checked.
                    </p>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6B6560]">Changes save only to this browser’s demo profile</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-[#0D0D0D] px-7 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A84C] shadow-[0_16px_28px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loading ? "Please Wait..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
        <AnnouncementBar />
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />

      <main id="main-content" className="flex items-center justify-center px-6 pb-20 pt-28">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <img src="/logo-transparent.png" alt="Wearables by Ashabi" className="mx-auto h-12 w-auto max-w-full object-contain sm:h-14" />
            <p className="mt-1 text-xs tracking-[0.3em] text-[#6B6560]">CULTURE | LUXURY | ELEGANCE</p>
          </div>

          <div className="mb-8 flex border-b border-[rgba(13,13,13,0.15)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="flex-1 pb-3 text-xs font-semibold uppercase tracking-[0.15em] transition-colors"
                style={{
                  color: tab === t.key ? "#0D0D0D" : "#6B6560",
                  borderBottom: tab === t.key ? "2px solid #C9A84C" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="mb-4 text-xs leading-5 text-[#6B6560]">
            Demo accounts: owner@demo.example for admin, customer@demo.example for the storefront.
            Use any sample password with at least 6 characters. Do not enter real credentials.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "signup" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0D0D0D]">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  aria-label="Full name"
                  value={form.name}
                  onChange={(e) => {
                    clearFeedback();
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  required
                  className="w-full border border-[rgba(13,13,13,0.2)] bg-transparent px-4 py-3 text-sm text-[#0D0D0D] outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0D0D0D]">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                value={form.email}
                onChange={(e) => {
                  clearFeedback();
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                }}
                required
                className="w-full border border-[rgba(13,13,13,0.2)] bg-transparent px-4 py-3 text-sm text-[#0D0D0D] outline-none"
              />
            </div>

            {tab !== "forgot" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0D0D0D]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    aria-label="Password"
                    value={form.password}
                    onChange={(e) => {
                      clearFeedback();
                      setForm((prev) => ({ ...prev, password: e.target.value }));
                    }}
                    required
                    className="w-full border border-[rgba(13,13,13,0.2)] bg-transparent px-4 py-3 pr-12 text-sm text-[#0D0D0D] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {tab === "signup" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#0D0D0D]">Confirm Password</label>
                <input
                  type="password"
                  placeholder="********"
                  aria-label="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => {
                    clearFeedback();
                    setForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  }}
                  required
                  className="w-full border border-[rgba(13,13,13,0.2)] bg-transparent px-4 py-3 text-sm text-[#0D0D0D] outline-none"
                />
              </div>
            )}

            {submitted ? (
              <div className="border-l-[3px] border-[#C9A84C] bg-[rgba(201,168,76,0.15)] py-4 text-center text-sm text-[#0D0D0D]">{message}</div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="mt-2 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C] transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#0D0D0D" }}
              >
                {loading
                  ? "PLEASE WAIT..."
                  : tab === "signin"
                  ? "SIGN IN"
                  : tab === "signup"
                  ? "CREATE ACCOUNT"
                  : "SEND RESET LINK"}
              </button>
            )}

            {!!error && (
              <div className="border-l-[3px] border-[#e53935] bg-[rgba(229,57,53,0.1)] px-3 py-3 text-sm text-[#8c1a16]">{error}</div>
            )}

            {tab === "signin" && (
              <button type="button" onClick={() => setTab("forgot")} className="mt-1 text-center text-xs text-[#6B6560] transition-colors hover:text-[#C9A84C]">
                Forgot your password?
              </button>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
