type Props = {
  name: string;
  lastFour: string;
  color: string;
  ownerLabel: string;
  dueDay?: number;
  kind?: "credito" | "debito";
  compact?: boolean;
  onRemove?: () => void;
};

export function CardVisual({
  name,
  lastFour,
  color,
  ownerLabel,
  dueDay,
  kind = "credito",
  compact,
  onRemove,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white shadow-[0_12px_30px_-12px_rgba(26,39,68,0.45)] ${
        compact ? "p-4" : "p-5"
      }`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -25)} 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-black/10"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            {name}
          </p>
          <p className="mt-1 text-xs text-white/75">
            {ownerLabel} · {kind === "debito" ? "Débito" : "Crédito"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
            •• {lastFour}
          </span>
          {onRemove && (
            <button
              type="button"
              aria-label={`Quitar ${name}`}
              className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-white/90 transition hover:bg-black/40"
              onClick={onRemove}
            >
              Quitar
            </button>
          )}
        </div>
      </div>
      {!compact && dueDay != null && (
        <p className="relative mt-5 text-xs text-white/80">
          {kind === "debito" ? "Día de pago" : "Vence el día"}{" "}
          <span className="font-semibold text-white">{dueDay}</span>
        </p>
      )}
    </div>
  );
}

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
