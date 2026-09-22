import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Database,
  GearSix,
  ShieldCheck,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

import { DashboardSummary } from "@/components/dashboard/dashboard-summary";

export const metadata = {
  description: "TradeUply administration dashboard overview.",
  title: "Dashboard",
};

const upcomingModules = [
  {
    description: "Review profiles, verification status, and account access.",
    icon: UsersThree,
    title: "Client Management",
  },
  {
    description: "Create and manage the six TradeUply investment plans.",
    icon: Briefcase,
    title: "Investment Plans",
  },
  {
    description: "Monitor deposits, withdrawals, and investment activity.",
    icon: TrendUp,
    title: "Transactions",
  },
  {
    description: "Configure platform preferences and administrative roles.",
    icon: GearSix,
    title: "Settings & Roles",
  },
] as const;

const systemItems = [
  { label: "Admin frontend", state: "Ready", status: "ready" },
  { label: "Authentication API", state: "Connected", status: "ready" },
  { label: "Deposit verification", state: "Connected", status: "ready" },
] as const;

export default function DashboardPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">
            Dashboard Overview
          </p>
          <h1 className="mt-3 text-[length:var(--text-h1)] leading-[1.05] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">
            Good morning, Admin.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">
            Your central workspace for monitoring TradeUply clients, funding
            activity, and platform operations.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#bde8d1] bg-[var(--color-brand-soft)] px-4 py-2 text-xs font-extrabold text-[var(--color-brand-hover)]">
          <CheckCircle aria-hidden="true" size={17} weight="fill" />
          Frontend ready
        </div>
      </section>

      <DashboardSummary />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
        <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_16px_45px_rgba(18,45,72,0.055)] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--color-brand-hover)] uppercase">
                Operations
              </p>
              <h2 className="mt-2 text-[length:var(--text-h2)] font-extrabold tracking-[-0.035em] text-[var(--color-ink)]">
                Administration modules
              </h2>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
              <GearSix aria-hidden="true" size={23} weight="duotone" />
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {upcomingModules.map(({ description, icon: Icon, title }) => (
              <article
                className="group rounded-2xl border border-[var(--color-border)] bg-[#f8faf9] p-5 transition hover:border-[var(--color-brand)]/35 hover:bg-white"
                key={title}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-[var(--color-brand-hover)] shadow-sm">
                    <Icon aria-hidden="true" size={21} weight="duotone" />
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[var(--color-brand)]"
                    size={18}
                    weight="bold"
                  />
                </div>
                <h3 className="mt-5 font-extrabold text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-6 font-medium text-[var(--color-muted)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </article>

        <aside className="rounded-[1.75rem] bg-[var(--color-ink)] p-6 text-white shadow-[0_24px_60px_rgba(3,26,59,0.16)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#67e4a7] uppercase">
                Environment
              </p>
              <h2 className="mt-2 text-xl font-extrabold">System readiness</h2>
            </div>
            <Database
              aria-hidden="true"
              className="text-[#67e4a7]"
              size={27}
              weight="duotone"
            />
          </div>
          <ul className="mt-7 grid gap-3">
            {systemItems.map(({ label, state, status }) => (
              <li
                className="rounded-xl border border-white/10 bg-white/[0.055] p-4"
                key={label}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-extrabold text-white/78">
                    {label}
                  </span>
                  <span
                    className={
                      status === "ready"
                        ? "size-2 rounded-full bg-[#67e4a7] shadow-[0_0_0_5px_rgba(103,228,167,0.1)]"
                        : "size-2 rounded-full bg-[#e6b75f] shadow-[0_0_0_5px_rgba(230,183,95,0.1)]"
                    }
                  />
                </div>
                <p className="mt-2 text-[0.68rem] font-semibold text-white/42">
                  {state}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3 border-t border-white/10 pt-5">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#67e4a7]"
              size={21}
              weight="duotone"
            />
            <p className="text-[0.68rem] leading-5 font-medium text-white/44">
              Admin and super-admin authorization is enforced by the backend for
              payment configuration and deposit review.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
