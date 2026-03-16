"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { SignUpForm, SignUpFormData } from "@/components/auth/AuthForms";

// Screen 2 — Sign Up
// PRD: Email, password, confirm password, 'Create Account', Apple/Google SSO

export default function SignUpPage() {
  const router = useRouter();
  const { firebaseUser, loading, error, signUp, signInWithGoogle, clearError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (firebaseUser && !loading) {
      router.push("/dashboard");
    }
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    try {
      await signUp(data.email, data.password, data.displayName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (firebaseUser) return null;

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
            Start building your<br />
            pet&apos;s health <em className="text-[#7DD3FC]">passport</em>
          </h2>
          <p className="text-[15px] text-[#94A3B8] leading-[1.7] max-w-[380px]">
            Join thousands of pet owners who keep their records organized,
            reminders on time, and health data in one place.
          </p>

          <div className="flex gap-3 mt-8">
            {["Free for 2 pets", "Vaccine reminders", "PDF health reports"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-[#CBD5E1]"
                >
                  {tag}
                </span>
              )
            )}
          </div>
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

          <h1 className="text-h1 text-navy mb-2">Create your account</h1>
          <p className="text-body-sm text-text-secondary mb-8">
            Free for up to 2 pets. No credit card required.
          </p>

          <SignUpForm
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
            loading={isSubmitting}
            error={error}
          />

          <p className="text-center text-body-sm text-text-secondary mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-clinical-blue font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
