import { NextResponse } from "next/server";
import {
  verifyNewsletterUnsubscribeToken,
} from "../../../lib/newsletter-unsubscribe";
import { unsubscribeFromNewsletter } from "../../../lib/newsletter-repository";
import { absoluteSiteUrl } from "../../../lib/site-config";

export const dynamic = "force-dynamic";

function resultUrl(status: "success" | "invalid") {
  return absoluteSiteUrl(`/newsletter/dezabonare?status=${status}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !verifyNewsletterUnsubscribeToken(email, token)
  ) {
    return NextResponse.redirect(resultUrl("invalid"), 303);
  }
  await unsubscribeFromNewsletter(email);
  return NextResponse.redirect(resultUrl("success"), 303);
}
