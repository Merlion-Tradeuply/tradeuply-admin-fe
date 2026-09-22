"use client";

import {
  Bank,
  Check,
  CheckCircle,
  CreditCard,
  CurrencyCircleDollar,
  FloppyDisk,
  ImageSquare,
  SpinnerGap,
  UploadSimple,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { AdminPaymentMethod } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  getPaymentMethods,
  savePaymentMethod,
  type PaymentMethodPayload,
} from "@/services/payment-method.service";
import { uploadPaymentMethodQrCode } from "@/services/upload.service";
import type { QrUploadStage } from "@/services/upload.service";

const maximumQrImageBytes = 4 * 1024 * 1024;

const categories = [
  {
    description: "Debit and credit card providers",
    icon: CreditCard,
    label: "Card",
    value: "card",
  },
  {
    description: "Mobile and digital wallets",
    icon: Wallet,
    label: "Digital wallet",
    value: "wallet",
  },
  {
    description: "Bank and regional transfers",
    icon: Bank,
    label: "Bank",
    value: "bank",
  },
  {
    description: "Blockchain-based payments",
    icon: CurrencyCircleDollar,
    label: "Cryptocurrency",
    value: "crypto",
  },
] as const;

const initialForm = {
  asset: "",
  category: "crypto" as AdminPaymentMethod["category"],
  code: "",
  displayOrder: "0",
  instructions: "",
  maximumAmount: "",
  minimumAmount: "",
  name: "",
  network: "",
  status: "coming_soon" as AdminPaymentMethod["status"],
  walletAddress: "",
};

type FormState = typeof initialForm;

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function getProcessingLabels(category: AdminPaymentMethod["category"]) {
  if (category === "crypto") {
    return {
      asset: "Asset symbol",
      network: "Blockchain network",
      wallet: "Receiving wallet address",
    };
  }
  if (category === "bank") {
    return {
      asset: "Settlement currency",
      network: "Payment rail or region",
      wallet: "Destination account reference",
    };
  }
  if (category === "wallet") {
    return {
      asset: "Settlement currency",
      network: "Provider or payment rail",
      wallet: "Merchant or account reference",
    };
  }
  return {
    asset: "Settlement currency",
    network: "Processor or card network",
    wallet: "Merchant reference",
  };
}

