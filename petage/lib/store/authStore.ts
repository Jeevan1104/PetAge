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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,

  signUp: async (email, password, displayName) => {
    try {
      set({ loading: true, error: null });
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore (TRD §4 schema)
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

      await setDoc(doc(db, "users", fbUser.uid), userData);

      set({
        firebaseUser: fbUser,
        user: userData as unknown as User,
        loading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      set({ error: message, loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle user state
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      set({ error: message, loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const { user: fbUser } = await signInWithPopup(auth, googleProvider);

      // Check if user doc exists, create if not
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const userData: UserCreateData = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || "",
          photoURL: fbUser.photoURL || "",
          tier: "free",
          notifPush: true,
          notifEmail: true,
          reminderLeadDays: 30,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      set({ error: message, loading: false });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, firebaseUser: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Logout failed";
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch user data from Firestore
        try {
          const userSnap = await getDoc(doc(db, "users", fbUser.uid));
          if (userSnap.exists()) {
            set({
              firebaseUser: fbUser,
              user: userSnap.data() as User,
              loading: false,
            });
          } else {
            set({ firebaseUser: fbUser, loading: false });
          }
        } catch {
          set({ firebaseUser: fbUser, loading: false });
        }
      } else {
        set({ user: null, firebaseUser: null, loading: false });
      }
    });

    return unsubscribe;
  },
}));
