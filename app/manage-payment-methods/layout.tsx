import type { ReactNode } from "react";

import { ProtectedAdminLayout } from "@/components/auth/protected-admin-layout";

export default function ManagePaymentMethodsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedAdminLayout
      allowedRoles={["super-admin"]}
      returnTo="/manage-payment-methods"
    >
      {children}
    </ProtectedAdminLayout>
  );
}
