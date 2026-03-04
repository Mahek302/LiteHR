import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Wallet, ChevronLeft } from "lucide-react";

export default function LicensingCheckout() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("annual");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  const isDarkTheme =
    typeof window !== "undefined"
      ? localStorage.getItem("theme") === "dark"
      : true;

  const theme = isDarkTheme
    ? {
        bg: "#0F172A",
        card: "#1E293B",
        border: "#334155",
        text: "#F1F5F9",
        muted: "#94A3B8",
      }
    : {
        bg: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E5E7EB",
        text: "#111827",
        muted: "#6B7280",
      };

  const planLabel =
    billingCycle === "quarterly"
      ? "WORKFORCEDGE Quarterly License"
      : "WORKFORCEDGE Annual License";

  const handlePayClick = () => {
    navigate(`/licensing/payment-email?cycle=${billingCycle}`);
  };

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: theme.border }}
        >
          <ChevronLeft size={16} />
          Back to Homepage
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section
            className="rounded-2xl border p-6 lg:col-span-2"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <h1 className="text-3xl font-bold">WORKFORCEDGE Licensing Payment</h1>
            <p className="mt-2 text-sm" style={{ color: theme.muted }}>
              Frontend payment flow only. Razorpay API integration will be connected later.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className="rounded-xl border p-4 text-left"
                style={{
                  borderColor: billingCycle === "annual" ? "#8B5CF6" : theme.border,
                  backgroundColor: billingCycle === "annual" ? (isDarkTheme ? "#312E81" : "#F5F3FF") : "transparent",
                }}
              >
                <p className="text-xs" style={{ color: theme.muted }}>Annual</p>
                <p className="font-semibold">Rs XXXX / year</p>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("quarterly")}
                className="rounded-xl border p-4 text-left"
                style={{
                  borderColor: billingCycle === "quarterly" ? "#8B5CF6" : theme.border,
                  backgroundColor: billingCycle === "quarterly" ? (isDarkTheme ? "#312E81" : "#F5F3FF") : "transparent",
                }}
              >
                <p className="text-xs" style={{ color: theme.muted }}>Quarterly</p>
                <p className="font-semibold">Rs XXXX / quarter</p>
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <label
                className="flex cursor-pointer items-center justify-between rounded-xl border p-4"
                style={{ borderColor: paymentMethod === "razorpay" ? "#8B5CF6" : theme.border }}
              >
                <div className="flex items-center gap-3">
                  <Wallet size={18} />
                  <div>
                    <p className="font-semibold">Razorpay</p>
                    <p className="text-xs" style={{ color: theme.muted }}>
                      Cards, UPI, Net Banking, Wallets
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handlePayClick}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-green-600 px-4 py-3 font-semibold text-white"
            >
              Pay with Razorpay
            </button>
          </section>

          <aside
            className="rounded-2xl border p-6"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.muted }}>Plan</span>
                <span>{planLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.muted }}>Base Price</span>
                <span>Rs XXXX</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: theme.muted }}>GST (18%)</span>
                <span>Rs XXXX</span>
              </div>
              <div className="border-t pt-3" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span>Rs XXXX</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-lg border p-3 text-xs" style={{ borderColor: theme.border }}>
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
              <p style={{ color: theme.muted }}>
                Secure checkout UI is ready. Payment capture will be enabled once Razorpay backend endpoint and key flow are connected.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
