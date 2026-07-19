"use client";

import { FinanceProvider } from "@/context/FinanceContext";
import { TutorialProvider } from "@/components/TutorialProvider";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <TutorialProvider>
        <div className="relative mx-auto min-h-dvh w-full max-w-lg">
          <div className="atmosphere" aria-hidden />
          <main className="relative z-10 px-4 pb-28 pt-5">
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
      </TutorialProvider>
    </FinanceProvider>
  );
}
