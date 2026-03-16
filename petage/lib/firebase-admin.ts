import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Server-only — imported exclusively from API routes

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // Fallback for local dev — limited (no token verification)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return initializeApp({ projectId: projectId! });
}

const adminApp = initAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
