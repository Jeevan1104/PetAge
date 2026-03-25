import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error: unknown) {
    console.error(`Webhook Error: ${error instanceof Error ? error.message : "Unknown"}`);
    return NextResponse.json({ error: `Webhook Error: ${error instanceof Error ? error.message : "Unknown"}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any;
      const firebaseUID = session.client_reference_id || session.subscription_data?.metadata?.firebaseUID;

      if (firebaseUID) {
        // Upgrade user in Authentication claims (for efficient rule evaluation)
        await adminAuth.setCustomUserClaims(firebaseUID, { premium: true });

        // Upgrade user in Database (for immediate UI replication)
        const db = adminDb;
        await db.collection("users").doc(firebaseUID).set({
          tier: "premium",
          stripeCustomerId: session.customer,
          subscriptionId: session.subscription,
          updatedAt: new Date(),
        }, { merge: true });

        console.log(`[Stripe Webhook] Successfully upgraded Firebase UID: ${firebaseUID} to Premium`);
      }
    } else if (event.type === "customer.subscription.deleted") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscription = event.data.object as any;
      const stripeCustomerId = subscription.customer as string;

      // Demote user
      const db = adminDb;
      const usersSnap = await db.collection("users").where("stripeCustomerId", "==", stripeCustomerId).get();
      
      for (const doc of usersSnap.docs) {
        await adminAuth.setCustomUserClaims(doc.id, { premium: false });
        await doc.ref.set({
          tier: "free",
          updatedAt: new Date(),
        }, { merge: true });
        console.log(`[Stripe Webhook] Downgraded Firebase UID: ${doc.id} to Free`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error(`Error processing webhook event (${event.type}):`, error);
    return NextResponse.json({ error: "Event processing failed" }, { status: 500 });
  }
}
