import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Server-only — must NEVER be imported from client components.
// The "server-only" import above will throw a build error if imported client-side.

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. " +
        "All server-side Firebase operations require a valid service account credential."
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return initializeApp({
    credential: cert(serviceAccount),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

const adminApp = initAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);
