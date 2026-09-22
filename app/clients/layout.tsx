import type { ReactNode } from "react";

import { ProtectedAdminLayout } from "@/components/auth/protected-admin-layout";

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedAdminLayout
      allowedRoles={["super-admin", "admin"]}
      returnTo="/clients"
    >
      {children}
    </ProtectedAdminLayout>
  );
}
