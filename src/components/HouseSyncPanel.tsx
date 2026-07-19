"use client";

import { useFinance } from "@/context/FinanceContext";

/** Chip compacto de estado de sync — sin caja enorme. */
export function HouseSyncPanel() {
  const { cloudEnabled, syncStatus, retrySync } = useFinance();

  if (!cloudEnabled) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Agenda solo en este teléfono por ahora.
      </p>
    );
  }

  if (syncStatus === "error") {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-[var(--accent-hot)]">Sin conexión a la agenda</p>
        <button
          type="button"
          className="font-semibold text-[var(--ink)] underline underline-offset-2"
          onClick={retrySync}
        >
          Reconectar
        </button>
      </div>
    );
  }

  if (syncStatus === "connecting") {
    return (
      <p className="text-sm text-[var(--muted)]">Conectando agenda…</p>
    );
  }

  if (syncStatus === "synced") {
    return (
      <p className="text-sm text-[var(--mint)]">
        Agenda compartida activa · los dos ven lo mismo
      </p>
    );
  }

  return null;
}
