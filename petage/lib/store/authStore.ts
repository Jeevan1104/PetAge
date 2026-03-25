import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { getAuth, getDb, getGoogleProvider } from "@/lib/firebase";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initAuth: () => () => void;
  updatePreferences: (prefs: {
    notifPush?: boolean;
    notifEmail?: boolean;
    reminderLeadDays?: number;
  }) => Promise<{ error?: string }>;
}

interface UserCreateData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  tier: "free" | "premium";
  notifPush: boolean;
  notifEmail: boolean;
  reminderLeadDays: number;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      // Deliberately identical message — don't reveal whether the email exists
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few minutes and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/configuration-not-found":
      return "Authentication is not configured. Please contact support.";
    default:
      return err instanceof Error ? err.message : "An unexpected error occurred.";
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,

  signUp: async (email, password, displayName) => {
    try {
      set({ error: null });
      const { user: fbUser } = await createUserWithEmailAndPassword(
        getAuth(),
        email,
        password
      );

      // Send verification email immediately — best effort, don't block account creation
      try {
        await sendEmailVerification(fbUser);
      } catch {
        // Non-fatal: user can request another from /verify-email
      }

      // Create Firestore user doc
      const userData: UserCreateData = {
        uid: fbUser.uid,
        email: fbUser.email!,
        displayName: displayName || "",
        tier: "free",
        notifPush: true,
        notifEmail: true,
        reminderLeadDays: 30,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(getDb(), "users", fbUser.uid), userData);
        set({ firebaseUser: fbUser, user: userData as unknown as User });
      } catch {
        set({ firebaseUser: fbUser });
      }
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ error: null });
      await signInWithEmailAndPassword(getAuth(), email, password);
      // onAuthStateChanged handles the rest
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const { user: fbUser } = await signInWithPopup(getAuth(), getGoogleProvider());

      // Google accounts are pre-verified by Google — no email verification needed
      try {
        const userRef = doc(getDb(), "users", fbUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const userData: UserCreateData = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || "",
            photoURL: fbUser.photoURL || undefined,
            tier: "free",
            notifPush: true,
            notifEmail: true,
            reminderLeadDays: 30,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, userData);
        }
      } catch {
        // Firestore unavailable — onAuthStateChanged will handle user state
      }
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  logout: async () => {
    try {
      const fbUser = getAuth().currentUser;

      // Revoke refresh tokens server-side before signing out client-side.
      // This ensures stolen tokens cannot be used after logout.
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Non-fatal: proceed with client-side sign-out regardless
        }
      }

      await signOut(getAuth());
      set({ user: null, firebaseUser: null });
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (fbUser) => {
      if (fbUser) {
        // Unblock the app immediately — don't wait for Firestore
        set({ firebaseUser: fbUser, loading: false });

        // Load Firestore user doc in background (tier, preferences, etc.)
        try {
          const userSnap = await getDoc(doc(getDb(), "users", fbUser.uid));
          if (userSnap.exists()) {
            set({ user: userSnap.data() as User });
          }
        } catch {
          // Firestore unavailable — app works without stored preferences
        }
      } else {
        set({ user: null, firebaseUser: null, loading: false });
      }
    });

    return unsubscribe;
  },

  updatePreferences: async (prefs) => {
    try {
      const fbUser = getAuth().currentUser;
      if (!fbUser) return { error: "Not authenticated" };

      const token = await fbUser.getIdToken();
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { error: (json as Record<string, string>).error ?? "Failed to update preferences" };
      }

      // Optimistic local update
      set((state) => ({
        user: state.user
          ? { ...state.user, ...prefs, updatedAt: state.user.updatedAt }
          : null,
      }));

      return {};
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to update preferences" };
    }
  },
}));
