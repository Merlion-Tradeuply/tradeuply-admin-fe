"use client";

import { List } from "@phosphor-icons/react";

import { useAppSelector } from "@/store/hooks";

export function AdminHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const user = useAppSelector((state) => state.auth.user);
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "TU";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/88 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-5 px-5 sm:px-8 lg:px-10 xl:px-12">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open admin navigation"
            className="grid size-11 place-items-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-ink)] lg:hidden"
            onClick={onOpenMenu}
            type="button"
          >
            <List size={22} weight="bold" />
          </button>
          <div>
            <p className="text-[0.62rem] font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">
              TradeUply Operations
            </p>
            <p className="mt-1 text-sm font-extrabold text-[var(--color-ink)]">
              Administration Panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden max-w-52 truncate rounded-full border border-[var(--color-border)] bg-white px-3.5 py-2 text-[0.66rem] font-extrabold text-[var(--color-muted)] sm:inline-flex">
              {user.email}
            </span>
          )}
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-ink)] text-xs font-extrabold text-white">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
