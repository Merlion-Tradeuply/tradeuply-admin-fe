"use client";

import {
  Check,
  ClockCounterClockwise,
  CurrencyCircleDollar,
  PencilSimple,
  SpinnerGap,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";

import type { AdminClient, AdminClientDetails } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  deleteClients,
  creditClientInvestmentBonus,
  getClientDetails,
  updateClient,
  type ClientUpdatePayload,
} from "@/services/client-management.service";

const tabs = ["overview", "portfolio", "deposits", "ledger"] as const;
type DetailTab = (typeof tabs)[number];

function createEditForm(client: AdminClient): ClientUpdatePayload {
  return {
    experience: client.investmentProfile.experience,
    firstName: client.firstName,
    investmentRange: client.investmentProfile.investmentRange,
    lastName: client.lastName,
    objective: client.investmentProfile.objective,
    phone: client.phone,
    status: client.status,
  };
}

export function ClientDetailDrawer({
  clientId,
  onClose,
  onDeleted,
  onUpdated,
}: {
  clientId: string;
  onClose: () => void;
  onDeleted: (clientId: string) => void;
  onUpdated: (client: AdminClient) => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [bonusAmounts, setBonusAmounts] = useState<Record<string, string>>({});
  const [bonusNotes, setBonusNotes] = useState<Record<string, string>>({});
  const [bonusMessage, setBonusMessage] = useState("");
  const [creditingInvestmentId, setCreditingInvestmentId] = useState("");
  const [details, setDetails] = useState<AdminClientDetails | null>(null);
  const [editForm, setEditForm] = useState<ClientUpdatePayload | null>(null);
  const [error, setError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getClientDetails(clientId)
      .then((result) => {
        setDetails(result);
        setEditForm(createEditForm(result.client));
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [clientId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function updateField<Field extends keyof ClientUpdatePayload>(
    field: Field,
    value: ClientUpdatePayload[Field],
  ) {
    setEditForm((current) =>
      current ? { ...current, [field]: value } : current,
    );
    setError("");
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details || !editForm) return;

    setIsSaving(true);
    setError("");
    try {
      const client = await updateClient(details.client.id, editForm);
      setDetails((current) => (current ? { ...current, client } : current));
      setEditForm(createEditForm(client));
      setIsEditing(false);
      onUpdated(client);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The client could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeClient() {
    if (!details) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteClients([details.client.id]);
      onDeleted(details.client.id);
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The client could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function addBonus(investmentId: string) {
    if (!details) return;
    const amountUsd = Number(bonusAmounts[investmentId]);
    if (!Number.isFinite(amountUsd) || amountUsd < 0.01) {
      setError("Enter a bonus amount of at least $0.01.");
      return;
    }

    setCreditingInvestmentId(investmentId);
    setBonusMessage("");
    setError("");
    try {
      const result = await creditClientInvestmentBonus(
        details.client.id,
        investmentId,
        {
          amountUsd,
          note: bonusNotes[investmentId]?.trim() || undefined,
        },
      );
      setDetails((current) => current
        ? {
            ...current,
            investments: current.investments.map((investment) =>
              investment.id === investmentId ? result.investment : investment,
            ),
          }
        : current);
      setBonusAmounts((current) => ({ ...current, [investmentId]: "" }));
      setBonusNotes((current) => ({ ...current, [investmentId]: "" }));
      setBonusMessage("Bonus credited successfully and is now available to the client.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The investment bonus could not be credited.",
      );
    } finally {
      setCreditingInvestmentId("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[var(--color-ink)]/48 backdrop-blur-sm">
      <button
        aria-label="Close client details"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-[#f5f8f7] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white/94 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[0.62rem] font-extrabold tracking-[0.16em] text-[var(--color-brand-hover)] uppercase">
              Client profile
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[var(--color-ink)]">
              Account details
            </h2>
          </div>
          <button
            aria-label="Close"
            className="grid size-10 place-items-center rounded-xl border border-[var(--color-border)] bg-white"
            onClick={onClose}
            type="button"
          >
            <X size={19} weight="bold" />
          </button>
        </header>

        {isLoading ? (
          <div className="grid min-h-[70vh] place-items-center text-[var(--color-brand-hover)]">
            <SpinnerGap className="animate-spin" size={30} />
          </div>
        ) : !details || !editForm ? (
          <div className="m-6 rounded-xl bg-[#fff1ed] p-4 text-sm font-bold text-[var(--color-danger)]">
            {error || "The client could not be loaded."}
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <section className="rounded-[1.5rem] bg-[var(--color-ink)] p-6 text-white">
              <div className="flex items-start justify-between gap-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#67e4a7]/12 text-lg font-extrabold text-[#67e4a7]">
                    {details.client.firstName.charAt(0)}
                    {details.client.lastName.charAt(0)}
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold">
                      {details.client.firstName} {details.client.lastName}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-white/48">
                      {details.client.email}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#67e4a7]/12 px-3 py-1.5 text-[0.65rem] font-extrabold text-[#67e4a7] capitalize">
                  {details.client.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[0.59rem] font-extrabold tracking-[0.08em] text-white/38 uppercase">
                    Wallets
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {details.balances.length}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-white/38">Assets</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[0.59rem] font-extrabold tracking-[0.08em] text-white/38 uppercase">
                    Ledger
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {details.transactions.length}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-white/38">Entries</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[0.59rem] font-extrabold tracking-[0.08em] text-white/38 uppercase">
                    Deposits
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {details.deposits.length}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-white/38">
                    Submissions
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[0.59rem] font-extrabold tracking-[0.08em] text-white/38 uppercase">
                    Joined
                  </p>
                  <p className="mt-2 text-sm font-extrabold">
                    {new Date(details.client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            {error && (
              <p className="mt-5 rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]">
                {error}
              </p>
            )}

            <section className="mt-5 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <p className="text-[0.62rem] font-extrabold tracking-[0.12em] text-[var(--color-brand-hover)] uppercase">
                Wallet balances
              </p>
              {details.balances.length === 0 ? (
                <p className="mt-3 text-sm font-medium text-[var(--color-muted)]">
                  No funded crypto wallets yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {details.balances.map((balance) => (
                    <article
                      className="rounded-xl border border-[var(--color-border)] bg-[#f8faf9] p-4"
                      key={balance.currency}
                    >
                      <p className="text-[0.64rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        {balance.currency}
                      </p>
                      <p className="mt-2 text-lg font-extrabold text-[var(--color-ink)]">
                        {balance.availableBalance} {balance.currency}
                      </p>
                      <p className="mt-1 text-[0.66rem] font-semibold text-[var(--color-muted)]">
                        Deposited {balance.totalDeposited} {balance.currency}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-5 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-xs font-extrabold capitalize",
                    activeTab === tab
                      ? "bg-[var(--color-ink)] text-white"
                      : "border border-[var(--color-border)] bg-white text-[var(--color-muted)]",
                  )}
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsEditing(false);
                  }}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <section className="mt-5 rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.62rem] font-extrabold tracking-[0.12em] text-[var(--color-brand-hover)] uppercase">
                      Profile information
                    </p>
                    <h3 className="mt-2 text-lg font-extrabold text-[var(--color-ink)]">
                      Client details
                    </h3>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-xs font-extrabold"
                    onClick={() => setIsEditing((current) => !current)}
                    type="button"
                  >
                    <PencilSimple size={16} />
                    {isEditing ? "Cancel edit" : "Edit client"}
                  </button>
                </div>
                {isEditing ? (
                  <form
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                    onSubmit={saveChanges}
                  >
                    <label className="text-xs font-extrabold">
                      First name
                      <input
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                        onChange={(event) =>
                          updateField("firstName", event.target.value)
                        }
                        required
                        value={editForm.firstName}
                      />
                    </label>
                    <label className="text-xs font-extrabold">
                      Last name
                      <input
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                        onChange={(event) =>
                          updateField("lastName", event.target.value)
                        }
                        required
                        value={editForm.lastName}
                      />
                    </label>
                    <label className="text-xs font-extrabold">
                      Phone number
                      <input
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        required
                        value={editForm.phone}
                      />
                    </label>
                    <label className="text-xs font-extrabold">
                      Account status
                      <select
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                        onChange={(event) =>
                          updateField(
                            "status",
                            event.target.value as AdminClient["status"],
                          )
                        }
                        value={editForm.status}
                      >
                        <option value="active">Active</option>
                        <option value="pending_verification">
                          Pending verification
                        </option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>
                    <label className="text-xs font-extrabold">
                      Experience
                      <select
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold"
                        onChange={(event) =>
                          updateField(
                            "experience",
                            event.target
                              .value as ClientUpdatePayload["experience"],
                          )
                        }
                        value={editForm.experience}
                      >
                        <option>New investor</option>
                        <option>Some experience</option>
                        <option>Experienced</option>
                      </select>
                    </label>
                    <label className="text-xs font-extrabold">
                      Investment range
                      <select
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold"
                        onChange={(event) =>
                          updateField(
                            "investmentRange",
                            event.target
                              .value as ClientUpdatePayload["investmentRange"],
                          )
                        }
                        value={editForm.investmentRange}
                      >
                        <option>$50–$249</option>
                        <option>$250–$449</option>
                        <option>$500–$999</option>
                        <option>$1000+</option>
                      </select>
                    </label>
                    <label className="text-xs font-extrabold sm:col-span-2">
                      Investment objective
                      <select
                        className="mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold"
                        onChange={(event) =>
                          updateField(
                            "objective",
                            event.target
                              .value as ClientUpdatePayload["objective"],
                          )
                        }
                        value={editForm.objective}
                      >
                        <option>Short-term opportunity</option>
                        <option>Portfolio diversification</option>
                        <option>Income generation</option>
                        <option>Capital growth</option>
                      </select>
                    </label>
                    <button
                      className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-xs font-extrabold text-white sm:col-span-2"
                      disabled={isSaving}
                      type="submit"
                    >
                      {isSaving ? (
                        <SpinnerGap className="animate-spin" size={17} />
                      ) : (
                        <Check size={17} weight="bold" />
                      )}
                      {isSaving ? "Saving…" : "Save client changes"}
                    </button>
                  </form>
                ) : (
                  <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        Email
                      </dt>
                      <dd className="mt-2 break-all text-sm font-bold text-[var(--color-ink)]">
                        {details.client.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        Phone
                      </dt>
                      <dd className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                        {details.client.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        Experience
                      </dt>
                      <dd className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                        {details.client.investmentProfile.experience}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        Investment range
                      </dt>
                      <dd className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                        {details.client.investmentProfile.investmentRange}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-muted)] uppercase">
                        Primary objective
                      </dt>
                      <dd className="mt-2 text-sm font-bold text-[var(--color-ink)]">
                        {details.client.investmentProfile.objective}
                      </dd>
                    </div>
                  </dl>
                )}
              </section>
            )}

            {activeTab === "deposits" && (
              <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5">
                  <h3 className="font-extrabold text-[var(--color-ink)]">
                    Deposit activity
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                    All submitted cryptocurrency deposits for this client.
                  </p>
                </div>
                {details.deposits.length === 0 ? (
                  <p className="p-6 text-sm font-medium text-[var(--color-muted)]">
                    No deposits submitted yet.
                  </p>
                ) : (
                  details.deposits.map((deposit) => (
                    <article
                      className="border-b border-[var(--color-border)] p-5 last:border-0"
                      key={deposit.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-extrabold text-[var(--color-ink)]">
                            {deposit.amount} {deposit.asset}
                          </p>
                          <p className="mt-1 text-[0.67rem] font-semibold text-[var(--color-muted)]">
                            {new Date(deposit.createdAt).toLocaleString()} ·{" "}
                            {deposit.network}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f1f4f3] px-3 py-1.5 text-[0.63rem] font-extrabold capitalize">
                          {deposit.status}
                        </span>
                      </div>
                      <p className="mt-3 break-all text-[0.68rem] font-semibold text-[var(--color-muted)]">
                        {deposit.transactionHash}
                      </p>
                    </article>
                  ))
                )}
              </section>
            )}

            {activeTab === "portfolio" && (
              <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5">
                  <h3 className="font-extrabold text-[var(--color-ink)]">
                    Investment portfolio
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                    Every investment created by this client and its current lifecycle.
                  </p>
                </div>
                {bonusMessage && (
                  <p className="mx-5 mt-5 rounded-xl bg-[#e5f8ee] p-3 text-xs font-bold text-[#008c4e]">
                    {bonusMessage}
                  </p>
                )}
                {details.investments.length === 0 ? (
                  <p className="p-6 text-sm font-medium text-[var(--color-muted)]">
                    No investments created yet.
                  </p>
                ) : (
                  <div className="grid gap-4 p-5">
                    {details.investments.map((investment) => (
                      <article
                        className="rounded-2xl border border-[var(--color-border)] bg-[#f8faf9] p-4 sm:p-5"
                        key={investment.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.62rem] font-extrabold tracking-[0.1em] text-[var(--color-brand-hover)] uppercase">
                              {investment.plan.risk} risk · {investment.plan.horizonDays} days
                            </p>
                            <h4 className="mt-1 text-base font-extrabold text-[var(--color-ink)]">
                              {investment.plan.name}
                            </h4>
                          </div>
                          <span className={cn(
                            "rounded-full px-3 py-1.5 text-[0.63rem] font-extrabold capitalize",
                            investment.status === "active"
                              ? "bg-[#e5f8ee] text-[#008c4e]"
                              : investment.status === "matured"
                                ? "bg-[#fff6df] text-[#946515]"
                                : investment.status === "completed"
                                  ? "bg-[#e8f0ff] text-[#315ea8]"
                                  : "bg-[#fff0ec] text-[#b74c39]",
                          )}>
                            {investment.status}
                          </span>
                        </div>

                        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-white p-3.5">
                            <dt className="text-[0.59rem] font-extrabold tracking-[0.08em] text-[var(--color-muted)] uppercase">
                              Invested capital
                            </dt>
                            <dd className="mt-1.5 text-sm font-extrabold text-[var(--color-ink)]">
                              ${Number(investment.amountUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </dd>
                            <dd className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
                              {investment.walletAmount} {investment.walletCurrency}
                            </dd>
                          </div>
                          <div className="rounded-xl bg-white p-3.5">
                            <dt className="text-[0.59rem] font-extrabold tracking-[0.08em] text-[var(--color-muted)] uppercase">
                              Profit accrued
                            </dt>
                            <dd className="mt-1.5 text-sm font-extrabold text-[var(--color-brand-hover)]">
                              ${Number(investment.profit.totalAccruedUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </dd>
                            <dd className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
                              ${Number(investment.profit.availableUsd).toFixed(2)} available · ${Number(investment.profit.withdrawnUsd).toFixed(2)} withdrawn
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4">
                          <div className="flex items-center justify-between gap-4 text-[0.66rem] font-bold text-[var(--color-muted)]">
                            <span>Day {investment.daysCompleted} of {investment.plan.horizonDays}</span>
                            <span>{investment.progressPercent}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2ebe7]">
                            <div
                              className="h-full rounded-full bg-[var(--color-brand)]"
                              style={{ width: `${investment.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <dl className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 text-xs sm:grid-cols-2">
                          <div>
                            <dt className="font-semibold text-[var(--color-muted)]">Start date</dt>
                            <dd className="mt-1 font-extrabold text-[var(--color-ink)]">
                              {new Date(investment.startsAt).toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-[var(--color-muted)]">Maturity date</dt>
                            <dd className="mt-1 font-extrabold text-[var(--color-ink)]">
                              {new Date(investment.maturesAt).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                        {investment.capitalReturnedAt && (
                          <p className="mt-4 rounded-xl bg-[#e8f0ff] p-3 text-[0.68rem] font-bold text-[#315ea8]">
                            Capital returned on {new Date(investment.capitalReturnedAt).toLocaleString()}.
                          </p>
                        )}
                        {investment.status !== "cancelled" && (
                          <div className="mt-4 rounded-xl border border-[var(--color-brand)]/20 bg-white p-4">
                            <p className="text-[0.62rem] font-extrabold tracking-[0.09em] text-[var(--color-brand-hover)] uppercase">
                              Credit bonus profit
                            </p>
                            <p className="mt-1 text-[0.67rem] leading-5 font-medium text-[var(--color-muted)]">
                              Added immediately to available profit without changing the daily schedule.
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                              <label className="text-[0.68rem] font-extrabold text-[var(--color-ink)]">
                                Bonus amount (USD)
                                <input
                                  className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-3 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                                  min="0.01"
                                  onChange={(event) => {
                                    setBonusAmounts((current) => ({
                                      ...current,
                                      [investment.id]: event.target.value,
                                    }));
                                    setError("");
                                    setBonusMessage("");
                                  }}
                                  placeholder="0.00"
                                  step="0.01"
                                  type="number"
                                  value={bonusAmounts[investment.id] ?? ""}
                                />
                              </label>
                              <label className="text-[0.68rem] font-extrabold text-[var(--color-ink)]">
                                Note (optional)
                                <input
                                  className="mt-2 h-11 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-3 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                                  maxLength={300}
                                  onChange={(event) => {
                                    setBonusNotes((current) => ({
                                      ...current,
                                      [investment.id]: event.target.value,
                                    }));
                                    setError("");
                                    setBonusMessage("");
                                  }}
                                  placeholder="Reason for this bonus"
                                  value={bonusNotes[investment.id] ?? ""}
                                />
                              </label>
                            </div>
                            <button
                              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-4 text-xs font-extrabold text-white disabled:cursor-wait disabled:opacity-65"
                              disabled={creditingInvestmentId === investment.id}
                              onClick={() => void addBonus(investment.id)}
                              type="button"
                            >
                              {creditingInvestmentId === investment.id ? (
                                <SpinnerGap className="animate-spin" size={16} />
                              ) : (
                                <CurrencyCircleDollar size={17} weight="duotone" />
                              )}
                              {creditingInvestmentId === investment.id
                                ? "Crediting bonus…"
                                : "Add Bonus to Profit"}
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "ledger" && (
              <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5">
                  <div className="flex items-center gap-2">
                    <ClockCounterClockwise
                      className="text-[var(--color-brand-hover)]"
                      size={19}
                    />
                    <h3 className="font-extrabold text-[var(--color-ink)]">
                      Balance ledger
                    </h3>
                  </div>
                </div>
                {details.transactions.length === 0 ? (
                  <p className="p-6 text-sm font-medium text-[var(--color-muted)]">
                    No balance transactions yet.
                  </p>
                ) : (
                  details.transactions.map((transaction) => (
                    <article
                      className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5 last:border-0"
                      key={transaction.id}
                    >
                      <div className="flex gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]">
                          <CurrencyCircleDollar size={20} weight="duotone" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-[var(--color-ink)]">
                            {transaction.description}
                          </p>
                          <p className="mt-1 text-[0.65rem] font-semibold text-[var(--color-muted)]">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[var(--color-brand-hover)]">
                          {transaction.direction === "credit" ? "+" : "−"}
                          {transaction.amount} {transaction.currency}
                        </p>
                        <p className="mt-1 text-[0.62rem] font-semibold text-[var(--color-muted)]">
                          Balance {transaction.balanceAfter} {transaction.currency}
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </section>
            )}

            <section className="mt-5 rounded-[1.5rem] border border-[#efc8c0] bg-[#fff8f6] p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--color-danger)]">
                    Delete client account
                  </h3>
                  <p className="mt-2 text-xs leading-5 font-medium text-[var(--color-muted)]">
                    Access will be revoked immediately. Financial and deposit
                    history will remain available for auditing.
                  </p>
                </div>
                <Trash
                  className="shrink-0 text-[var(--color-danger)]"
                  size={21}
                />
              </div>
              {isConfirmingDelete ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold"
                    disabled={isDeleting}
                    onClick={() => setIsConfirmingDelete(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-danger)] text-xs font-extrabold text-white"
                    disabled={isDeleting}
                    onClick={removeClient}
                    type="button"
                  >
                    {isDeleting ? (
                      <SpinnerGap className="animate-spin" size={16} />
                    ) : (
                      <Trash size={16} />
                    )}
                    {isDeleting ? "Deleting…" : "Confirm deletion"}
                  </button>
                </div>
              ) : (
                <button
                  className="mt-4 rounded-xl border border-[#efc8c0] bg-white px-4 py-2.5 text-xs font-extrabold text-[var(--color-danger)]"
                  onClick={() => setIsConfirmingDelete(true)}
                  type="button"
                >
                  Delete client
                </button>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
