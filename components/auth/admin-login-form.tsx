"use client";

import {
  ArrowRight,
  Eye,
  EyeSlash,
  LockKey,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuthError, signIn } from "@/store/slices/auth-slice";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  email?: string;
  password?: string;
};

export function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error: requestError, isLoading: isSubmitting } = useAppSelector(
    (state) => state.auth,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};

    if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid admin email address.";
    }
    if (password.length < 8) {
      nextErrors.password = "Enter a password with at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    dispatch(clearAuthError());

    try {
      await dispatch(signIn({ email: email.trim(), password })).unwrap();
      router.replace(returnTo);
      router.refresh();
    } catch {
      // The auth slice exposes the API error to the form.
    }
  }

  return (
    <form className="mt-9" noValidate onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-extrabold text-[var(--color-ink)]" htmlFor="admin-email">
          Email address
        </label>
        <input
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="username"
          className="mt-2.5 h-14 w-full rounded-xl border border-[var(--color-border)] bg-[#f7faf8] px-4 text-sm font-bold text-[var(--color-ink)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10"
          id="admin-email"
          inputMode="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
            dispatch(clearAuthError());
          }}
          placeholder="admin@tradeuply.com"
          type="email"
          value={email}
        />
        {errors.email && <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]" id="admin-email-error">{errors.email}</p>}
      </div>

      <div className="mt-5">
        <label className="text-sm font-extrabold text-[var(--color-ink)]" htmlFor="admin-password">
          Password
        </label>
        <div className="relative mt-2.5">
          <input
            aria-describedby={errors.password ? "admin-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className="h-14 w-full rounded-xl border border-[var(--color-border)] bg-[#f7faf8] pr-12 pl-4 text-sm font-bold text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/10"
            id="admin-password"
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
              dispatch(clearAuthError());
            }}
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-[var(--color-muted)] transition hover:bg-slate-100"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeSlash aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
          </button>
        </div>
        {errors.password && <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]" id="admin-password-error">{errors.password}</p>}
      </div>

      {requestError && (
        <div aria-live="polite" className="mt-5 flex gap-3 rounded-xl border border-[#efc9bf] bg-[#fff5f2] p-4 text-[var(--color-danger)]">
          <WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} weight="duotone" />
          <p className="text-xs leading-5 font-semibold">{requestError}</p>
        </div>
      )}

      <button
        className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] px-6 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(6,184,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--color-brand-hover)] disabled:cursor-wait disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Verifying access…" : "Access Admin Panel"}
        {isSubmitting ? <SpinnerGap aria-hidden="true" className="animate-spin" size={19} /> : <ArrowRight aria-hidden="true" size={18} weight="bold" />}
      </button>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--color-brand-soft)] p-4">
        <LockKey aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-brand-hover)]" size={19} weight="duotone" />
        <p className="text-xs leading-5 font-semibold text-[var(--color-ink-soft)]">
          Restricted to authorized TradeUply administrators and super-administrators.
        </p>
      </div>
    </form>
  );
}
