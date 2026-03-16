/**
 * PetAge — Firebase Setup Script
 * Enables Email/Password + Google auth providers via Identity Platform REST API
 * Run: node scripts/setup-firebase.mjs
 */

import { readFileSync } from "fs";
import { createSign } from "crypto";

// Load .env.local manually
const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
const projectId = serviceAccount.project_id;

// --- Get OAuth2 access token via JWT ---
function makeJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    })
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(serviceAccount.private_key, "base64url");
  return `${header}.${payload}.${sig}`;
}

async function getAccessToken() {
  const jwt = makeJwt();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get token: " + JSON.stringify(data));
  return data.access_token;
}

// --- Enable auth providers ---
async function enableAuthProviders(token) {
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signIn: {
        email: { enabled: true, passwordRequired: true },
        anonymous: { enabled: false },
      },
    }),
  });

  const data = await res.json();
  if (res.ok) {
    console.log("✓ Email/Password auth enabled");
  } else {
    console.error("✗ Auth config failed:", JSON.stringify(data, null, 2));
  }
  return res.ok;
}

// --- Enable Google OAuth provider ---
async function enableGoogleProvider(token) {
  const url = `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/defaultSupportedIdpConfigs/google.com`;

  // Try update first, then create
  let res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled: true }),
  });

  if (res.status === 404) {
    res = await fetch(
      `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/defaultSupportedIdpConfigs?idpId=google.com`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: `projects/${projectId}/defaultSupportedIdpConfigs/google.com`, enabled: true }),
      }
    );
  }

  const data = await res.json();
  if (res.ok) {
    console.log("✓ Google sign-in enabled");
  } else {
    console.warn("⚠ Google provider (may need manual setup):", data?.error?.message || JSON.stringify(data));
  }
}

// --- Enable a GCP API ---
async function enableApi(token, apiName) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${apiName}:enable`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await res.json();
  return res.ok || data?.error?.status === "ALREADY_EXISTS";
}

// --- Create Firestore database ---
async function createFirestoreDatabase(token) {
  // First ensure the API is enabled
  const enabled = await enableApi(token, "firestore.googleapis.com");
  if (!enabled) {
    console.warn("⚠ Could not enable Firestore API automatically — enable it at:");
    console.warn(`  https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${projectId}`);
    return;
  }

  // Wait a moment for propagation
  await new Promise((r) => setTimeout(r, 3000));

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=(default)`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "FIRESTORE_NATIVE", locationId: "us-central" }),
  });

  const data = await res.json();
  if (res.ok || data?.error?.status === "ALREADY_EXISTS") {
    console.log("✓ Firestore database ready");
  } else {
    console.warn("⚠ Firestore:", data?.error?.message || JSON.stringify(data));
  }
}

// --- Main ---
console.log(`\nSetting up Firebase project: ${projectId}\n`);

try {
  const token = await getAccessToken();
  console.log("✓ Authenticated with service account\n");

  await enableAuthProviders(token);
  await enableGoogleProvider(token);
  await createFirestoreDatabase(token);

  console.log(`
Done! Your Firebase project is ready.
Next: make sure Firebase Storage is enabled at:
https://console.firebase.google.com/project/${projectId}/storage
`);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
