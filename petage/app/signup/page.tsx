"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useAuthCooldown } from "@/lib/hooks/useAuthCooldown";
import { SignUpForm, SignUpFormData } from "@/components/auth/AuthForms";
import AuthLayout from "@/components/auth/AuthLayout";

// Screen 2 — Sign Up
// PRD: Email, password, confirm password, 'Create Account', Apple/Google SSO

export default function SignUpPage() {
  const router = useRouter();
  const { firebaseUser, loading, signUp, signInWithGoogle, clearError } =
    useAuthStore();
  const { isDisabled, displayError, withCooldown } = useAuthCooldown();

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
    await withCooldown(() => signUp(data.email, data.password, data.displayName));
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading || firebaseUser) return null;

  return (
    <AuthLayout
      heading={
        <>
          Start building your
          <br />
          pet&apos;s health <em className="text-[#7DD3FC]">passport</em>
        </>
      }
      subtitle="Join thousands of pet owners who keep their records organized, reminders on time, and health data in one place."
      tags={["Free for 2 pets", "Vaccine reminders", "PDF health reports"]}
    >
      <h1 className="text-h1 text-navy mb-2">Create your account</h1>
      <p className="text-body-sm text-text-secondary mb-8">
        Free for up to 2 pets. No credit card required.
      </p>

      <SignUpForm
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        loading={isDisabled}
        error={displayError}
      />

      <p className="text-center text-body-sm text-text-secondary mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-clinical-blue font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
