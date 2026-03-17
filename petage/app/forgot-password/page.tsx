"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getAuth } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Don't reveal if email exists — show success anyway (security best practice)
        setSent(true);
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Left — Branding panel (desktop) */}
      <div className="hidden md:flex md:w-[45%] bg-navy flex-col justify-center px-12 py-16 relative overflow-hidden">
        <div className="absolute -top-20 -right-16 w-80 h-80 rounded-full border border-white/[0.06]" />
        <div className="absolute bottom-20 -left-12 w-52 h-52 rounded-full border border-white/[0.04]" />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <span className="text-2xl">🐾</span>
            <span className="text-white font-semibold text-[18px]">PetAge</span>
          </Link>
          <h2 className="font-serif text-[36px] leading-[1.1] text-white mb-4">
            Reset your<br />
            <em className="text-[#7DD3FC]">password</em>
          </h2>
          <p className="text-[15px] text-[#94A3B8] leading-[1.7] max-w-[380px]">
            We&apos;ll send a reset link to your email so you can get back to your pets&apos; records.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 md:hidden">
            <span className="text-2xl">🐾</span>
            <span className="text-navy font-semibold text-[18px]">PetAge</span>
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-tint rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📬</span>
              </div>
              <h1 className="text-h1 text-navy mb-3">Check your email</h1>
              <p className="text-body-sm text-text-secondary mb-8 leading-relaxed">
                If an account exists for <strong className="text-text-primary">{email}</strong>,
                you&apos;ll receive a password reset link shortly.
              </p>
              <p className="text-body-sm text-text-secondary mb-6">
                Didn&apos;t get it? Check your spam folder.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Try a different email
              </Button>
              <p className="text-center text-body-sm text-text-secondary mt-4">
                <Link href="/login" className="text-clinical-blue font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-h1 text-navy mb-2">Forgot password?</h1>
              <p className="text-body-sm text-text-secondary mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {error && (
                  <div className="rounded-md bg-pale-red px-4 py-3 text-[13px] text-status-red">
                    {error}
                  </div>
                )}

                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-body-sm text-text-secondary mt-6">
                <Link href="/login" className="text-clinical-blue font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
