import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { InvestmentPlanManager } from "@/components/investment-plans/investment-plan-manager";

export const metadata = { title: "Investment Plans" };

export default function InvestmentPlansPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">Portfolio configuration</p>
          <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">Investment plans</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">Create, edit, filter, and publish the plans shown across the TradeUply client experience.</p>
        </div>
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(6,184,102,0.2)] transition hover:bg-[var(--color-brand-hover)]" href="/manage-investment-plans">
          <Plus size={17} weight="bold" /> Create investment plan
        </Link>
      </div>
      <InvestmentPlanManager />
    </main>
  );
}
