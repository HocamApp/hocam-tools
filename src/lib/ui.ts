/* Ortak sınıflar. Girdi kenarlığı --ink-mid: WCAG 1.4.11 için bileşen
   sınırı en az 3:1 olmalı, --line (1.3:1) bu eşiğin altında kalır. */
export const inputCls =
  "mt-1 block min-h-11 w-full rounded-lg border border-ink-mid bg-surface px-3 py-2 text-base text-ink aria-[invalid=true]:border-error aria-[invalid=true]:border-2";

export const labelCls = "block text-sm font-medium text-ink";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-pink-deep px-5 py-2 text-base font-bold text-white hover:bg-ink";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-ink bg-surface px-5 py-2 text-base font-bold text-ink hover:bg-pink-pale";

/** Kart: beyaz yüzey, ince çizgi. */
export const cardCls = "rounded-2xl border border-line bg-surface";

/** Araç düzeni: girdiler solda, sonuç sağda (masaüstü); telefonda tek sütun. */
export const toolGridCls = "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:items-start xl:gap-10";

/** Sonuç paneli: masaüstünde girdilerin yanında yapışkan durur. İç kaydırma yok: panel
    formdan uzunsa satırı o belirler ve sayfayla birlikte akar, hiçbir kısmı gizli kalmaz. */
export const resultAsideCls = "lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]";
