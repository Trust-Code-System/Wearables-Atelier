import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { WhatsAppFAB } from "../components/WhatsAppFAB";
import { useCart } from "../context/CartContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { Lock, AlertCircle } from "lucide-react";
import { simulateCheckout } from "../lib/payment";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const inputClass =
  "w-full px-4 py-3 text-sm outline-none border bg-transparent transition-colors focus:border-[#C9A84C]";
const inputStyle = {
  fontFamily: "'DM Sans', sans-serif",
  borderColor: "rgba(13,13,13,0.2)",
  color: "#0D0D0D",
  backgroundColor: "transparent",
};
const errorStyle = {
  fontFamily: "'DM Sans', sans-serif",
  color: "#e53935",
  fontSize: "11px",
  marginTop: "4px",
};
const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#6B6560",
  marginBottom: "6px",
  display: "block",
};

export default function Checkout() {
  usePageTitle("Checkout | Wearables Atelier");
  const { items, clearCart, subtotal, ready } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const checkoutComplete = useRef(false);

  const rawDiscount = Number(searchParams.get("discount") ?? 0);
  const discount = Number.isFinite(rawDiscount) ? Math.min(1, Math.max(0, rawDiscount)) : 0;
  const couponCode = searchParams.get("coupon") ?? "";
  const discountAmount = Math.round(subtotal * discount);
  const total = subtotal - discountAmount;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutForm>({ defaultValues: { country: "Nigeria" } });

  const watchedCountry = watch("country");

  // Redirect to cart if empty
  useEffect(() => {
    if (ready && items.length === 0 && !checkoutComplete.current) {
      void navigate("/cart");
    }
  }, [items, navigate, ready]);

  const onSubmit = async (data: CheckoutForm) => {
    setPaymentError("");
    setPaying(true);
    try {
      const order = await simulateCheckout({ customer: data, items, couponCode });
      const params = new URLSearchParams({ ref: order.ref, email: data.email, name: `${data.firstName} ${data.lastName}`, total: String(order.total) });
      // Save the simulated order before clearing the cart or leaving checkout.
      checkoutComplete.current = true;
      clearCart();
      void navigate(`/order-confirmed?${params.toString()}`);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Could not save the demo order. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <h1
            className="mb-10"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(32px, 4vw, 52px)",
              color: "#0D0D0D",
            }}
          >
            Checkout
          </h1>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* ─── LEFT: Details Form ─── */}
              <div className="lg:col-span-3 flex flex-col gap-8">
                {/* Contact */}
                <section>
                  <h2
                    className="mb-5 pb-3 border-b"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "22px",
                      color: "#0D0D0D",
                      borderColor: "rgba(13,13,13,0.1)",
                    }}
                  >
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>First Name *</label>
                      <input
                        {...register("firstName", { required: "First name is required" })}
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor: errors.firstName
                            ? "#e53935"
                            : "rgba(13,13,13,0.2)",
                        }}
                        placeholder="Fatima"
                      />
                      {errors.firstName && (
                        <p style={errorStyle}>{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name *</label>
                      <input
                        {...register("lastName", { required: "Last name is required" })}
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor: errors.lastName
                            ? "#e53935"
                            : "rgba(13,13,13,0.2)",
                        }}
                        placeholder="Okonkwo"
                      />
                      {errors.lastName && (
                        <p style={errorStyle}>{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address",
                          },
                        })}
                        type="email"
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor: errors.email ? "#e53935" : "rgba(13,13,13,0.2)",
                        }}
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <p style={errorStyle}>{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        {...register("phone", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[+\d\s\-()]{7,20}$/,
                            message: "Enter a valid phone number",
                          },
                        })}
                        type="tel"
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor: errors.phone ? "#e53935" : "rgba(13,13,13,0.2)",
                        }}
                        placeholder="+234 800 000 0000"
                      />
                      {errors.phone && (
                        <p style={errorStyle}>{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Delivery Address */}
                <section>
                  <h2
                    className="mb-5 pb-3 border-b"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "22px",
                      color: "#0D0D0D",
                      borderColor: "rgba(13,13,13,0.1)",
                    }}
                  >
                    Delivery Address
                  </h2>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label style={labelStyle}>Street Address *</label>
                      <input
                        {...register("address", { required: "Address is required" })}
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor: errors.address ? "#e53935" : "rgba(13,13,13,0.2)",
                        }}
                        placeholder="12 Admiralty Way, Lekki Phase 1"
                      />
                      {errors.address && (
                        <p style={errorStyle}>{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>City *</label>
                        <input
                          {...register("city", { required: "City is required" })}
                          className={inputClass}
                          style={{
                            ...inputStyle,
                            borderColor: errors.city ? "#e53935" : "rgba(13,13,13,0.2)",
                          }}
                          placeholder="Lagos"
                        />
                        {errors.city && (
                          <p style={errorStyle}>{errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label style={labelStyle}>Country *</label>
                        <input
                          {...register("country", { required: "Country is required" })}
                          className={inputClass}
                          style={{
                            ...inputStyle,
                            borderColor: errors.country
                              ? "#e53935"
                              : "rgba(13,13,13,0.2)",
                          }}
                          placeholder="Nigeria"
                        />
                        {errors.country && (
                          <p style={errorStyle}>{errors.country.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>State / Province *</label>
                      {watchedCountry?.toLowerCase() === "nigeria" ? (
                        <select
                          {...register("state", { required: "State is required" })}
                          className={inputClass}
                          style={{
                            ...inputStyle,
                            borderColor: errors.state
                              ? "#e53935"
                              : "rgba(13,13,13,0.2)",
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select a state
                          </option>
                          {NIGERIAN_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          {...register("state", { required: "State is required" })}
                          className={inputClass}
                          style={{
                            ...inputStyle,
                            borderColor: errors.state
                              ? "#e53935"
                              : "rgba(13,13,13,0.2)",
                          }}
                          placeholder="State / Province"
                        />
                      )}
                      {errors.state && (
                        <p style={errorStyle}>{errors.state.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Payment error */}
                {paymentError && (
                  <div
                    className="flex items-start gap-3 p-4 text-sm"
                    style={{
                      backgroundColor: "rgba(229,57,53,0.06)",
                      border: "1px solid rgba(229,57,53,0.25)",
                      color: "#c62828",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    {paymentError}
                  </div>
                )}

                {/* Pay button */}
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full py-4 flex items-center justify-center gap-3 text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    backgroundColor: "#C9A84C",
                    color: "#0D0D0D",
                  }}
                >
                  <Lock size={14} />
                  {paying ? "Processing…" : `Simulate Payment ₦${total.toLocaleString()}`}
                </button>

                <p
                  className="text-center text-xs"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#6B6560" }}
                >
                  Demo checkout · No money is charged. Orders are saved only in this browser.
                </p>
              </div>

              {/* ─── RIGHT: Order Summary ─── */}
              <div className="lg:col-span-2">
                <div
                  className="p-6 sticky top-28"
                  style={{ backgroundColor: "#EDE8DF" }}
                >
                  <h2
                    className="mb-6"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: "22px",
                      color: "#0D0D0D",
                    }}
                  >
                    Order Summary
                  </h2>

                  {/* Items */}
                  <div
                    className="flex flex-col gap-4 mb-6 pb-6 border-b"
                    style={{ borderColor: "rgba(13,13,13,0.1)" }}
                  >
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="flex gap-3 items-start"
                      >
                        <div className="w-14 h-18 flex-shrink-0 overflow-hidden relative">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            style={{ height: "72px" }}
                          />
                          <span
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              backgroundColor: "#0D0D0D",
                              color: "#C9A84C",
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            {item.qty}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontStyle: "italic",
                              fontSize: "15px",
                              color: "#0D0D0D",
                            }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              color: "#6B6560",
                            }}
                          >
                            Size: {item.size}
                          </p>
                        </div>
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#0D0D0D",
                          }}
                        >
                          ₦{((item.salePrice ?? item.price) * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="flex flex-col gap-3 text-sm" style={{ color: "#6B6560" }}>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span
                        style={{
                          color: "#0D0D0D",
                          fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div
                        className="flex justify-between"
                        style={{ color: "#e53935", fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <span>Discount ({couponCode})</span>
                        <span>−₦{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ fontFamily: "'DM Sans', sans-serif" }}>Shipping</span>
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          color: subtotal >= 80000 ? "#1a6e2e" : "#6B6560",
                        }}
                      >
                        {subtotal >= 80000 ? "Free" : "Calculated on delivery"}
                      </span>
                    </div>
                    <div
                      className="flex justify-between border-t pt-3"
                      style={{
                        borderColor: "rgba(13,13,13,0.15)",
                        fontWeight: 700,
                        color: "#0D0D0D",
                        fontSize: "16px",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <span>Total</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
