"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/Button";

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "";
const ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || "";

const FREE_FEATURES = [
  "Up to 2 pets",
  "Basic health tracking",
  "Vaccine reminders",
  "Medication logging",
  "Weight tracking",
];

const PREMIUM_FEATURES = [
  "Unlimited pets",
  "PDF Health Reports",
  "Priority email reminders",
  "Full data export (JSON & PDF)",
  "Advanced weight analytics",
  "Dark mode support",
  "Early access to new features",
];

export default function PremiumPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const tier = user?.tier ?? "free";

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const monthlyPrice = 4.99;
  const annualPrice = 39.99;
  const annualMonthly = (annualPrice / 12).toFixed(2);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const fbUser = getAuth().currentUser;
      if (!fbUser) {
        router.push("/login");
        return;
      }
      const token = await fbUser.getIdToken();
      const priceId = billingCycle === "monthly" ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID;

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (tier === "premium") {
    return (
      <div className="px-6 md:px-10 py-8 max-w-[800px] mx-auto animate-fade-in">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors mb-6"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="bg-card rounded-[16px] border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-pale-amber mx-auto flex items-center justify-center text-[28px] mb-4">
            ★
          </div>
          <h1 className="text-h1 text-navy mb-2">You&apos;re on Premium!</h1>
          <p className="text-body-sm text-text-secondary mb-6">
            You have access to all PetAge features. Manage your subscription in Settings.
          </p>
          <Button variant="secondary" onClick={() => router.push("/dashboard/settings")}>
            Back to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/settings")}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-border hover:bg-surface text-text-primary transition-colors mb-6"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold text-navy mb-2">
          Upgrade to Premium
        </h1>
        <p className="text-body-sm text-text-secondary max-w-[480px] mx-auto">
          Unlock unlimited pets, branded PDF health reports, and advanced care features for all your furry family members.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
            billingCycle === "monthly"
              ? "bg-clinical-blue text-white"
              : "bg-surface text-text-secondary border border-border hover:border-border-strong"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5 ${
            billingCycle === "annual"
              ? "bg-clinical-blue text-white"
              : "bg-surface text-text-secondary border border-border hover:border-border-strong"
          }`}
        >
          Annual
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            billingCycle === "annual"
              ? "bg-white/20 text-white"
              : "bg-pale-green text-status-green"
          }`}>
            Save 33%
          </span>
        </button>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Free plan */}
        <div className="bg-card rounded-[16px] border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-navy">Free</h2>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#5B21B6]">
              Current Plan
            </span>
          </div>
          <div className="mb-6">
            <span className="text-[32px] font-semibold text-navy">$0</span>
            <span className="text-body-sm text-text-tertiary ml-1">/month</span>
          </div>
          <ul className="space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[14px] text-text-secondary">
                <CheckIcon className="w-[18px] h-[18px] text-text-tertiary shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium plan */}
        <div className="bg-navy rounded-[16px] p-6 text-white relative overflow-hidden">
          {/* Decorative circle */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full border border-white/5" />
          <div className="absolute -bottom-16 -right-8 w-40 h-40 rounded-full border border-white/5" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold">Premium</h2>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-pale-amber text-status-amber">
                ★ Recommended
              </span>
            </div>
            <div className="mb-6">
              {billingCycle === "monthly" ? (
                <>
                  <span className="text-[32px] font-semibold">${monthlyPrice.toFixed(2)}</span>
                  <span className="text-[14px] text-white/60 ml-1">/month</span>
                </>
              ) : (
                <>
                  <span className="text-[32px] font-semibold">${annualMonthly}</span>
                  <span className="text-[14px] text-white/60 ml-1">/month</span>
                  <p className="text-[12px] text-white/50 mt-1">
                    Billed ${annualPrice.toFixed(2)}/year
                  </p>
                </>
              )}
            </div>
            <ul className="space-y-3 mb-6">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[14px] text-white/90">
                  <CheckIcon className="w-[18px] h-[18px] text-[#7DD3FC] shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full h-12 rounded-[10px] font-medium text-[14px] text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #1C5EA8, #0E7490)",
              }}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span>⬆</span>
                  Upgrade Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Restore purchases link */}
      <p className="text-center text-[12px] text-text-tertiary">
        Already a subscriber?{" "}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="text-clinical-blue hover:underline font-medium"
        >
          Restore purchases
        </button>
      </p>
    </div>
  );
}

/* — Icons — */
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
