"use client";

import { FloppyDisk, Plus, SpinnerGap, Trash, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { CustomSelect, type CustomSelectOption } from "@/components/ui/custom-select";
import type { AdminInvestmentPlan } from "@/lib/api/types";
import {
  getInvestmentPlans,
  saveInvestmentPlan,
  type InvestmentPlanPayload,
} from "@/services/investment-plan.service";

const iconOptions: CustomSelectOption<AdminInvestmentPlan["icon"]>[] = [
  { label: "Balanced chart", value: "chart" },
  { label: "Income coins", value: "coins" },
  { label: "Global markets", value: "globe" },
  { label: "Wealth leaf", value: "leaf" },
  { label: "Defensive shield", value: "shield" },
  { label: "Innovation sparkle", value: "sparkle" },
];
const statusOptions: CustomSelectOption<AdminInvestmentPlan["status"]>[] = [
  { label: "Active", value: "active" },
  { label: "Coming soon", value: "coming_soon" },
  { label: "Disabled", value: "disabled" },
];
const initialForm = {
  allocation: "",
  badge: "",
  dailyObjective: "",
  description: "",
  displayOrder: "0",
  features: [""],
  horizonDays: "",
  icon: "chart" as AdminInvestmentPlan["icon"],
  isFeatured: false,
  minimumInvestment: "",
  name: "",
  risk: "",
  slug: "",
  status: "coming_soon" as AdminInvestmentPlan["status"],
};
type FormState = typeof initialForm;

function createSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const inputClass = "mt-2 h-12 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] px-4 text-sm font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10";
const labelClass = "text-xs font-extrabold text-[var(--color-ink)]";

export function InvestmentPlanForm({ planId }: { planId?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(Boolean(planId));
  const [isSaving, setIsSaving] = useState(false);
  const [isSlugEdited, setIsSlugEdited] = useState(Boolean(planId));
  const isEditing = Boolean(planId);

  useEffect(() => {
    if (!planId) return;
    getInvestmentPlans()
      .then(({ plans }) => {
        const plan = plans.find((item) => item.id === planId);
        if (!plan) throw new Error("The requested investment plan could not be found.");
        setForm({
          allocation: plan.allocation,
          badge: plan.badge ?? "",
          dailyObjective: String(plan.dailyObjective),
          description: plan.description,
          displayOrder: String(plan.displayOrder),
          features: plan.features,
          horizonDays: String(plan.horizonDays),
          icon: plan.icon,
          isFeatured: plan.isFeatured,
          minimumInvestment: String(plan.minimumInvestment),
          name: plan.name,
          risk: plan.risk,
          slug: plan.slug,
          status: plan.status,
        });
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [planId]);

  function updateField<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function updateName(name: string) {
    setForm((current) => ({ ...current, name, slug: isSlugEdited ? current.slug : createSlug(name) }));
  }

  function updateFeature(index: number, value: string) {
    setForm((current) => ({
      ...current,
      features: current.features.map((feature, itemIndex) => itemIndex === index ? value : feature),
    }));
  }

  function removeFeature(index: number) {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const features = form.features.map((feature) => feature.trim()).filter(Boolean);
    if (features.length === 0) {
      setError("Add at least one client-facing plan feature.");
      return;
    }
    const payload: InvestmentPlanPayload = {
      allocation: form.allocation.trim(),
      badge: form.badge.trim() || null,
      dailyObjective: Number(form.dailyObjective),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder || 0),
      features,
      horizonDays: Number(form.horizonDays),
      icon: form.icon,
      isFeatured: form.isFeatured,
      minimumInvestment: Number(form.minimumInvestment),
      name: form.name.trim(),
      risk: form.risk.trim(),
      status: form.status,
      ...(!isEditing && { slug: form.slug.trim() }),
    };

    setIsSaving(true);
    try {
      await saveInvestmentPlan(payload, planId);
      router.push("/investment-plans");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The plan could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="mt-8 grid min-h-72 place-items-center rounded-[1.75rem] border border-[var(--color-border)] bg-white text-[var(--color-brand-hover)]"><SpinnerGap className="animate-spin" size={30} /></div>;
  }

  return (
    <form className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={handleSubmit}>
      <div className="grid gap-6">
        {error && <div className="flex items-center justify-between rounded-xl bg-[#fff1ed] p-4 text-xs font-bold text-[var(--color-danger)]"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError("")} type="button"><X size={17} /></button></div>}

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-[var(--color-brand-hover)] uppercase">01 Plan identity</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>Plan name<input className={inputClass} onChange={(event) => updateName(event.target.value)} required value={form.name} /></label>
            <label className={labelClass}>Permanent slug<input className={inputClass} disabled={isEditing} onChange={(event) => { setIsSlugEdited(true); updateField("slug", createSlug(event.target.value)); }} required value={form.slug} /></label>
            <label className={labelClass}>Risk level<input className={inputClass} onChange={(event) => updateField("risk", event.target.value)} placeholder="Moderate" required value={form.risk} /></label>
            <label className={labelClass}>Badge (optional)<input className={inputClass} onChange={(event) => updateField("badge", event.target.value)} placeholder="Most popular" value={form.badge} /></label>
          </div>
          <label className={`${labelClass} mt-5 block`}>Description<textarea className="mt-2 min-h-28 w-full rounded-xl border border-[var(--color-border)] bg-[#f8faf9] p-4 text-sm font-semibold outline-none focus:border-[var(--color-brand)]" maxLength={500} onChange={(event) => updateField("description", event.target.value)} required value={form.description} /></label>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-[var(--color-brand-hover)] uppercase">02 Terms and availability</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>Minimum investment<input className={inputClass} min="0.01" onChange={(event) => updateField("minimumInvestment", event.target.value)} required step="0.01" type="number" value={form.minimumInvestment} /></label>
            <label className={labelClass}>Daily objective %<input className={inputClass} max="100" min="0.01" onChange={(event) => updateField("dailyObjective", event.target.value)} required step="0.01" type="number" value={form.dailyObjective} /></label>
            <label className={labelClass}>Horizon days<input className={inputClass} min="1" onChange={(event) => updateField("horizonDays", event.target.value)} required type="number" value={form.horizonDays} /></label>
            <label className={labelClass}>Display order<input className={inputClass} min="0" onChange={(event) => updateField("displayOrder", event.target.value)} type="number" value={form.displayOrder} /></label>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2"><label className={labelClass}>Status<CustomSelect className="mt-2" ariaLabel="Plan status" onChange={(value) => updateField("status", value)} options={statusOptions} value={form.status} /></label><label className={labelClass}>Card icon<CustomSelect className="mt-2" ariaLabel="Plan card icon" onChange={(value) => updateField("icon", value)} options={iconOptions} value={form.icon} /></label></div>
          <label className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[#f8faf9] p-4 text-sm font-extrabold text-[var(--color-ink)]"><input checked={form.isFeatured} className="size-4 accent-[var(--color-brand)]" onChange={(event) => updateField("isFeatured", event.target.checked)} type="checkbox" /> Feature this plan with premium card styling</label>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 sm:p-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-[var(--color-brand-hover)] uppercase">03 Strategy presentation</p>
          <label className={`${labelClass} mt-6 block`}>Strategy allocation<input className={inputClass} onChange={(event) => updateField("allocation", event.target.value)} placeholder="Global equities · Bonds · Cash" required value={form.allocation} /></label>
          <div className="mt-6 flex items-center justify-between"><p className={labelClass}>Client-facing features</p><button className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--color-brand-hover)] disabled:opacity-40" disabled={form.features.length >= 6} onClick={() => updateField("features", [...form.features, ""])} type="button"><Plus size={16} /> Add feature</button></div>
          <div className="mt-3 grid gap-3">{form.features.map((feature, index) => <div className="flex gap-2" key={index}><input aria-label={`Feature ${index + 1}`} className={`${inputClass} mt-0`} maxLength={120} onChange={(event) => updateFeature(index, event.target.value)} required value={feature} /><button aria-label={`Remove feature ${index + 1}`} className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#efc8c0] text-[var(--color-danger)] disabled:opacity-40" disabled={form.features.length === 1} onClick={() => removeFeature(index)} type="button"><Trash size={17} /></button></div>)}</div>
        </section>
      </div>

      <aside className="h-fit rounded-[1.6rem] bg-[var(--color-ink)] p-6 text-white xl:sticky xl:top-28">
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#67e4a7] uppercase">Plan preview</p>
        <h2 className="mt-5 text-2xl font-extrabold">{form.name || "Untitled plan"}</h2>
        <p className="mt-2 text-xs font-bold text-white/45">{form.slug || "plan-slug"}</p>
        <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[0.07] p-4"><p className="text-[0.62rem] font-extrabold text-white/40 uppercase">Daily objective</p><p className="mt-2 font-extrabold text-[#67e4a7]">{form.dailyObjective || "0"}%</p></div><div className="rounded-xl bg-white/[0.07] p-4"><p className="text-[0.62rem] font-extrabold text-white/40 uppercase">Horizon</p><p className="mt-2 font-extrabold">{form.horizonDays || "0"} days</p></div></div>
        <p className="mt-5 text-sm leading-6 font-medium text-white/60">{form.description || "Your client-facing plan description will appear here."}</p>
        <button className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] text-sm font-extrabold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? <SpinnerGap className="animate-spin" size={18} /> : <FloppyDisk size={18} />}{isSaving ? "Saving plan…" : isEditing ? "Save changes" : "Create plan"}</button>
      </aside>
    </form>
  );
}
