"use client";

import { useFinance } from "@/context/FinanceContext";

/** Solo muestra el estado: la agenda se sincroniza sola, sin códigos. */
export function HouseSyncPanel() {
  const { cloudEnabled, syncStatus, retrySync } = useFinance();

  if (!cloudEnabled) {
    return (
      <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white/40 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Agenda compartida
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted)]">
          La nube todavía no está conectada. Cuando Firebase esté listo, Pamela
          e Itae van a ver lo mismo automáticamente en los dos teléfonos.
        </p>
      </section>
    );
  }

  const label =
    syncStatus === "synced"
      ? "Agenda compartida activa ✓"
      : syncStatus === "connecting"
        ? "Conectando la agenda…"
        : syncStatus === "error"
          ? "Sin conexión — revisen internet"
          : "Preparando…";

  const detail =
    syncStatus === "synced"
      ? "Lo que agregue Pamela lo ve Itae, y al revés. No hay que hacer nada más."
      : syncStatus === "error"
        ? "Los cambios se guardan en este teléfono. Toquen Reconectar cuando haya internet."
        : "Un segundo…";

  return (
    <section className="space-y-2 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Agenda de los dos
      </h2>
      <p className="text-sm font-bold text-[var(--mint)]">{label}</p>
      <p className="text-[15px] leading-relaxed text-[var(--muted)]">{detail}</p>
      {syncStatus === "error" && (
        <button
          type="button"
          className="btn btn-accent w-full text-sm"
          onClick={retrySync}
        >
          Reconectar
        </button>
      )}
    </section>
  );
}
