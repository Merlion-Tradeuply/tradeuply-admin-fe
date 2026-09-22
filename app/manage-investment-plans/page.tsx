import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { InvestmentPlanForm } from "@/components/investment-plans/investment-plan-form";

export const metadata = { title: "Manage Investment Plan" };

export default async function ManageInvestmentPlansPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--color-muted)] transition hover:text-[var(--color-brand-hover)]" href="/investment-plans">
        <ArrowLeft size={17} weight="bold" /> Back to investment plans
      </Link>
      <div className="mt-6">
        <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">Portfolio configuration</p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">{id ? "Edit investment plan" : "Create investment plan"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">Configure client-facing terms, projected daily objective, risk, strategy details, and availability.</p>
      </div>
      <InvestmentPlanForm planId={id} />
    </main>
  );
}
