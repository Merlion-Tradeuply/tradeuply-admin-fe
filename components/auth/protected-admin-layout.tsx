import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthInitializer } from "@/components/auth/auth-initializer";
import { AdminLayout } from "@/components/layout/admin-layout";
import type { InternalUser } from "@/lib/api/types";
import { getCurrentAdminUser } from "@/lib/auth/current-user";

type AdminRole = InternalUser["roles"][number];

export async function ProtectedAdminLayout({
  allowedRoles,
  children,
  returnTo,
}: {
  allowedRoles: AdminRole[];
  children: ReactNode;
  returnTo: string;
}) {
  const result = await getCurrentAdminUser();

  if (result.status === 401) {
    redirect(`/api/admin/token/refresh?returnTo=${encodeURIComponent(returnTo)}`);
  }
  if (result.status === 403) redirect("/login?error=forbidden");
  if (!result.user) throw new Error("The administration panel is unavailable.");
  if (!result.user.roles.some((role) => allowedRoles.includes(role))) {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <AuthInitializer user={result.user}>
      <AdminLayout>{children}</AdminLayout>
    </AuthInitializer>
  );
}