export function PaymentMethodForm({ methodId }: { methodId?: string }) {
  const router = useRouter();
  const [currentMethodId, setCurrentMethodId] = useState(methodId);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isCodeEdited, setIsCodeEdited] = useState(Boolean(methodId));
  const [isLoading, setIsLoading] = useState(Boolean(methodId));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<QrUploadStage>("preparing");
  const [isUploading, setIsUploading] = useState(false);
  const isEditing = Boolean(currentMethodId);
  const labels = getProcessingLabels(form.category);

  useEffect(() => {
    if (!methodId) return;

    getPaymentMethods()
      .then((methods) => {
        const method = methods.find((item) => item.id === methodId);
        if (!method)
          throw new Error("The requested payment method could not be found.");

        setForm({
          asset: method.asset ?? "",
          category: method.category,
          code: method.code,
          displayOrder: String(method.displayOrder),
          instructions: method.instructions,
          maximumAmount:
            method.maximumAmount === null ? "" : String(method.maximumAmount),
          minimumAmount:
            method.minimumAmount === null ? "" : String(method.minimumAmount),
          name: method.name,
          network: method.network ?? "",
          status: method.status,
          walletAddress: method.walletAddress ?? "",
        });
        setQrCodeUrl(method.qrCodeUrl);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [methodId]);

  const completionItems = useMemo(
    () => [
      { complete: Boolean(form.name && form.code), label: "Identity and code" },
      { complete: Boolean(form.category), label: "Payment category" },
      {
        complete:
          form.category !== "crypto" ||
          Boolean(form.asset && form.network && form.walletAddress),
        label: "Processing configuration",
      },
      { complete: Boolean(form.instructions), label: "Client instructions" },
      {
        complete: form.category !== "crypto" || Boolean(qrCodeUrl),
        label: "Cryptocurrency wallet QR asset",
      },
    ],
    [form, qrCodeUrl],
  );

  function updateField<Field extends keyof FormState>(
    field: Field,
    value: FormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  }

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      code: isCodeEdited ? current.code : createSlug(name),
      name,
    }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const minimumAmount = form.minimumAmount
      ? Number(form.minimumAmount)
      : null;
    const maximumAmount = form.maximumAmount
      ? Number(form.maximumAmount)
      : null;

    if (
      minimumAmount !== null &&
      maximumAmount !== null &&
      maximumAmount < minimumAmount
    ) {
      setError(
        "Maximum amount must be greater than or equal to the minimum amount.",
      );
      return;
    }

    const payload: PaymentMethodPayload = {
      asset: form.asset.trim() || null,
      category: form.category,
      displayOrder: Number(form.displayOrder || 0),
      instructions: form.instructions.trim(),
      maximumAmount,
      minimumAmount,
      name: form.name.trim(),
      network: form.network.trim() || null,
      status: form.status,
      walletAddress: form.walletAddress.trim() || null,
      ...(!isEditing && { code: form.code.trim() }),
    };

    setIsSaving(true);

    try {
      const method = await savePaymentMethod(payload, currentMethodId);
      setCurrentMethodId(method.id);
      setQrCodeUrl(method.qrCodeUrl);
      setIsCodeEdited(true);
      setMessage(
        isEditing
          ? "Payment method updated successfully."
          : "Payment method created successfully. You can now add any required QR asset.",
      );

      if (!isEditing) {
        router.replace(`/manage-payment-methods?id=${method.id}`);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The payment method could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadQrCode(file?: File) {
    if (!file || !currentMethodId) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Select a PNG, JPEG, or WebP QR code image.");
      return;
    }
    if (file.size > maximumQrImageBytes) {
      setError("The QR code image must be 4 MB or smaller.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage("preparing");
    setError("");
    setMessage("");

    try {
      const method = await uploadPaymentMethodQrCode({
        file,
        methodId: currentMethodId,
        onProgress: ({ percentage, stage }) => {
          setUploadProgress(percentage);
          setUploadStage(stage);
        },
      });
      setQrCodeUrl(method.qrCodeUrl);
      setMessage("The receiving-wallet QR code was uploaded successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The QR image could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 grid min-h-80 place-items-center rounded-[1.7rem] border border-[var(--color-border)] bg-white text-[var(--color-brand-hover)]">
        <SpinnerGap className="animate-spin" size={30} />
      </div>
    );
  }

  return (
    <form
      className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-6">
        {error && (
          <div className="flex gap-3 rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]">
            <WarningCircle className="shrink-0" size={19} />
            {error}
          </div>
        )}
        {message && (
          <div className="flex gap-3 rounded-xl bg-[var(--color-brand-soft)] p-4 text-xs font-bold text-[var(--color-brand-hover)]">
            <CheckCircle className="shrink-0" size={19} weight="fill" />
            {message}
          </div>
        )}

        <section className="rounded-[1.7rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_18px_55px_rgba(18,45,72,0.055)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-hover)]">
              01
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                Method identity
              </h2>
              <p className="mt-1 text-xs leading-5 font-medium text-[var(--color-muted)]">
                Choose a clear client-facing name and a permanent internal code.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              Display name
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                maxLength={80}
                onChange={(event) => updateName(event.target.value)}
                placeholder="e.g. USDT (Tether)"
                required
                value={form.name}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              Method code
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:bg-[#eef2f0] disabled:text-[var(--color-muted)]"
                disabled={isEditing}
                maxLength={40}
                onChange={(event) => {
                  setIsCodeEdited(true);
                  updateField("code", createSlug(event.target.value));
                }}
                pattern="[a-z0-9-]+"
                placeholder="usdt"
                required
                value={form.code}
              />
              <span className="mt-2 block text-[0.66rem] font-semibold text-[var(--color-muted)]">
                Lowercase letters, numbers, and hyphens. It cannot change after
                creation.
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_18px_55px_rgba(18,45,72,0.055)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-hover)]">
              02
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                Category and availability
              </h2>
              <p className="mt-1 text-xs leading-5 font-medium text-[var(--color-muted)]">
                The category controls which configuration labels and client
                expectations apply.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map(({ description, icon: Icon, label, value }) => {
              const selected = form.category === value;
              return (
                <button
                  className={cn(
                    "flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition",
                    selected
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--color-border)] bg-[#fafcfb] hover:border-[var(--color-brand)]/45",
                  )}
                  key={value}
                  onClick={() => updateField("category", value)}
                  type="button"
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      selected
                        ? "bg-white text-[var(--color-brand-hover)]"
                        : "bg-[#edf3f0] text-[var(--color-muted)]",
                    )}
                  >
                    <Icon size={22} weight="duotone" />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-[var(--color-ink)]">
                      {label}
                    </span>
                    <span className="mt-1 block text-[0.67rem] font-semibold text-[var(--color-muted)]">
                      {description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <p className="text-xs font-extrabold text-[var(--color-ink)]">
              Availability status
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["active", "coming_soon", "disabled"] as const).map(
                (status) => (
                  <button
                    className={cn(
                      "min-h-12 rounded-xl border px-4 text-xs font-extrabold transition",
                      form.status === status
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-hover)]"
                        : "border-[var(--color-border)] bg-[#fafcfb] text-[var(--color-muted)]",
                    )}
                    key={status}
                    onClick={() => updateField("status", status)}
                    type="button"
                  >
                    {status === "coming_soon"
                      ? "Coming soon"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_18px_55px_rgba(18,45,72,0.055)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-hover)]">
              03
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                Processing configuration
              </h2>
              <p className="mt-1 text-xs leading-5 font-medium text-[var(--color-muted)]">
                Fields adapt to the selected category. Leave optional values
                empty when they do not apply.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              {labels.asset}
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                maxLength={20}
                onChange={(event) =>
                  updateField("asset", event.target.value.toUpperCase())
                }
                placeholder={form.category === "crypto" ? "USDT" : "USD"}
                value={form.asset}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              {labels.network}
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                maxLength={40}
                onChange={(event) => updateField("network", event.target.value)}
                placeholder={form.category === "crypto" ? "TRC20" : "Optional"}
                value={form.network}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)] sm:col-span-2">
              {labels.wallet}
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[#f8faf9] p-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                maxLength={200}
                onChange={(event) =>
                  updateField("walletAddress", event.target.value)
                }
                placeholder="Optional destination or provider reference"
                value={form.walletAddress}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              Minimum amount
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                min="0.00000001"
                onChange={(event) =>
                  updateField("minimumAmount", event.target.value)
                }
                placeholder="No minimum"
                step="0.00000001"
                type="number"
                value={form.minimumAmount}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              Maximum amount
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                min="0.00000001"
                onChange={(event) =>
                  updateField("maximumAmount", event.target.value)
                }
                placeholder="No maximum"
                step="0.00000001"
                type="number"
                value={form.maximumAmount}
              />
            </label>
            <label className="text-xs font-extrabold text-[var(--color-ink)]">
              Display order
              <input
                className="mt-2 h-13 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-bold outline-none focus:border-[var(--color-brand)]"
                min="0"
                onChange={(event) =>
                  updateField("displayOrder", event.target.value)
                }
                required
                type="number"
                value={form.displayOrder}
              />
            </label>
          </div>
          <label className="mt-5 block text-xs font-extrabold text-[var(--color-ink)]">
            Client instructions
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[#f8faf9] p-4 text-sm leading-6 font-medium outline-none focus:border-[var(--color-brand)]"
              maxLength={1000}
              onChange={(event) =>
                updateField("instructions", event.target.value)
              }
              placeholder="Explain how clients should use this payment method, supported networks, and important warnings."
              value={form.instructions}
            />
            <span className="mt-2 block text-right text-[0.65rem] font-semibold text-[var(--color-muted)]">
              {form.instructions.length}/1000
            </span>
          </label>
        </section>

        {form.category === "crypto" && (
          <section className="rounded-[1.7rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_18px_55px_rgba(18,45,72,0.055)] sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-soft)] text-sm font-extrabold text-[var(--color-brand-hover)]">
                04
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-[var(--color-ink)]">
                  Cryptocurrency wallet QR asset
                </h2>
                <p className="mt-1 text-xs leading-5 font-medium text-[var(--color-muted)]">
                  Create the method first, then upload the QR image shown in the
                  client deposit flow.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[#f8faf9] p-5 sm:flex-row sm:items-center">
              <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                {qrCodeUrl ? (
                  <Image
                    alt={`${form.name || form.asset || "Cryptocurrency"} wallet QR code`}
                    className="size-full object-contain p-2"
                    height={260}
                    src={qrCodeUrl}
                    width={260}
                  />
                ) : (
                  <ImageSquare
                    className="text-[var(--color-muted)]"
                    size={34}
                    weight="duotone"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-[var(--color-ink)]">
                  PNG, JPEG, or WebP · maximum 4 MB
                </p>
                <p className="mt-2 text-[0.68rem] leading-5 font-semibold text-[var(--color-muted)]">
                  Use a clear, square QR code generated for the receiving wallet
                  and selected network.
                </p>
                <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--color-brand-soft)] px-4 text-xs font-extrabold text-[var(--color-brand-hover)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45">
                  <UploadSimple size={17} weight="bold" />
                  {qrCodeUrl ? "Replace QR image" : "Upload QR image"}
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={!currentMethodId || isUploading}
                    onChange={(event) => {
                      void uploadQrCode(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                {!currentMethodId && (
                  <p className="mt-2 text-[0.65rem] font-bold text-[#9b6a08]">
                    Save this method before uploading its QR image.
                  </p>
                )}
              </div>
            </div>
            {isUploading && (
              <div className="mt-4" aria-live="polite">
                <div className="flex justify-between text-[0.68rem] font-bold text-[var(--color-muted)]">
                  <span>
                    {uploadStage === "preparing"
                      ? "Preparing secure upload…"
                      : uploadStage === "saving"
                        ? "Verifying and saving…"
                        : `Uploading to Cloudinary ${uploadProgress}%`}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  aria-label="QR image upload progress"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={uploadProgress}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-[#dce8e2]"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-brand)] transition-[width]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="sticky top-28 rounded-[1.7rem] bg-[var(--color-ink)] p-6 text-white shadow-[0_24px_65px_rgba(3,26,59,0.18)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.16em] text-[#67e4a7] uppercase">
          Configuration preview
        </p>
        <h2 className="mt-4 text-xl font-extrabold">
          {form.name || "Untitled payment method"}
        </h2>
        <p className="mt-1 text-xs font-bold text-white/45">
          {form.code || "method-code"}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-[0.66rem] font-extrabold capitalize">
            {form.category}
          </span>
          <span className="rounded-full bg-[#67e4a7]/12 px-3 py-1.5 text-[0.66rem] font-extrabold text-[#67e4a7]">
            {form.status === "coming_soon" ? "Coming soon" : form.status}
          </span>
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[0.65rem] font-extrabold tracking-[0.12em] text-white/38 uppercase">
            Readiness
          </p>
          <ul className="mt-4 space-y-3">
            {completionItems.map((item) => (
              <li
                className="flex items-center gap-3 text-xs font-bold"
                key={item.label}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full",
                    item.complete
                      ? "bg-[#67e4a7] text-[var(--color-ink)]"
                      : "border border-white/16 text-white/25",
                  )}
                >
                  {item.complete && <Check size={12} weight="bold" />}
                </span>
                <span
                  className={item.complete ? "text-white/82" : "text-white/38"}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="mt-7 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-5 text-sm font-extrabold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
          disabled={isSaving || isUploading}
          type="submit"
        >
          {isSaving ? (
            <SpinnerGap className="animate-spin" size={18} />
          ) : (
            <FloppyDisk size={18} weight="duotone" />
          )}
          {isSaving ? "Saving…" : isEditing ? "Save changes" : "Create method"}
        </button>
        <p className="mt-4 text-center text-[0.63rem] leading-5 font-semibold text-white/38">
          Active methods can be exposed to clients only when their required
          processing details are configured.
        </p>
      </aside>
    </form>
  );
}
