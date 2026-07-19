"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Card, Household, Purchase } from "@/lib/types";
import {
  createDefaultData,
  createId,
  exportData,
  importData,
  loadData,
  saveData,
  suggestCardColor,
} from "@/lib/storage";
import { currentMonthKey } from "@/lib/finance";
import {
  clearHouseCode,
  loadHouseCode,
  saveHouseCode,
} from "@/lib/houseCode";
import {
  createCloudHousehold,
  fetchCloudHousehold,
  generateHouseCode,
  isFirebaseConfigured,
  normalizeHouseCode,
  saveCloudHousehold,
  subscribeCloudHousehold,
} from "@/lib/firebase";

type SyncStatus = "local" | "connecting" | "synced" | "error" | "offline-cloud";

type FinanceContextValue = {
  ready: boolean;
  data: AppData;
  monthKey: string;
  setMonthKey: (key: string) => void;
  houseCode: string | null;
  syncStatus: SyncStatus;
  cloudEnabled: boolean;
  createHouse: () => Promise<string>;
  joinHouse: (code: string) => Promise<void>;
  leaveHouse: () => void;
  updateHousehold: (h: Partial<Household>) => void;
  addCard: (input: Omit<Card, "id" | "color"> & { color?: string }) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  removeCard: (id: string) => void;
  addPurchase: (
    input: Omit<Purchase, "id" | "createdAt" | "installmentAmount"> & {
      installmentAmount?: number;
      /** Cuotas ya pagadas (ej: van en la 7 → se marcan 1..6) */
      alreadyPaidCount?: number;
    },
  ) => void;
  removePurchase: (id: string) => void;
  togglePayment: (purchaseId: string, installmentNumber: number) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  resetAll: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(createDefaultData);
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [houseCode, setHouseCode] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const applyingRemote = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudEnabled = isFirebaseConfigured();

  useEffect(() => {
    const local = loadData();
    setData(local);
    const code = loadHouseCode();
    setHouseCode(code);
    setReady(true);
  }, []);

  // Persistencia local siempre
  useEffect(() => {
    if (!ready) return;
    saveData(data);
  }, [data, ready]);

  // Suscripción Firestore
  useEffect(() => {
    if (!ready || !houseCode || !cloudEnabled) {
      if (!houseCode) setSyncStatus("local");
      return;
    }

    setSyncStatus("connecting");
    let unsub = () => {};

    try {
      unsub = subscribeCloudHousehold(
        houseCode,
        (remote) => {
          applyingRemote.current = true;
          setData(remote);
          setSyncStatus("synced");
          queueMicrotask(() => {
            applyingRemote.current = false;
          });
        },
        () => setSyncStatus("error"),
      );
    } catch {
      setSyncStatus("error");
    }

    return () => unsub();
  }, [ready, houseCode, cloudEnabled]);

  // Guardar en la nube (debounce)
  useEffect(() => {
    if (!ready || !houseCode || !cloudEnabled) return;
    if (applyingRemote.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCloudHousehold(houseCode, data)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 450);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, houseCode, cloudEnabled]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData(fn);
  }, []);

  const createHouse = useCallback(async () => {
    if (!cloudEnabled) throw new Error("Firebase no configurado");
    const code = generateHouseCode();
    const current = loadData();
    await createCloudHousehold(code, current);
    saveHouseCode(code);
    setHouseCode(code);
    setData(current);
    setSyncStatus("synced");
    return code;
  }, [cloudEnabled]);

  const joinHouse = useCallback(
    async (raw: string) => {
      if (!cloudEnabled) throw new Error("Firebase no configurado");
      const code = normalizeHouseCode(raw);
      if (!code || code.length < 6) {
        throw new Error("Código inválido");
      }
      setSyncStatus("connecting");
      const remote = await fetchCloudHousehold(code);
      if (!remote) {
        setSyncStatus(houseCode ? "synced" : "local");
        throw new Error("No existe una casa con ese código");
      }
      saveHouseCode(code);
      applyingRemote.current = true;
      setHouseCode(code);
      setData(remote);
      setSyncStatus("synced");
      queueMicrotask(() => {
        applyingRemote.current = false;
      });
    },
    [cloudEnabled, houseCode],
  );

  const leaveHouse = useCallback(() => {
    clearHouseCode();
    setHouseCode(null);
    setSyncStatus("local");
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      data,
      monthKey,
      setMonthKey,
      houseCode,
      syncStatus,
      cloudEnabled,
      createHouse,
      joinHouse,
      leaveHouse,
      updateHousehold: (h) =>
        update((prev) => ({
          ...prev,
          household: { ...prev.household, ...h },
        })),
      addCard: (input) =>
        update((prev) => ({
          ...prev,
          cards: [
            ...prev.cards,
            {
              id: createId(),
              name: input.name,
              lastFour: input.lastFour,
              owner: input.owner,
              dueDay: input.dueDay,
              color: input.color ?? suggestCardColor(prev.cards),
            },
          ],
        })),
      updateCard: (id, patch) =>
        update((prev) => ({
          ...prev,
          cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCard: (id) =>
        update((prev) => ({
          ...prev,
          cards: prev.cards.filter((c) => c.id !== id),
          purchases: prev.purchases.filter((p) => p.cardId !== id),
          payments: prev.payments.filter((pay) => {
            const purchase = prev.purchases.find(
              (p) => p.id === pay.purchaseId,
            );
            return purchase?.cardId !== id;
          }),
        })),
      addPurchase: (input) =>
        update((prev) => {
          const installmentAmount =
            input.installmentAmount ??
            Math.round(input.totalAmount / input.installments);
          const id = createId();
          const alreadyPaid = Math.max(
            0,
            Math.min(
              input.alreadyPaidCount ?? 0,
              input.installments,
            ),
          );
          const now = new Date().toISOString();
          const paidMarks = Array.from({ length: alreadyPaid }, (_, i) => ({
            purchaseId: id,
            installmentNumber: i + 1,
            paidAt: now,
          }));
          return {
            ...prev,
            purchases: [
              {
                id,
                description: input.description,
                totalAmount: input.totalAmount,
                installments: input.installments,
                installmentAmount,
                cardId: input.cardId,
                boughtBy: input.boughtBy,
                startMonth: input.startMonth,
                createdAt: now,
                notes: input.notes,
              },
              ...prev.purchases,
            ],
            payments: [...prev.payments, ...paidMarks],
          };
        }),
      removePurchase: (id) =>
        update((prev) => ({
          ...prev,
          purchases: prev.purchases.filter((p) => p.id !== id),
          payments: prev.payments.filter((p) => p.purchaseId !== id),
        })),
      togglePayment: (purchaseId, installmentNumber) =>
        update((prev) => {
          const exists = prev.payments.some(
            (p) =>
              p.purchaseId === purchaseId &&
              p.installmentNumber === installmentNumber,
          );
          if (exists) {
            return {
              ...prev,
              payments: prev.payments.filter(
                (p) =>
                  !(
                    p.purchaseId === purchaseId &&
                    p.installmentNumber === installmentNumber
                  ),
              ),
            };
          }
          return {
            ...prev,
            payments: [
              ...prev.payments,
              {
                purchaseId,
                installmentNumber,
                paidAt: new Date().toISOString(),
              },
            ],
          };
        }),
      exportJson: () => exportData(data),
      importJson: (json) => setData(importData(json)),
      resetAll: () => setData(createDefaultData()),
    }),
    [
      ready,
      data,
      monthKey,
      houseCode,
      syncStatus,
      cloudEnabled,
      createHouse,
      joinHouse,
      leaveHouse,
      update,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance debe usarse dentro de FinanceProvider");
  return ctx;
}
