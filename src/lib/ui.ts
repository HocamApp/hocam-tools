/* Ortak sınıflar. Girdi kenarlığı --ink-mid: WCAG 1.4.11 için bileşen
   sınırı en az 3:1 olmalı, --line (1.3:1) bu eşiğin altında kalır. */
export const inputCls =
  "mt-1 block min-h-11 w-full rounded-lg border border-ink-mid bg-surface px-3 py-2 text-base text-ink aria-[invalid=true]:border-error aria-[invalid=true]:border-2";

export const labelCls = "block text-sm font-medium text-ink";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-pink-deep px-5 py-2 text-base font-bold text-white hover:bg-ink";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-ink bg-surface px-5 py-2 text-base font-bold text-ink hover:bg-pink-pale";
