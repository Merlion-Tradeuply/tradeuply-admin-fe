import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from "@/lib/admin-session";

export function proxy(request: NextRequest) {
  const legacyRoutes: Record<string, string> = {
    "/dashboard/deposits": "/deposits",
    "/dashboard/payment-methods": "/payment-methods",
  };
  const correctedPath = legacyRoutes[request.nextUrl.pathname];

  if (correctedPath) {
    return NextResponse.redirect(new URL(correctedPath, request.url));
  }

  if (request.cookies.has(ADMIN_ACCESS_TOKEN_COOKIE))
    return NextResponse.next();

  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (request.cookies.has(ADMIN_REFRESH_TOKEN_COOKIE)) {
    const refreshUrl = new URL("/api/admin/token/refresh", request.url);
    refreshUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(refreshUrl);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/clients/:path*",
    "/dashboard/:path*",
    "/deposits/:path*",
    "/manage-payment-methods/:path*",
    "/payment-methods/:path*",
    "/transactions/:path*",
  ],
};
