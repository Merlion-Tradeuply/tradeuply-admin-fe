"use client";

import {
  CaretRight,
  SignOut,
  SpinnerGap,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { adminNavigation } from "@/components/layout/admin-navigation";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signOut } from "@/store/slices/auth-slice";

type AdminSidebarProps = {
  onNavigate?: () => void;
};

function getRoleLabel(roles: string[]) {
  if (roles.includes("super-admin")) return "Super Admin";
  return roles.map((role) => role.replace("-", " ")).join(" · ");
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, user } = useAppSelector((state) => state.auth);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "TU";
  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "TradeUply Admin";
  const displayRole = user ? getRoleLabel(user.roles) : "Administrator";

  async function handleLogout() {
    await dispatch(signOut());
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        aria-label="TradeUply Admin dashboard"
        className="inline-flex rounded-2xl bg-white px-4 py-3"
        href="/dashboard"
        onClick={onNavigate}
      >
        <Image
          alt="TradeUply"
          className="h-auto w-40"
          height={580}
          priority
          src="/brand/tradeuply-logo.png"
          width={1621}
        />
      </Link>

      <div className="mt-9">
        <p className="px-3 text-[0.64rem] font-extrabold tracking-[0.2em] text-white/34 uppercase">
          Workspace
        </p>
        <nav aria-label="Admin navigation" className="mt-3 space-y-1">
          {adminNavigation.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              pathname.startsWith(`${href}/`) ||
              (href === "/payment-methods" && pathname === "/manage-payment-methods");

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-3.5 text-sm font-extrabold transition",
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-[0_12px_26px_rgba(6,184,102,0.22)]"
                    : "text-white/58 hover:bg-white/[0.06] hover:text-white",
                )}
                href={href}
                key={href}
                onClick={onNavigate}
              >
                <span className="flex items-center gap-3">
                  <Icon aria-hidden="true" size={21} weight="duotone" />
                  {label}
                </span>
                <CaretRight aria-hidden="true" size={15} weight="bold" />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.055] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#67e4a7]/12 text-xs font-extrabold text-[#67e4a7]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">{displayName}</p>
            <p className="mt-0.5 truncate text-[0.66rem] font-bold tracking-[0.06em] text-[#67e4a7] capitalize">
              {displayRole}
            </p>
          </div>
        </div>
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-extrabold text-white/66 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-60"
          disabled={isLoading}
          onClick={handleLogout}
          type="button"
        >
          {isLoading ? (
            <SpinnerGap aria-hidden="true" className="animate-spin" size={17} />
          ) : (
            <SignOut aria-hidden="true" size={17} weight="duotone" />
          )}
          {isLoading ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
