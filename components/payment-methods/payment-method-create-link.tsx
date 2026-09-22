"use client";

import { Plus } from "@phosphor-icons/react";
import Link from "next/link";

import { useAppSelector } from "@/store/hooks";

export function PaymentMethodCreateLink() {
  const canCreate = useAppSelector((state) =>
    state.auth.user?.roles.includes("super-admin"),
  );

  if (!canCreate) return null;

  return (
    <Link
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(6,184,102,0.2)] transition hover:bg-[var(--color-brand-hover)]"
      href="/manage-payment-methods"
    >
      <Plus size={17} weight="bold" />
      Create payment method
    </Link>
  );
}
