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
import { normalizeAppData } from "./storage";

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
    authReady = signInAnonymously(auth)
      .then(() => undefined)
      .catch((err) => {
        authReady = null;
        throw err;
      });
  }
  await authReady;
}

/** Firestore no acepta undefined: lo sacamos en profundidad. */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

type CloudPayload = AppData;

function householdRef(code: string) {
  const { db } = getFirebase();
  return doc(db, "households", code);
}

export async function createCloudHousehold(
  code: string,
  data: AppData,
): Promise<void> {
  await ensureAuth();
  const payload = stripUndefined({
    ...data,
    updatedAt: data.updatedAt || new Date().toISOString(),
  });
  await setDoc(householdRef(code), payload);
}

export async function fetchCloudHousehold(
  code: string,
): Promise<AppData | null> {
  await ensureAuth();
  const snap = await getDoc(householdRef(code));
  if (!snap.exists()) return null;
  return normalizeAppData(snap.data() as AppData);
}

export async function saveCloudHousehold(
  code: string,
  data: AppData,
): Promise<void> {
  await ensureAuth();
  const payload = stripUndefined({
    ...data,
    updatedAt: data.updatedAt || new Date().toISOString(),
  });
  await setDoc(householdRef(code), payload);
}

export async function subscribeCloudHousehold(
  code: string,
  onData: (data: AppData) => void,
  onError?: (err: Error) => void,
): Promise<Unsubscribe> {
  await ensureAuth();
  const { db } = getFirebase();
  return onSnapshot(
    doc(db, "households", code),
    (snap) => {
      if (!snap.exists()) return;
      onData(normalizeAppData(snap.data() as AppData));
    },
    (err) => onError?.(err),
  );
}
