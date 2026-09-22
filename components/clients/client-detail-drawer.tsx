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
  getClientDetails,
  updateClient,
  type ClientUpdatePayload,
} from "@/services/client-management.service";

const tabs = ["overview", "deposits", "ledger"] as const;
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
                    Available
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {details.balance.availableBalance}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-white/38">USDT</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[0.59rem] font-extrabold tracking-[0.08em] text-white/38 uppercase">
                    Deposited
                  </p>
                  <p className="mt-2 text-base font-extrabold">
                    {details.balance.totalDeposited}
                  </p>
                  <p className="mt-0.5 text-[0.62rem] text-white/38">USDT</p>
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
                        <option>$100–$999</option>
                        <option>$1,000–$4,999</option>
                        <option>$5,000–$24,999</option>
                        <option>$25,000+</option>
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
                    All submitted USDT deposits for this client.
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
                            {deposit.amount} USDT
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
                          +{transaction.amount}
                        </p>
                        <p className="mt-1 text-[0.62rem] font-semibold text-[var(--color-muted)]">
                          Balance {transaction.balanceAfter}
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
