import { NextResponse } from "next/server";
import { ACCOUNT_SESSION_COOKIE } from "../../../../lib/account-auth";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("returnTo");
  const destination =
    returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const response = NextResponse.redirect(new URL(destination, request.url));
  for (const cookieName of [ACCOUNT_SESSION_COOKIE, ADMIN_SESSION_COOKIE]) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}
