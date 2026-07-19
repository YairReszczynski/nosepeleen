"use client";

import Link from "next/link";
import { useTutorial } from "@/components/TutorialProvider";

export function HelpChip() {
  const { openTutorial } = useTutorial();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={openTutorial}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] underline underline-offset-2"
      >
        <span aria-hidden>?</span>
        Ver tutorial
      </button>
      <Link
        href="/ayuda"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]"
      >
        Guía completa
      </Link>
    </div>
  );
}
