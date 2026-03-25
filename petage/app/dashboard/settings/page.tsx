"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/authStore";
import { getAuth } from "firebase/auth";
import Button from "@/components/ui/Button";
import SettingsRow from "@/components/ui/SettingsRow";

const LEAD_TIME_OPTIONS = [
  { value: 7, label: "7 days before" },
  { value: 14, label: "14 days before" },
  { value: 30, label: "30 days before" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, firebaseUser, logout, updatePreferences } = useAuthStore();

  const displayName = user?.displayName || firebaseUser?.displayName || "";
  const email = user?.email || firebaseUser?.email || "";
  const tier = user?.tier ?? "free";
  const photoURL = user?.photoURL || firebaseUser?.photoURL || null;

  const [saving, setSaving] = useState<string | null>(null);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async (
    key: "notifPush" | "notifEmail",
    current: boolean
  ) => {
    setSaving(key);
    await updatePreferences({ [key]: !current });
    setSaving(null);
  };

  const handleLeadTime = async (days: number) => {
    setSaving("reminderLeadDays");
    await updatePreferences({ reminderLeadDays: days });
    setSaving(null);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleExportJson = async () => {
    try {
      setExportingJson(true);
      const fbUser = getAuth().currentUser;
      if (!fbUser) return;
      const token = await fbUser.getIdToken();
      
      const res = await fetch("/api/user/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `petage_export_${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const fbUser = getAuth().currentUser;
      if (!fbUser) return;
      const token = await fbUser.getIdToken();
      
      const res = await fetch("/api/user/export/pdf", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `petage_export_${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone and all data will be lost.")) return;
    try {
      setDeleting(true);
      const fbUser = getAuth().currentUser;
      if (!fbUser) return;
      const token = await fbUser.getIdToken();
      
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      
      await logout();
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
      setDeleting(false);
    }
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
              <Image
                src={photoURL}
                alt={displayName}
                width={48}
                height={48}
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
              <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard/premium")}>
                Upgrade
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Notifications section */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Notifications
        </h2>
        <div className="bg-card rounded-[16px] border border-border divide-y divide-border">
          {/* Email toggle */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-[14px] text-text-primary">Email reminders</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">Vaccine & medication alerts</p>
            </div>
            <button
              onClick={() => handleToggle("notifEmail", user?.notifEmail ?? true)}
              disabled={saving === "notifEmail"}
              className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 ${
                user?.notifEmail ? "bg-clinical-blue" : "bg-border"
              } ${saving === "notifEmail" ? "opacity-50" : ""}`}
              aria-label="Toggle email notifications"
            >
              <span
                className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  user?.notifEmail ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Push toggle */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-[14px] text-text-primary">Push notifications</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">Mobile app alerts</p>
            </div>
            <button
              onClick={() => handleToggle("notifPush", user?.notifPush ?? true)}
              disabled={saving === "notifPush"}
              className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 ${
                user?.notifPush ? "bg-clinical-blue" : "bg-border"
              } ${saving === "notifPush" ? "opacity-50" : ""}`}
              aria-label="Toggle push notifications"
            >
              <span
                className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  user?.notifPush ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Lead time dropdown */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-[14px] text-text-primary">Reminder lead time</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">How early to notify before due</p>
            </div>
            <select
              value={user?.reminderLeadDays ?? 30}
              onChange={(e) => handleLeadTime(Number(e.target.value))}
              disabled={saving === "reminderLeadDays"}
              className={`text-[13px] font-medium text-navy bg-surface border border-border rounded-[8px] px-3 py-1.5 focus:outline-none focus:border-clinical-blue transition-colors ${
                saving === "reminderLeadDays" ? "opacity-50" : ""
              }`}
            >
              {LEAD_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Data & Privacy section */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Data & Privacy
        </h2>
        <div className="bg-card rounded-[16px] border border-border divide-y divide-border">
          <div 
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
            onClick={exportingJson ? undefined : handleExportJson}
          >
            <div>
              <p className="text-[14px] font-medium text-text-primary">Export Data (JSON)</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">Download a machine-readable backup</p>
            </div>
            <span className="text-clinical-blue text-[13px] font-medium">
              {exportingJson ? "Exporting..." : "Export"}
            </span>
          </div>
          
          <div 
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
            onClick={exportingPdf ? undefined : handleExportPdf}
          >
            <div>
              <p className="text-[14px] font-medium text-text-primary">Export Data (PDF)</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">Download a human-readable summary</p>
            </div>
            <span className="text-clinical-blue text-[13px] font-medium">
              {exportingPdf ? "Generating..." : "Export"}
            </span>
          </div>

          <div 
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-pale-red transition-colors"
            onClick={deleting ? undefined : handleDeleteAccount}
          >
            <div>
              <p className="text-[14px] font-medium text-status-red">Delete Account</p>
              <p className="text-[12px] text-status-red/70 mt-0.5">Permanently remove all data</p>
            </div>
            <span className="text-status-red text-[13px] font-medium">
              {deleting ? "Deleting..." : "Delete"}
            </span>
          </div>
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
        PetAge v1.0 · {tier === "premium" ? "Premium" : "Free"} plan
      </p>
    </div>
  );
}
