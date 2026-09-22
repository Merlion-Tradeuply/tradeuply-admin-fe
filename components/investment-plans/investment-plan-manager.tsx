"use client";

import {
  MagnifyingGlass,
  PencilSimple,
  SpinnerGap,
  Star,
  Trash,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";
import type { AdminInvestmentPlan } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  deleteInvestmentPlans,
  getInvestmentPlans,
  type InvestmentPlanSummary,
} from "@/services/investment-plan.service";

type StatusFilter = "all" | AdminInvestmentPlan["status"];
type SortFilter = "display-order" | "minimum-asc" | "minimum-desc" | "name-asc" | "name-desc";

const statuses: StatusFilter[] = ["all", "active", "coming_soon", "disabled"];
const labels: Record<StatusFilter, string> = {
  active: "Active",
  all: "All plans",
  coming_soon: "Coming soon",
  disabled: "Disabled",
};
const sortOptions: CustomSelectOption<SortFilter>[] = [
  { label: "Display order", value: "display-order" },
  { label: "Minimum: low to high", value: "minimum-asc" },
  { label: "Minimum: high to low", value: "minimum-desc" },
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
];
const emptySummary: InvestmentPlanSummary = {
  active: 0,
  all: 0,
  coming_soon: 0,
  disabled: 0,
  featured: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function statusClasses(status: AdminInvestmentPlan["status"]) {
  if (status === "active") return "bg-[#e5f8ee] text-[#008c4e]";
  if (status === "disabled") return "bg-[#f1f3f5] text-[#6e7b8a]";
  return "bg-[#fff4db] text-[#9b6a08]";
}

export function InvestmentPlanManager() {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [plans, setPlans] = useState<AdminInvestmentPlan[]>([]);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [risk, setRisk] = useState("all");
  const [risks, setRisks] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortFilter>("display-order");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [summary, setSummary] = useState<InvestmentPlanSummary>(emptySummary);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let ignore = false;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      setSelectedIds([]);
      getInvestmentPlans({
        query: debouncedQuery,
        risk: risk === "all" ? undefined : risk,
        sort,
        status: status === "all" ? undefined : status,
      })
        .then((result) => {
          if (ignore) return;
          setPlans(result.plans);
          setRisks(result.risks);
          setSummary(result.summary);
        })
        .catch((requestError: Error) => {
          if (!ignore) setError(requestError.message);
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }, 0);
    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [debouncedQuery, reloadKey, risk, sort, status]);

  const visibleIds = plans.map((plan) => plan.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const riskOptions: CustomSelectOption<string>[] = [
    { label: "All risk levels", value: "all" },
    ...risks.map((item) => ({ label: item, value: item })),
  ];

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  async function confirmDeletion() {
    setIsDeleting(true);
    setError("");
    try {
      await deleteInvestmentPlans(pendingDeleteIds);
      setPendingDeleteIds([]);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The plans could not be deleted.");
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: DataTableColumn<AdminInvestmentPlan>[] = [
    {
      key: "plan",
      label: "Investment plan",
      render: (plan) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-extrabold text-[var(--color-ink)]">{plan.name}</p>
            {plan.isFeatured && <Star className="text-[#e0a11b]" size={15} weight="fill" />}
          </div>
          <p className="mt-1 text-[0.67rem] font-bold text-[var(--color-muted)]">{plan.slug}</p>
        </div>
      ),
    },
    {
      key: "terms",
      label: "Plan terms",
      render: (plan) => (
        <div>
          <p className="text-xs font-extrabold text-[var(--color-ink-soft)]">{plan.dailyObjective}% daily · {plan.horizonDays} days</p>
          <p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">Minimum {formatCurrency(plan.minimumInvestment)}</p>
        </div>
      ),
    },
    { key: "risk", label: "Risk", render: (plan) => <span className="text-xs font-bold text-[var(--color-ink-soft)]">{plan.risk}</span> },
    {
      key: "status",
      label: "Status",
      render: (plan) => <span className={cn("inline-flex rounded-full px-3 py-1.5 text-[0.65rem] font-extrabold", statusClasses(plan.status))}>{labels[plan.status]}</span>,
    },
    { key: "order", label: "Order", render: (plan) => <span className="text-xs font-extrabold">{plan.displayOrder}</span> },
    {
      cellClassName: "pr-5",
      headerClassName: "pr-5 text-right",
      key: "actions",
      label: "Actions",
      render: (plan) => (
        <div className="flex justify-end gap-2">
          <Link className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-brand)]" href={`/manage-investment-plans?id=${plan.id}`} title={`Edit ${plan.name}`}><PencilSimple size={17} weight="duotone" /></Link>
          <button className="grid size-10 place-items-center rounded-xl border border-[#efc8c0] text-[var(--color-danger)]" onClick={() => setPendingDeleteIds([plan.id])} title={`Delete ${plan.name}`} type="button"><Trash size={17} weight="duotone" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {error && <div className="mb-5 flex items-center justify-between rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")} type="button"><X size={17} weight="bold" /></button></div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statuses.map((item) => (
          <button className={cn("rounded-2xl border p-5 text-left transition", status === item ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : "border-[var(--color-border)] bg-white")} key={item} onClick={() => setStatus(item)} type="button">
            <span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">{labels[item]}</span>
            <span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">{summary[item]}</span>
          </button>
        ))}
      </section>

      <section className="mt-5 overflow-visible rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
        <div className="grid gap-3 border-b border-[var(--color-border)] p-4 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_12rem_13rem_auto]">
          <label className="relative"><MagnifyingGlass className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]" size={18} /><span className="sr-only">Search investment plans</span><input className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, slug, risk, or strategy" type="search" value={query} /></label>
          <CustomSelect ariaLabel="Filter by risk" onChange={setRisk} options={riskOptions} value={risk} />
          <CustomSelect ariaLabel="Sort investment plans" onChange={setSort} options={sortOptions} value={sort} />
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efc8c0] px-4 text-xs font-extrabold text-[var(--color-danger)] disabled:opacity-40" disabled={selectedIds.length === 0} onClick={() => setPendingDeleteIds(selectedIds)} type="button"><Trash size={17} /> Delete selected {selectedIds.length ? `(${selectedIds.length})` : ""}</button>
        </div>
        <DataTable caption="TradeUply investment plans" columns={columns} emptyDescription="Adjust the search or filters, or create a new plan." emptyIcon={<MagnifyingGlass size={30} />} emptyTitle="No investment plans found" getRowId={(plan) => plan.id} isLoading={isLoading} rows={plans} selection={{ getLabel: (id, selected) => `${selected ? "Deselect" : "Select"} ${plans.find((plan) => plan.id === id)?.name ?? "plan"}`, onToggle: toggleSelection, onToggleAll: toggleAll, selectedIds }} />
        {!isLoading && plans.length > 0 && <div className="flex justify-between border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]"><span>Showing {plans.length} of {summary.all} plans</span><span>{selectedIds.length} selected</span></div>}
      </section>

      {pendingDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-ink)]/48 p-5 backdrop-blur-sm">
          <button aria-label="Close delete confirmation" className="absolute inset-0" onClick={() => setPendingDeleteIds([])} type="button" />
          <section aria-modal="true" className="relative w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-2xl" role="dialog">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#fff1ed] text-[var(--color-danger)]"><Trash size={23} weight="duotone" /></span>
            <h2 className="mt-5 text-xl font-extrabold text-[var(--color-ink)]">Delete {pendingDeleteIds.length === 1 ? "investment plan" : `${pendingDeleteIds.length} investment plans`}?</h2>
            <p className="mt-3 text-sm leading-6 font-medium text-[var(--color-muted)]">Deleted plans stop appearing to clients. Historical platform data remains preserved.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2"><button className="min-h-12 rounded-xl border border-[var(--color-border)] text-xs font-extrabold" disabled={isDeleting} onClick={() => setPendingDeleteIds([])} type="button">Cancel</button><button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-danger)] text-xs font-extrabold text-white" disabled={isDeleting} onClick={confirmDeletion} type="button">{isDeleting ? <SpinnerGap className="animate-spin" size={17} /> : <Trash size={17} />}{isDeleting ? "Deleting…" : "Delete plans"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
