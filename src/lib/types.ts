export type Person = "mama" | "papa" | "juntos";

export type Card = {
  id: string;
  name: string;
  lastFour: string;
  color: string;
  owner: Person;
  dueDay: number;
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
};
