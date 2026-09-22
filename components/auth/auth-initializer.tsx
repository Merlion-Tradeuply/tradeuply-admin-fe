"use client";

import { useEffect, type ReactNode } from "react";

import type { InternalUser } from "@/lib/api/types";
import { useAppDispatch } from "@/store/hooks";
import { setAuthenticatedUser } from "@/store/slices/auth-slice";

export function AuthInitializer({
  children,
  user,
}: {
  children: ReactNode;
  user: InternalUser;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setAuthenticatedUser(user));
  }, [dispatch, user]);

  return children;
}
