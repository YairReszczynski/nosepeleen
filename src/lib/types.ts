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
  /** Quién la cargó en la app (Pamela / Itae) */
  addedBy?: Exclude<Person, "juntos">;
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
  /** Quién la cargó en la app */
  addedBy?: Exclude<Person, "juntos">;
};

export type PaymentMark = {
  purchaseId: string;
  installmentNumber: number;
  paidAt: string;
  /** Quién marcó el pago */
  markedBy?: Exclude<Person, "juntos">;
};

export type Household = {
  mamaName: string;
  papaName: string;
};

export type AppData = {
  version: 1;
  /** ISO timestamp — última escritura gana en sync */
  updatedAt: string;
  household: Household;
  cards: Card[];
  purchases: Purchase[];
  payments: PaymentMark[];
  /** IDs borrados: no deben reaparecer aunque llegue data vieja */
  deletedCardIds: string[];
  deletedPurchaseIds: string[];
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
  markedBy?: Exclude<Person, "juntos">;
};
