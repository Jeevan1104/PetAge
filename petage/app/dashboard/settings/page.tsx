"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const router = useRouter();
  const { user, firebaseUser, logout } = useAuthStore();

  const displayName = user?.displayName || firebaseUser?.displayName || "";
  const email = user?.email || firebaseUser?.email || "";
  const tier = user?.tier ?? "free";
  const photoURL = user?.photoURL || firebaseUser?.photoURL || null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="px-6 md:px-10 py-8 max-w-[600px] animate-fade-in">
      <h1 className="text-h1 text-navy mb-8">Settings</h1>

      {/* Account section */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Account
        </h2>
        <div className="bg-card rounded-[16px] border border-border divide-y divide-border">
          {/* Profile row */}
          <div className="flex items-center gap-4 px-5 py-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-clinical-blue/10 flex items-center justify-center text-clinical-blue font-semibold text-[18px]">
                {email.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {displayName && (
                <p className="text-[15px] font-medium text-text-primary truncate">{displayName}</p>
              )}
              <p className="text-body-sm text-text-secondary truncate">{email}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              tier === "premium"
                ? "bg-pale-amber text-status-amber"
                : "bg-[#EDE9FE] text-[#5B21B6]"
            }`}>
              {tier === "premium" ? "★ Premium" : "Free"}
            </span>
          </div>

          {/* Tier row */}
          {tier === "free" && (
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-text-primary">Upgrade to Premium</p>
                <p className="text-body-sm text-text-secondary">Unlimited pets, PDF reports & more</p>
              </div>
              <Button variant="secondary" size="sm">
                Upgrade
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Preferences section */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Preferences
        </h2>
        <div className="bg-card rounded-[16px] border border-border divide-y divide-border">
          <SettingsRow
            label="Reminder lead time"
            value={`${user?.reminderLeadDays ?? 30} days before due`}
          />
          <SettingsRow
            label="Email notifications"
            value={user?.notifEmail ? "On" : "Off"}
          />
          <SettingsRow
            label="Push notifications"
            value={user?.notifPush ? "On" : "Off"}
          />
        </div>
      </section>

      {/* Support section */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Support
        </h2>
        <div className="bg-card rounded-[16px] border border-border divide-y divide-border">
          <SettingsRow label="Privacy Policy" action />
          <SettingsRow label="Terms of Service" action />
          <SettingsRow label="Contact Support" action />
        </div>
      </section>

      {/* Sign out */}
      <Button
        variant="ghost"
        className="w-full text-status-red border-status-red/30 hover:bg-pale-red hover:border-status-red/50"
        onClick={handleLogout}
      >
        Sign Out
      </Button>

      <p className="text-center text-[11px] text-text-tertiary mt-6">
        PetAge v1.0 · Free plan
      </p>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  action = false,
}: {
  label: string;
  value?: string;
  action?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[14px] text-text-primary">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-body-sm text-text-secondary">{value}</span>}
        {action && <span className="text-text-tertiary text-[16px]">›</span>}
      </div>
    </div>
  );
}
