"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useAuthCooldown } from "@/lib/hooks/useAuthCooldown";
import { LoginForm, LoginFormData } from "@/components/auth/AuthForms";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading, signIn, signInWithGoogle, clearError } =
    useAuthStore();
  const { isDisabled, displayError, withCooldown } = useAuthCooldown();

  useEffect(() => {
    if (firebaseUser && !loading) router.push("/dashboard");
  }, [firebaseUser, loading, router]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (data: LoginFormData) => {
    await withCooldown(() => signIn(data.email, data.password));
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading || firebaseUser) return null;

  return (
    <AuthLayout
      heading={
        <>
          Welcome back to
          <br />
          your pet&apos;s <em className="text-[#7DD3FC]">health hub</em>
        </>
      }
      subtitle="Your pets' records are safe and waiting. Pick up right where you left off."
    >
      <h1 className="text-h1 text-navy mb-2">Sign in to PetAge</h1>
      <p className="text-body-sm text-text-secondary mb-8">
        Access your pet health records
      </p>

      <LoginForm
        onSubmit={handleSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        loading={isDisabled}
        error={displayError}
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
          <Link
            href="/signup"
            className="text-clinical-blue font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
