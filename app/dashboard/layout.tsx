import type { ReactNode } from "react";

import { ProtectedAdminLayout } from "@/components/auth/protected-admin-layout";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedAdminLayout
      allowedRoles={["super-admin", "admin", "hr"]}
      returnTo="/dashboard"
    >
      {children}
    </ProtectedAdminLayout>
  );
}
