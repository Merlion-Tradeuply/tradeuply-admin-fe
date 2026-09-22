import "server-only";

import { cookies } from "next/headers";

import type { TokenPair } from "@/lib/api/types";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from "@/lib/admin-session";

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function setAdminSessionCookies(tokens: TokenPair) {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.accessTokenExpiresIn,
  });
  cookieStore.set(ADMIN_REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: tokens.refreshTokenExpiresIn,
  });
}

export async function clearAdminSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_ACCESS_TOKEN_COOKIE);
  cookieStore.delete(ADMIN_REFRESH_TOKEN_COOKIE);
}
