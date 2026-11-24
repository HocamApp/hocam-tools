/* Ortak sınıflar (v3, 24 Kasım 2026). Girdi kenarlığı --ink-mid: WCAG 1.4.11
   için bileşen sınırı en az 3:1 olmalı, --line (1.3:1) bu eşiğin altında kalır.
   Girdi kâğıt dolgulu ve 16 px (iOS yakınlaştırmaz); düğmeler hap biçiminde.
   Ana düğme --pink-deep: beyaz metin parlak --pink üstünde 4,05:1 kalır
   (16 px kalın büyük metin sayılmaz), --pink-deep 4,5:1'i geçer (axe, §4). */
export const inputCls =
  "mt-1 block min-h-12 w-full rounded-[14px] border-[1.5px] border-ink-mid bg-paper px-3.5 py-2 text-base text-ink aria-[invalid=true]:border-error aria-[invalid=true]:border-2";

export const labelCls = "block text-sm font-medium text-ink";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-pink-deep px-5 py-2 text-base font-bold text-white hover:bg-plum";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-plum bg-surface px-5 py-2 text-base font-bold text-ink hover:bg-paper";

/** Plum bant üstündeki ana eylem: sarı dolgu, mürekkep metin. */
export const btnOnPlum =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-yellow px-5 py-2 text-base font-bold text-ink hover:bg-surface";

/** Açık zemindeki küçük etiket (eskiden sarı): plum. */
export const chipCls = "inline-block rounded-full bg-plum px-3 py-1 text-xs font-bold text-on-plum";

/** Seçili / seçilmemiş geçiş düğmesi kenarı ve dolgusu. */
export const toggleOn = "border-plum bg-plum text-on-plum";
export const toggleOff = "border-line bg-surface text-ink hover:border-plum";
