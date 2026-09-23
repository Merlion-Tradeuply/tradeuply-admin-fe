import { Coins } from "@phosphor-icons/react/dist/ssr";

import { DepositReviewManager } from "@/components/deposits/deposit-review-manager";

export const metadata = { title: "Deposits" };

export default function DepositsPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">Client funding</p>
          <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">Deposit verification</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">Review submitted cryptocurrency transfers. Approval credits the matching client asset wallet and creates an immutable ledger entry.</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]"><Coins size={25} weight="duotone" /></span>
      </div>
      <DepositReviewManager />
    </main>
  );
}
