"use client";

import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/store/authStore";

/**
 * Encapsulates the exponential-backoff cooldown logic shared between
 * the login and signup pages.
 *
 * After each failed auth attempt the cooldown doubles:
 * 2s → 4s → 8s → … capped at 30s.
 */

interface UseAuthCooldownReturn {
  /** True while the wrapped action is running. */
  isSubmitting: boolean;
  /** Seconds remaining in the current cooldown (0 = no cooldown). */
  cooldown: number;
  /** Effective loading state: submitting or in cooldown. */
  isDisabled: boolean;
  /** Error message — overridden with countdown text during cooldown. */
  displayError: string | null;
  /**
   * Wraps an async auth action (signIn / signUp) with cooldown logic.
   * Pass the async function that calls the auth store action.
   */
  withCooldown: (action: () => Promise<void>) => Promise<void>;
}

export function useAuthCooldown(): UseAuthCooldownReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const failCountRef = useRef(0);
  const error = useAuthStore((s) => s.error);

  const withCooldown = useCallback(async (action: () => Promise<void>) => {
    if (cooldown > 0) return;
    setIsSubmitting(true);
    const errorBefore = useAuthStore.getState().error;
    try {
      await action();
      const errorAfter = useAuthStore.getState().error;
      if (errorAfter && errorAfter !== errorBefore) {
        failCountRef.current += 1;
        const delay = Math.min(2 ** failCountRef.current, 30);
        setCooldown(delay);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [cooldown]);

  const isDisabled = isSubmitting || cooldown > 0;
  const displayError =
    cooldown > 0
      ? `Too many attempts. Try again in ${cooldown}s.`
      : error;

  return { isSubmitting, cooldown, isDisabled, displayError, withCooldown };
}
