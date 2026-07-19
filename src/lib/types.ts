export type Person = "mama" | "papa" | "juntos";

export type CardKind = "credito" | "debito";

export type Card = {
  id: string;
  name: string;
  lastFour: string;
  color: string;
  owner: Person;
  dueDay: number;
  kind: CardKind;
};

export type Purchase = {
  id: string;
  description: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  cardId: string;
  boughtBy: Person;
  /** Primer mes de cuota en formato YYYY-MM */
  startMonth: string;
  /** Día del mes en que se paga cada cuota (1-28) */
  paymentDay: number;
  createdAt: string;
  notes?: string;
};

export type PaymentMark = {
  purchaseId: string;
  installmentNumber: number;
  paidAt: string;
};

export type Household = {
  mamaName: string;
  papaName: string;
};

export type AppData = {
  version: 1;
  household: Household;
  cards: Card[];
  purchases: Purchase[];
  payments: PaymentMark[];
};

export type MonthInstallment = {
  purchase: Purchase;
  card: Card;
  installmentNumber: number;
  amount: number;
  month: string;
  paid: boolean;
  isLast: boolean;
  paymentDay: number;
};
