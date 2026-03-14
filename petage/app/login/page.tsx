"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { LoginForm, LoginFormData } from "@/components/auth/AuthForms";

// Screen 3 — Log In
// PRD: Email + password, 'Forgot Password' link, SSO options

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, signIn, signInWithGoogle, clearError } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (data: LoginFormData) => {
    await signIn(data.email, data.password);
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (user) return null;

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
            Welcome back to<br />
            your pet&apos;s <em className="text-[#7DD3FC]">health hub</em>
          </h2>
          <p className="text-[15px] text-[#94A3B8] leading-[1.7] max-w-[380px]">
            Your pets&apos; records are safe and waiting. Pick up right where you left off.
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

          <h1 className="text-h1 text-navy mb-2">Sign in to PetAge</h1>
          <p className="text-body-sm text-text-secondary mb-8">
            Access your pet health records
          </p>

          <LoginForm
            onSubmit={handleSubmit}
            onGoogleSignIn={handleGoogleSignIn}
            loading={loading}
            error={error}
          />

          <div className="text-center mt-6 space-y-2">
            <Link
              href="/forgot-password"
              className="text-body-sm text-clinical-blue font-medium hover:underline block"
            >
              Forgot your password?
            </Link>
            <p className="text-body-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-clinical-blue font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
