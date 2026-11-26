import { cardCls } from "@/lib/ui";

/** Masaüstünde sonuç sütunu boşken gösterilen yer tutucu; telefonda gizli (sonuç formun altında çıkar). */
export function ResultPlaceholder({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div aria-hidden="true" className={`${cardCls} hidden border-dashed p-6 lg:block`}>
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-ink-mid">Sonuç</p>
      <p className="mt-2 text-xl font-bold leading-snug">{title}</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-ink-mid">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-bold text-ink">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
