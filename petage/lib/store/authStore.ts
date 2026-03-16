import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
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
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
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
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create user doc in Firestore — best effort, don't block auth
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
        await setDoc(doc(db, "users", fbUser.uid), userData);
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
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged handles the rest
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const { user: fbUser } = await signInWithPopup(auth, googleProvider);

      // Create user doc if first sign-in — best effort
      try {
        const userRef = doc(db, "users", fbUser.uid);
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
      await signOut(auth);
      set({ user: null, firebaseUser: null });
    } catch (err: unknown) {
      set({ error: getAuthErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Unblock the app immediately — don't wait for Firestore
        set({ firebaseUser: fbUser, loading: false });

        // Load Firestore user doc in background (tier, preferences, etc.)
        try {
          const userSnap = await getDoc(doc(db, "users", fbUser.uid));
          if (userSnap.exists()) {
            set({ user: userSnap.data() as User });
          }
        } catch {
          // Firestore unavailable — app works, just without stored preferences
        }
      } else {
        set({ user: null, firebaseUser: null, loading: false });
      }
    });

    return unsubscribe;
  },
}));
