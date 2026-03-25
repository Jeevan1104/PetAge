"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, reload } from "firebase/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { getAuth } from "@/lib/firebase";
import Button from "@/components/ui/Button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { firebaseUser, logout } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not logged in at all, go to login
    if (!firebaseUser) {
      router.push("/login");
      return;
    }
    // If already verified, go to dashboard
    if (firebaseUser.emailVerified) {
      router.push("/dashboard");
    }
  }, [firebaseUser, router]);

  async function handleResend() {
    const fbUser = getAuth().currentUser;
    if (!fbUser) return;
    setResending(true);
    setError(null);
    try {
      await sendEmailVerification(fbUser);
      setResent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes.");
      } else {
        setError("Failed to resend. Please try again.");
      }
    } finally {
      setResending(false);
    }
  }

  async function handleCheckVerified() {
    const fbUser = getAuth().currentUser;
    if (!fbUser) return;
    setChecking(true);
    setError(null);
    try {
      // Reload forces Firebase to fetch the latest emailVerified status
      await reload(fbUser);
      if (fbUser.emailVerified) {
        router.push("/dashboard");
      } else {
        setError("Email not verified yet. Check your inbox and click the link.");
      }
    } catch {
      setError("Could not check verification status. Try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!firebaseUser || firebaseUser.emailVerified) return null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] text-center">
        <div className="w-16 h-16 bg-blue-tint rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          📬
        </div>
        <h1 className="text-h1 text-navy mb-3">Verify your email</h1>
        <p className="text-body-sm text-text-secondary mb-2 leading-relaxed">
          We sent a verification link to{" "}
          <strong className="text-text-primary">{firebaseUser.email}</strong>.
        </p>
        <p className="text-body-sm text-text-secondary mb-8">
          Click the link in the email, then come back here.
        </p>

        {error && (
          <div className="bg-pale-red rounded-[10px] px-4 py-3 mb-4 text-[13px] text-status-red">
            {error}
          </div>
        )}

        {resent && (
          <div className="bg-pale-green rounded-[10px] px-4 py-3 mb-4 text-[13px] text-status-green">
            Verification email resent. Check your inbox.
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            loading={checking}
            onClick={handleCheckVerified}
          >
            I&apos;ve verified my email
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            loading={resending}
            onClick={handleResend}
          >
            Resend verification email
          </Button>
          <button
            onClick={handleLogout}
            className="text-body-sm text-text-secondary hover:text-status-red transition-colors"
          >
            Sign out
          </button>
        </div>

        <p className="text-[11px] text-text-tertiary mt-8">
          Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    </div>
  );
}
