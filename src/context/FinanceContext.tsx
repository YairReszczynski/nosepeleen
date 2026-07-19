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
import { FAMILY_SYNC_ID, saveHouseCode } from "@/lib/houseCode";
import {
  createCloudHousehold,
  fetchCloudHousehold,
  isFirebaseConfigured,
  saveCloudHousehold,
  subscribeCloudHousehold,
} from "@/lib/firebase";

type SyncStatus = "local" | "connecting" | "synced" | "error";

type FinanceContextValue = {
  ready: boolean;
  data: AppData;
  monthKey: string;
  setMonthKey: (key: string) => void;
  syncStatus: SyncStatus;
  cloudEnabled: boolean;
  updateHousehold: (h: Partial<Household>) => void;
  addCard: (
    input: Omit<Card, "id" | "color"> & { color?: string; kind?: Card["kind"] },
  ) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  removeCard: (id: string) => void;
  addPurchase: (
    input: Omit<Purchase, "id" | "createdAt" | "installmentAmount"> & {
      installmentAmount?: number;
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
  const [synced, setSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const applyingRemote = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seeded = useRef(false);
  const cloudEnabled = isFirebaseConfigured();

  // Carga local + enganche automático a la agenda familiar
  useEffect(() => {
    const local = loadData();
    setData(local);

    if (!cloudEnabled) {
      setSyncStatus("local");
      setReady(true);
      return;
    }

    let cancelled = false;
    setSyncStatus("connecting");

    void (async () => {
      try {
        saveHouseCode(FAMILY_SYNC_ID);
        const remote = await fetchCloudHousehold(FAMILY_SYNC_ID);
        if (cancelled) return;

        if (!remote) {
          await createCloudHousehold(FAMILY_SYNC_ID, local);
          seeded.current = true;
        } else {
          applyingRemote.current = true;
          setData(remote);
          queueMicrotask(() => {
            applyingRemote.current = false;
          });
        }

        setSynced(true);
        setSyncStatus("synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudEnabled]);

  // Persistencia local siempre
  useEffect(() => {
    if (!ready) return;
    saveData(data);
  }, [data, ready]);

  // Suscripción en vivo
  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;

    setSyncStatus("connecting");
    let unsub = () => {};

    try {
      unsub = subscribeCloudHousehold(
        FAMILY_SYNC_ID,
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
  }, [ready, cloudEnabled, synced]);

  // Guardar en la nube
  useEffect(() => {
    if (!ready || !cloudEnabled || !synced) return;
    if (applyingRemote.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveCloudHousehold(FAMILY_SYNC_ID, data)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 450);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, ready, cloudEnabled, synced]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData(fn);
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      ready,
      data,
      monthKey,
      setMonthKey,
      syncStatus,
      cloudEnabled,
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
              kind: input.kind ?? "credito",
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
            Math.min(input.alreadyPaidCount ?? 0, input.installments),
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
                paymentDay: Math.min(
                  28,
                  Math.max(1, input.paymentDay ?? 10),
                ),
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
    [ready, data, monthKey, syncStatus, cloudEnabled, update],
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
