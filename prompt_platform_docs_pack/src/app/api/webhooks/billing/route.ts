import { NextResponse } from "next/server";

/**
 * Placeholder for verified billing webhooks (Stripe/Razorpay).
 * Do not grant premium access until provider signatures are validated and
 * subscription_events are processed idempotently.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Billing integration is not enabled. Configure a provider before accepting webhooks." },
    { status: 501 },
  );
}
