import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { AppData } from "./types";
import { createDefaultData } from "./storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let authReady: Promise<void> | null = null;

function getFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no está configurado");
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth: auth!, db: db! };
}

async function ensureAuth(): Promise<void> {
  const { auth } = getFirebase();
  if (auth.currentUser) return;
  if (!authReady) {
    authReady = signInAnonymously(auth).then(() => undefined);
  }
  await authReady;
}

export function normalizeHouseCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export function generateHouseCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `AMOR-${n}`;
}

type CloudPayload = AppData & { updatedAt: string };

function householdRef(code: string) {
  const { db } = getFirebase();
  return doc(db, "households", code);
}

export async function createCloudHousehold(
  code: string,
  data: AppData,
): Promise<void> {
  await ensureAuth();
  const payload: CloudPayload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(householdRef(code), payload);
}

export async function fetchCloudHousehold(
  code: string,
): Promise<AppData | null> {
  await ensureAuth();
  const snap = await getDoc(householdRef(code));
  if (!snap.exists()) return null;
  return sanitizeCloudData(snap.data());
}

export async function saveCloudHousehold(
  code: string,
  data: AppData,
): Promise<void> {
  await ensureAuth();
  const payload: CloudPayload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(householdRef(code), payload, { merge: true });
}

export function subscribeCloudHousehold(
  code: string,
  onData: (data: AppData) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const { db } = getFirebase();
  void ensureAuth();
  return onSnapshot(
    doc(db, "households", code),
    (snap) => {
      if (!snap.exists()) return;
      onData(sanitizeCloudData(snap.data()));
    },
    (err) => onError?.(err),
  );
}

function sanitizeCloudData(raw: Record<string, unknown>): AppData {
  const base = createDefaultData();
  const household = (raw.household as AppData["household"]) ?? base.household;
  const cards = Array.isArray(raw.cards)
    ? (raw.cards as AppData["cards"]).map((c) => ({
        ...c,
        kind: c.kind === "debito" ? ("debito" as const) : ("credito" as const),
      }))
    : [];
  return {
    version: 1,
    household: {
      mamaName: household.mamaName || base.household.mamaName,
      papaName: household.papaName || base.household.papaName,
    },
    cards,
    purchases: Array.isArray(raw.purchases)
      ? (raw.purchases as AppData["purchases"]).map((p) => ({
          ...p,
          paymentDay:
            typeof p.paymentDay === "number" && p.paymentDay >= 1
              ? p.paymentDay
              : 10,
        }))
      : [],
    payments: Array.isArray(raw.payments)
      ? (raw.payments as AppData["payments"])
      : [],
  };
}
