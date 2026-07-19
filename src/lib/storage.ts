import type { AppData, Card, Household, Purchase, PaymentMark } from "./types";

export const STORAGE_KEY = "nosepeleen-v1";
export const EPOCH_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export const CARD_COLORS = [
  "#1a2744",
  "#e85d4c",
  "#2a9d8f",
  "#e9c46a",
  "#7b2cbf",
  "#264653",
  "#f4a261",
  "#2d6a4f",
];

export const defaultHousehold: Household = {
  mamaName: "Pamela",
  papaName: "Itae",
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createDefaultData(): AppData {
  return {
    version: 1,
    // Epoch: un teléfono nuevo NO debe pisar la nube por tener "ahora"
    updatedAt: EPOCH_UPDATED_AT,
    household: { ...defaultHousehold },
    cards: [],
    purchases: [],
    payments: [],
  };
}

function clampDay(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(28, Math.max(1, Math.round(n)));
}

export function normalizeAppData(raw: Partial<AppData> | null | undefined): AppData {
  const base = createDefaultData();
  if (!raw || raw.version !== 1) return base;

  const household = { ...defaultHousehold, ...raw.household };
  if (household.mamaName === "Mamá") household.mamaName = "Pamela";
  if (household.papaName === "Papá") household.papaName = "Itae";

  const cards: Card[] = (raw.cards ?? []).map((c) => ({
    ...c,
    kind: c.kind === "debito" ? ("debito" as const) : ("credito" as const),
  }));

  const purchases: Purchase[] = (raw.purchases ?? []).map((p) => {
    const next: Purchase = {
      ...p,
      paymentDay: clampDay(
        typeof p.paymentDay === "number" ? p.paymentDay : 10,
      ),
    };
    if (!p.notes) delete (next as { notes?: string }).notes;
    if (!p.addedBy) delete (next as { addedBy?: Purchase["addedBy"] }).addedBy;
    return next;
  });

  const payments: PaymentMark[] = (raw.payments ?? []).map((pay) => {
    const next: PaymentMark = { ...pay };
    if (!pay.markedBy) {
      delete (next as { markedBy?: PaymentMark["markedBy"] }).markedBy;
    }
    return next;
  });

  return {
    version: 1,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt
        ? raw.updatedAt
        : EPOCH_UPDATED_AT,
    household,
    cards,
    purchases,
    payments,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    return normalizeAppData(JSON.parse(raw) as AppData);
  } catch {
    return createDefaultData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): AppData {
  const parsed = JSON.parse(json) as AppData;
  if (!parsed || parsed.version !== 1) {
    throw new Error("Archivo inválido");
  }
  return normalizeAppData(parsed);
}

export function suggestCardColor(existing: Card[]): string {
  const used = new Set(existing.map((c) => c.color));
  return CARD_COLORS.find((c) => !used.has(c)) ?? CARD_COLORS[0];
}
