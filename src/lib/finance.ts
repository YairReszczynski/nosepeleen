import type {
  AppData,
  Card,
  MonthInstallment,
  PaymentMark,
  Purchase,
} from "./types";

/** Mes actual YYYY-MM en zona local */
export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function addMonths(monthKey: string, offset: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return currentMonthKey(d);
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function personLabel(
  person: "mama" | "papa" | "juntos",
  household: { mamaName: string; papaName: string },
): string {
  if (person === "mama") return household.mamaName;
  if (person === "papa") return household.papaName;
  return "Los dos";
}

export function isPaid(
  payments: PaymentMark[],
  purchaseId: string,
  installmentNumber: number,
): boolean {
  return payments.some(
    (p) =>
      p.purchaseId === purchaseId &&
      p.installmentNumber === installmentNumber,
  );
}

export function getInstallmentsForMonth(
  data: AppData,
  monthKey: string,
): MonthInstallment[] {
  const cardMap = new Map(data.cards.map((c) => [c.id, c]));
  const result: MonthInstallment[] = [];

  for (const purchase of data.purchases) {
    const card = cardMap.get(purchase.cardId);
    if (!card) continue;

    for (let i = 0; i < purchase.installments; i++) {
      const month = addMonths(purchase.startMonth, i);
      if (month !== monthKey) continue;
      const installmentNumber = i + 1;
      result.push({
        purchase,
        card,
        installmentNumber,
        amount: purchase.installmentAmount,
        month,
        paid: isPaid(data.payments, purchase.id, installmentNumber),
        isLast: installmentNumber === purchase.installments,
      });
    }
  }

  return result.sort((a, b) => {
    if (a.card.name !== b.card.name) {
      return a.card.name.localeCompare(b.card.name);
    }
    return a.purchase.description.localeCompare(b.purchase.description);
  });
}

export function groupByCard(
  items: MonthInstallment[],
): { card: Card; items: MonthInstallment[]; total: number; unpaid: number }[] {
  const map = new Map<
    string,
    { card: Card; items: MonthInstallment[]; total: number; unpaid: number }
  >();

  for (const item of items) {
    const existing = map.get(item.card.id);
    if (!existing) {
      map.set(item.card.id, {
        card: item.card,
        items: [item],
        total: item.amount,
        unpaid: item.paid ? 0 : item.amount,
      });
    } else {
      existing.items.push(item);
      existing.total += item.amount;
      if (!item.paid) existing.unpaid += item.amount;
    }
  }

  return Array.from(map.values());
}

export function purchaseProgress(
  purchase: Purchase,
  payments: PaymentMark[],
): { paidCount: number; remaining: number; remainingAmount: number } {
  let paidCount = 0;
  for (let i = 1; i <= purchase.installments; i++) {
    if (isPaid(payments, purchase.id, i)) paidCount++;
  }
  const remaining = purchase.installments - paidCount;
  return {
    paidCount,
    remaining,
    remainingAmount: remaining * purchase.installmentAmount,
  };
}

export function monthTotals(items: MonthInstallment[]) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const unpaid = items
    .filter((i) => !i.paid)
    .reduce((s, i) => s + i.amount, 0);
  const paid = total - unpaid;
  return { total, unpaid, paid, count: items.length };
}

/**
 * Intenta parsear un aviso de la app del banco / notificación / SMS.
 * Ej: "Compra Visa *1234 FARMACIA $45.000 en 6 cuotas"
 */
export function parsePurchaseHint(text: string): Partial<{
  description: string;
  totalAmount: number;
  installments: number;
  lastFour: string;
}> {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const result: Partial<{
    description: string;
    totalAmount: number;
    installments: number;
    lastFour: string;
  }> = {};

  const lastFour =
    cleaned.match(/\*{1,4}\s?(\d{4})/)?.[1] ??
    cleaned.match(/(?:terminada?\s+en|final)\s*(\d{4})/i)?.[1] ??
    cleaned.match(/(?:tarjeta|card|visa|master|amex)\s*[:*]?\s*(\d{4})/i)?.[1];
  if (lastFour) result.lastFour = lastFour;

  const cuotas =
    cleaned.match(/(\d+)\s*(?:cuotas?|cts?|cuota)/i)?.[1] ??
    cleaned.match(/(?:en|de)\s+(\d+)\s*(?:pagos?|cuotas?)/i)?.[1] ??
    cleaned.match(/plan\s+(\d+)/i)?.[1];
  if (cuotas) result.installments = Number(cuotas);

  const moneyMatch =
    cleaned.match(/\$\s*([\d.]+(?:,\d{2})?)/)?.[1] ??
    cleaned.match(/(?:ARS|USD)?\s*([\d.]+(?:,\d{2})?)\s*(?:ARS|pesos)?/i)?.[1];
  if (moneyMatch) {
    const normalized = moneyMatch.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    if (!Number.isNaN(n) && n > 0) result.totalAmount = n;
  }

  const desc =
    cleaned.match(
      /(?:compra|consumo|pago|movimiento)\s+(?:con\s+tarjeta\s+)?(?:en\s+)?([A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .&'-]{3,40})/i,
    )?.[1] ??
    cleaned.match(
      /(?:comercio|en)\s*:?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9 .&'-]{3,40})/i,
    )?.[1];
  if (desc) {
    result.description = desc
      .replace(/\b(visa|mastercard|master|amex|tarjeta)\b/gi, "")
      .replace(/\*+\s*\d{4}/g, "")
      .trim();
  }

  return result;
}
