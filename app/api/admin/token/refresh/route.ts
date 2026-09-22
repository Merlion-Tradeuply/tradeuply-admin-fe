import { NextResponse } from "next/server";

import { refreshAdminSession } from "@/lib/auth/refresh-session";

function getReturnPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = getReturnPath(requestUrl.searchParams.get("returnTo"));
  const session = await refreshAdminSession(request);

  return NextResponse.redirect(new URL(session ? returnTo : "/login", requestUrl.origin));
}
