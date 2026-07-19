"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markTutorialSeen, tutorialSteps } from "@/lib/tutorial";

type Props = {
  onClose?: () => void;
};

export function Tutorial({ onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const current = tutorialSteps[step];
  const isLast = step === tutorialSteps.length - 1;
  const progress = ((step + 1) / tutorialSteps.length) * 100;

  function finish(goTo?: string) {
    markTutorialSeen();
    onClose?.();
    if (goTo) router.push(goTo);
  }

  function next() {
    if (isLast) {
      finish("/tarjetas");
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--ink)]/45 p-3 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="animate-in relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[var(--paper)] shadow-[0_30px_80px_-20px_rgba(26,39,68,0.55)]">
        <div
          className="absolute inset-x-0 top-0 h-1.5 bg-[var(--line)]"
          aria-hidden
        >
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-5 px-6 pb-6 pt-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-hot)]">
              {current.eyebrow}
            </p>
            <p className="text-xs font-semibold text-[var(--muted)]">
              {step + 1} de {tutorialSteps.length}
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--ink)]">
            {step + 1}
          </div>

          <div className="space-y-3">
            <h2
              id="tutorial-title"
              className="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight tracking-tight text-[var(--ink)]"
            >
              {current.title}
            </h2>
            <p className="text-[16px] leading-relaxed text-[var(--ink)]/85">
              {current.body}
            </p>
            {current.tip && (
              <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
                <span className="font-bold text-[var(--mint)]">Tip: </span>
                {current.tip}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              className="btn btn-primary w-full text-base"
              onClick={next}
            >
              {current.cta}
            </button>
            {!isLast && (
              <button
                type="button"
                className="btn btn-ghost w-full text-sm"
                onClick={() => finish()}
              >
                Ya entiendo, saltar
              </button>
            )}
            {isLast && (
              <button
                type="button"
                className="btn btn-ghost w-full text-sm"
                onClick={() => finish("/")}
              >
                Ir al inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
