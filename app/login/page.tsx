import {
  ChartDonut,
  LockKey,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/auth/admin-login-form";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
} from "@/lib/admin-session";

export const metadata = {
  description: "Secure administrator access to the TradeUply operations panel.",
  title: "Admin Login",
};

const accessHighlights = [
  { icon: UsersThree, label: "Client oversight" },
  { icon: ChartDonut, label: "Operational visibility" },
  { icon: ShieldCheck, label: "Role-controlled access" },
] as const;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const cookieStore = await cookies();

  if (cookieStore.has(ADMIN_ACCESS_TOKEN_COOKIE)) redirect("/dashboard");
  if (cookieStore.has(ADMIN_REFRESH_TOKEN_COOKIE)) {
    redirect("/api/admin/token/refresh?returnTo=/dashboard");
  }

  const requestedPath = (await searchParams).returnTo;
  const returnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";

  return (
    <main className="admin-grid min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[92rem] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[var(--color-ink)] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div aria-hidden="true" className="absolute -top-32 -right-24 size-96 rounded-full bg-[var(--color-brand)]/22 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-44 -left-32 size-96 rounded-full border-[70px] border-white/[0.035]" />

          <div className="relative">
            <span className="inline-flex rounded-2xl bg-white px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <Image alt="TradeUply" className="h-auto w-48" height={580} priority src="/brand/tradeuply-logo.png" width={1621} />
            </span>
            <p className="mt-14 text-xs font-extrabold tracking-[0.22em] text-[#67e4a7] uppercase">Administration Workspace</p>
            <h1 className="mt-5 max-w-[10ch] text-[length:var(--text-display)] leading-[1.02] font-extrabold tracking-[-0.055em]">
              Control with clarity.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 font-medium text-white/62">
              A focused operational environment for managing the TradeUply platform, reviewing activity, and supporting clients.
            </p>
          </div>

          <ul className="relative mt-12 grid gap-3 xl:grid-cols-3">
            {accessHighlights.map(({ icon: Icon, label }) => (
              <li className="rounded-2xl border border-white/10 bg-white/[0.055] p-4" key={label}>
                <Icon aria-hidden="true" className="text-[#67e4a7]" size={23} weight="duotone" />
                <p className="mt-4 text-xs leading-5 font-extrabold text-white/76">{label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="admin-login-title" className="flex items-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-lg">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">Protected Access</p>
                <h2 className="mt-3 text-[length:var(--text-h1)] leading-[1.08] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]" id="admin-login-title">
                  Welcome back.
                </h2>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
                <LockKey aria-hidden="true" size={25} weight="duotone" />
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 font-medium text-[var(--color-muted)]">
              Sign in with your administrator credentials to continue to the operations dashboard.
            </p>
            <AdminLoginForm returnTo={returnTo} />
            <p className="mt-6 text-center text-[0.7rem] leading-5 font-semibold text-[var(--color-muted)]">
              Access is limited to active internal users with an authorized role.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
