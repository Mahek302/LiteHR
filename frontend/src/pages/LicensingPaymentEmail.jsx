import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MailCheck, ArrowRight } from "lucide-react";

export default function LicensingPaymentEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycle = searchParams.get("cycle") === "quarterly" ? "quarterly" : "annual";

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

  return (
    <div className="min-h-screen px-4 py-10 md:px-8" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <MailCheck size={42} className="mx-auto text-green-500" />
          <h1 className="mt-4 text-3xl font-bold">Payment Received (Mock)</h1>
          <p className="mt-2 text-sm" style={{ color: theme.muted }}>
            We are assuming Razorpay payment is successful in this mock flow.
          </p>
          <p className="mt-1 text-sm" style={{ color: theme.muted }}>
            Setup email generated for your {cycle} license purchase.
          </p>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
            Email Preview
          </p>
          <h2 className="mt-2 text-2xl font-bold">Subject: Complete Your WORKFORCEDGE Admin Setup</h2>
          <p className="mt-3 text-sm" style={{ color: theme.muted }}>
            Thanks for your payment. Click the button below to register your admin account and enter company details.
          </p>

          <button
            type="button"
            onClick={() => navigate(`/licensing/admin-setup?cycle=${cycle}`)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 px-5 py-3 font-semibold text-white"
          >
            Register as Admin
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
