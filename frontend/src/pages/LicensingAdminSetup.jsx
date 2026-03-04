import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import licensingService from "../services/licensingService";

const EMPLOYEE_SIZE_OPTIONS = [
  "1-10",
  "11-25",
  "26-50",
  "51-100",
  "101-250",
  "251+",
];

export default function LicensingAdminSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycle = searchParams.get("cycle") === "quarterly" ? "quarterly" : "annual";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyWebsite: "",
    employeeSize: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isDarkTheme =
    typeof window !== "undefined"
      ? localStorage.getItem("theme") === "dark"
      : true;

  const theme = useMemo(
    () =>
      isDarkTheme
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
          },
    [isDarkTheme]
  );

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await licensingService.completeMockOnboarding({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        companyWebsite: form.companyWebsite,
        employeeSize: form.employeeSize,
        billingCycle: cycle,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen px-4 py-10 md:px-8" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <div className="mx-auto max-w-xl rounded-2xl border p-8 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <CheckCircle2 size={48} className="mx-auto text-green-500" />
          <h1 className="mt-4 text-3xl font-bold">Admin Setup Completed</h1>
          <p className="mt-2 text-sm" style={{ color: theme.muted }}>
            Your admin account is now created in the database. You can log in now.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 px-5 py-3 font-semibold text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-8" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="mx-auto max-w-2xl rounded-2xl border p-8" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        <h1 className="text-3xl font-bold">Register as Admin</h1>
        <p className="mt-2 text-sm" style={{ color: theme.muted }}>
          Complete onboarding for your {cycle} WORKFORCEDGE license.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Full Name"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="Work Email"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="Password (min 8 chars)"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <input
            required
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setField("confirmPassword", e.target.value)}
            placeholder="Confirm Password"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <input
            required
            type="text"
            value={form.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
            placeholder="Company Name"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <input
            type="url"
            value={form.companyWebsite}
            onChange={(e) => setField("companyWebsite", e.target.value)}
            placeholder="Company Website (optional)"
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{ borderColor: theme.border, backgroundColor: "transparent" }}
          />
          <select
            required
            value={form.employeeSize}
            onChange={(e) => setField("employeeSize", e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none"
            style={{
              borderColor: theme.border,
              backgroundColor: isDarkTheme ? "#0F172A" : "#FFFFFF",
              color: theme.text,
            }}
          >
            <option value="" style={{ backgroundColor: "#FFFFFF", color: "#111827" }}>
              Select Employee Size
            </option>
            {EMPLOYEE_SIZE_OPTIONS.map((size) => (
              <option
                key={size}
                value={size}
                style={{ backgroundColor: "#FFFFFF", color: "#111827" }}
              >
                {size}
              </option>
            ))}
          </select>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-green-600 px-4 py-3 font-semibold text-white disabled:opacity-70"
          >
            {loading ? "Creating Admin..." : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
