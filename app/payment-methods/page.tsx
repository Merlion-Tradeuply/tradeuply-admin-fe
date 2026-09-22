import { PaymentMethodCreateLink } from "@/components/payment-methods/payment-method-create-link";
import { PaymentMethodManager } from "@/components/payment-methods/payment-method-manager";

export const metadata = { title: "Payment Methods" };

export default function PaymentMethodsPage() {
  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--color-brand-hover)] uppercase">
            Funding configuration
          </p>
          <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold tracking-[-0.045em] text-[var(--color-ink)]">
            Payment methods
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 font-medium text-[var(--color-muted)]">
            Search, filter, edit, and control every funding option available
            across TradeUply.
          </p>
        </div>
        <PaymentMethodCreateLink />
      </div>
      <PaymentMethodManager />
    </main>
  );
}
