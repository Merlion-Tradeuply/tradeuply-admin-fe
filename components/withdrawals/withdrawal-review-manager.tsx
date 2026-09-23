"use client";

import { CaretLeft, CaretRight, Check, Eye, MagnifyingGlass, SpinnerGap, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AdminWithdrawal } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const statuses = ["all", "pending", "approved", "rejected"] as const;
type Status = (typeof statuses)[number];
const labels = { all: "All withdrawals", pending: "Pending review", approved: "Approved", rejected: "Rejected" };
const styles = { pending: "bg-[#fff6df] text-[#946515]", approved: "bg-[#e8f8ef] text-[#008d4d]", rejected: "bg-[#fff0ec] text-[#b74c39]" };
type Pagination = { limit: number; page: number; pages: number; total: number };

export function WithdrawalReviewManager() {
  const [rows, setRows] = useState<AdminWithdrawal[]>([]);
  const [status, setStatus] = useState<Status>("pending");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ limit: 10, page: 1, pages: 1, total: 0 });
  const [summary, setSummary] = useState<Record<Status, number>>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ limit: "10", page: String(page), q: debounced, status });
      const response = await fetch(`${API_ENDPOINTS.frontend.withdrawals}?${params}`);
      const result = await response.json() as { data?: { withdrawals: AdminWithdrawal[]; pagination: Pagination; summary: Record<Status, number> }; error?: { message?: string } };
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Unable to load withdrawals.");
      if (page > result.data.pagination.pages) { setPage(result.data.pagination.pages); return; }
      setRows(result.data.withdrawals); setPagination(result.data.pagination); setSummary(result.data.summary);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load withdrawals."); }
    finally { setLoading(false); }
  }, [debounced, page, status]);

  useEffect(() => { const timer = window.setTimeout(() => { setDebounced(query); setPage(1); }, 350); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function open(row: AdminWithdrawal) {
    setError("");
    const response = await fetch(`${API_ENDPOINTS.frontend.withdrawals}/${row.id}`);
    const result = await response.json() as { data?: { withdrawal: AdminWithdrawal }; error?: { message?: string } };
    if (!response.ok || !result.data) return setError(result.error?.message ?? "Unable to load withdrawal details.");
    setNotes(""); setSelected(result.data.withdrawal);
  }
  async function review(action: "approve" | "reject") {
    if (!selected) return;
    if (action === "reject" && !notes.trim()) return setError("Add a reason before rejecting this withdrawal.");
    setReviewing(true); setError("");
    try {
      const response = await fetch(`${API_ENDPOINTS.frontend.withdrawals}/${selected.id}/review`, { body: JSON.stringify({ action, notes: notes.trim() }), headers: { "Content-Type": "application/json" }, method: "PATCH" });
      const result = await response.json() as { data?: { withdrawal: AdminWithdrawal }; error?: { message?: string } };
      if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Unable to review this withdrawal.");
      setSelected(null); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to review this withdrawal."); }
    finally { setReviewing(false); }
  }

  const columns: DataTableColumn<AdminWithdrawal>[] = [
    { key: "client", label: "Client", render: (row) => <div><p className="text-sm font-extrabold text-[var(--color-ink)]">{row.client?.firstName ?? "Client"} {row.client?.lastName ?? ""}</p><p className="mt-1 text-[0.67rem] font-semibold text-[var(--color-muted)]">{row.client?.email ?? "Unavailable"}</p></div> },
    { key: "amount", label: "Amount", render: (row) => <p className="text-sm font-extrabold text-[var(--color-ink)]">{row.amount} {row.asset}</p> },
    { key: "destination", label: "Destination", render: (row) => <div><p className="text-xs font-bold text-[var(--color-ink-soft)]">{row.destinationLabel}</p><p className="mt-1 max-w-48 truncate text-[0.66rem] font-semibold text-[var(--color-muted)]" title={row.destinationWalletAddress}>{row.destinationNetwork} · {row.destinationWalletAddress}</p></div> },
    { key: "submitted", label: "Submitted", render: (row) => <div><p className="text-xs font-bold text-[var(--color-ink-soft)]">{new Date(row.createdAt).toLocaleDateString()}</p><p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">{new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div> },
    { key: "status", label: "Status", render: (row) => <span className={cn("inline-flex rounded-full px-3 py-1.5 text-[0.65rem] font-extrabold capitalize", styles[row.status])}>{row.status}</span> },
    { key: "actions", label: "Actions", headerClassName: "pr-5 text-right", cellClassName: "pr-5", render: (row) => <div className="flex justify-end"><button aria-label="Review withdrawal" className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)]" onClick={() => void open(row)} type="button"><Eye size={17} /></button></div> },
  ];

  return <div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{statuses.map((item) => <button className={cn("rounded-2xl border p-5 text-left transition", status === item ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]" : "border-[var(--color-border)] bg-white")} key={item} onClick={() => { setStatus(item); setPage(1); }} type="button"><span className="text-[0.65rem] font-extrabold tracking-[0.12em] text-[var(--color-muted)] uppercase">{labels[item]}</span><span className="mt-2 block text-2xl font-extrabold text-[var(--color-ink)]">{summary[item]}</span></button>)}</section>
    {error && <p className="mt-5 rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]">{error}</p>}
    <section className="mt-5 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-white shadow-[0_18px_55px_rgba(18,45,72,0.06)]">
      <div className="border-b border-[var(--color-border)] p-4 sm:p-5"><label className="relative block max-w-2xl"><MagnifyingGlass className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]" size={18} /><span className="sr-only">Search withdrawals</span><input className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] pr-4 pl-11 text-sm font-semibold outline-none focus:border-[var(--color-brand)]" onChange={(event) => setQuery(event.target.value)} placeholder="Search client, asset, network, or wallet" type="search" value={query} /></label></div>
      <DataTable caption="TradeUply client withdrawals" columns={columns} emptyDescription="Adjust the search or selected status." emptyIcon={<MagnifyingGlass size={30} />} emptyTitle="No withdrawals found" getRowId={(row) => row.id} isLoading={loading} minWidthClassName="min-w-[900px]" rows={rows} />
      {!loading && rows.length > 0 && <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] px-5 py-4 text-[0.68rem] font-bold text-[var(--color-muted)]"><span>Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} withdrawals</span><div className="flex items-center gap-2"><button aria-label="Previous page" className="grid size-9 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" disabled={pagination.page <= 1} onClick={() => setPage((current) => current - 1)} type="button"><CaretLeft size={15} /></button><span>Page {pagination.page} of {pagination.pages}</span><button aria-label="Next page" className="grid size-9 place-items-center rounded-lg border border-[var(--color-border)] disabled:opacity-40" disabled={pagination.page >= pagination.pages} onClick={() => setPage((current) => current + 1)} type="button"><CaretRight size={15} /></button></div></div>}
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/50 backdrop-blur-sm sm:items-center sm:p-6"><button aria-label="Close" className="absolute inset-0" onClick={() => setSelected(null)} type="button" /><section className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8"><button aria-label="Close" className="absolute top-5 right-5 grid size-10 place-items-center rounded-xl bg-slate-100" onClick={() => setSelected(null)} type="button"><X size={19} /></button><p className="text-xs font-extrabold tracking-[0.16em] text-[var(--color-brand-hover)] uppercase">Withdrawal verification</p><h2 className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">{selected.amount} {selected.asset}</h2><p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">{selected.client?.firstName} {selected.client?.lastName} · {selected.client?.email}</p><dl className="mt-7 grid gap-4 rounded-2xl bg-[#f5f8f7] p-5 sm:grid-cols-2"><div><dt className="text-[0.62rem] font-extrabold uppercase text-[var(--color-muted)]">Wallet label</dt><dd className="mt-2 text-xs font-bold">{selected.destinationLabel}</dd></div><div><dt className="text-[0.62rem] font-extrabold uppercase text-[var(--color-muted)]">Network</dt><dd className="mt-2 text-xs font-bold">{selected.destinationNetwork}</dd></div><div className="sm:col-span-2"><dt className="text-[0.62rem] font-extrabold uppercase text-[var(--color-muted)]">Destination address</dt><dd className="mt-2 break-all font-mono text-xs font-bold">{selected.destinationWalletAddress}</dd></div></dl>{selected.status === "pending" && <><label className="mt-5 block text-xs font-extrabold text-[var(--color-ink)]">Review notes<textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]" onChange={(event) => setNotes(event.target.value)} placeholder="Required when rejecting" value={notes} /></label><div className="mt-5 grid gap-3 sm:grid-cols-2"><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#efb3a5] text-sm font-extrabold text-[#b74c39]" disabled={reviewing} onClick={() => void review("reject")} type="button"><X size={17} />Reject</button><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-sm font-extrabold text-white" disabled={reviewing} onClick={() => void review("approve")} type="button">{reviewing ? <SpinnerGap className="animate-spin" size={17} /> : <Check size={17} />}Approve</button></div></>}</section></div>}
  </div>;
}
