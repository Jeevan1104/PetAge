"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorBanner from "@/components/ui/ErrorBanner";
import GoogleIcon from "@/components/ui/icons/GoogleIcon";

// Zod validation schemas
export const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((v) => /[A-Za-z]/.test(v), "Password must contain at least one letter")
      .refine((v) => /[0-9]/.test(v), "Password must contain at least one number"),
    confirmPassword: z.string(),
    displayName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

// ---- Divider ----
function OrDivider() {
  return (
    <div className="relative py-3">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-4 text-[12px] text-text-tertiary">
          or continue with
        </span>
      </div>
    </div>
  );
}

// ---- Sign Up Form ----
interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function SignUpForm({ onSubmit, onGoogleSignIn, loading, error }: SignUpFormProps) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name (optional)"
        placeholder="What should we call you?"
        {...register("displayName")}
        error={errors.displayName?.message}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Type your password again"
        autoComplete="new-password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Create Account
      </Button>

      <OrDivider />

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={handleGoogleClick}
        loading={googleLoading}
      >
        <GoogleIcon className="mr-1" />
        Google
      </Button>
    </form>
  );
}

// ---- Login Form ----
interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, onGoogleSignIn, loading, error }: LoginFormProps) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Sign In
      </Button>

      <OrDivider />

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={handleGoogleClick}
        loading={googleLoading}
      >
        <GoogleIcon className="mr-1" />
        Google
      </Button>
    </form>
  );
}
