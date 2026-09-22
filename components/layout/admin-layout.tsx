"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[var(--color-page)] lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] bg-[var(--color-sidebar)] p-5 lg:block">
        <AdminSidebar />
      </aside>

      <div
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isMobileMenuOpen ? "visible" : "invisible",
        )}
      >
        <button
          aria-label="Close admin navigation"
          className={cn(
            "absolute inset-0 bg-[var(--color-ink)]/45 backdrop-blur-sm transition-opacity",
            isMobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setIsMobileMenuOpen(false)}
          type="button"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[min(19rem,88vw)] bg-[var(--color-sidebar)] p-5 shadow-2xl transition-transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            aria-label="Close navigation"
            className="absolute top-6 right-5 grid size-9 place-items-center rounded-xl border border-white/10 text-white/70"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          >
            <X size={19} weight="bold" />
          </button>
          <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
        </aside>
      </div>

      <div className="lg:col-start-2">
        <AdminHeader onOpenMenu={() => setIsMobileMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
