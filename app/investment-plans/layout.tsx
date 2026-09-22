import type { ReactNode } from "react";

import { ProtectedAdminLayout } from "@/components/auth/protected-admin-layout";

export default function InvestmentPlansLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedAdminLayout allowedRoles={["super-admin", "admin"]} returnTo="/investment-plans">
      {children}
    </ProtectedAdminLayout>
  );
}
