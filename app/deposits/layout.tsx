import type { ReactNode } from "react";

import { ProtectedAdminLayout } from "@/components/auth/protected-admin-layout";

export default function DepositsLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedAdminLayout allowedRoles={["super-admin", "admin"]} returnTo="/deposits">
      {children}
    </ProtectedAdminLayout>
  );
}
