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
          <main className="relative z-10 px-4 pb-28 pt-5">{children}</main>
          <BottomNav />
        </div>
      </TutorialProvider>
    </FinanceProvider>
  );
}
