import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

import { DashboardSummary } from "@/components/dashboard/dashboard-summary";

export const metadata = {
  description: "TradeUply administration dashboard overview.",
  title: "Dashboard",
};

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
    </main>
  );
}
