"use client";

import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { TutorialProvider } from "@/components/TutorialProvider";
import { BottomNav } from "@/components/BottomNav";
import { WhoAmIGate } from "@/components/WhoAmIGate";
import { personLabel } from "@/lib/finance";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { data, currentUser, setCurrentUser } = useFinance();

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-lg">
      <div className="atmosphere" aria-hidden />
      <main className="relative z-10 px-4 pb-28 pt-5">
        {currentUser && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              Como{" "}
              <span className="font-semibold text-[var(--ink)]">
                {personLabel(currentUser, data.household)}
              </span>
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
              onClick={() => {
                const other = currentUser === "mama" ? "papa" : "mama";
                if (
                  confirm(
                    `¿Cambiar a ${personLabel(other, data.household)}?`,
                  )
                ) {
                  setCurrentUser(other);
                }
              }}
            >
              Cambiar
            </button>
          </div>
        )}
        {children}
        <footer className="mt-12 mb-2 px-2 text-center">
          <p className="font-[family-name:var(--font-display)] text-[15px] font-bold leading-snug text-[var(--ink)]">
            Los amo mucho.
            <br />
            No se peleen por tonteras.
          </p>
          <p className="mt-2 text-xs font-semibold tracking-wide text-[var(--muted)]">
            — de parte de Yair ♥
          </p>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <WhoAmIGate>
        <TutorialProvider>
          <ShellInner>{children}</ShellInner>
        </TutorialProvider>
      </WhoAmIGate>
    </FinanceProvider>
  );
}
