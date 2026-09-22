import { Receipt } from "@phosphor-icons/react/dist/ssr";

import { TransactionManagement } from "@/components/transactions/transaction-management";

export const metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">
            Financial ledger
          </p>
          <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">
            Transactions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">
            Review every client balance movement, its source, and the resulting
            balance from one auditable ledger.
          </p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
          <Receipt size={25} weight="duotone" />
        </span>
      </div>
      <TransactionManagement />
    </main>
  );
}
