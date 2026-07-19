export const TUTORIAL_KEY = "nosepeleen-tutorial-v2";

export type TutorialStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  tip?: string;
  cta: string;
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    eyebrow: "Bienvenidos",
    title: "Esto es No Se Peleen",
    body: "Es una agenda compartida de gastos: crédito, débito, con cuotas o de contado. Así los dos ven lo mismo y no discuten por quién anotó qué.",
    tip: "La idea: menos agendas aparte, menos peleas.",
    cta: "Siguiente",
  },
  {
    id: "tarjetas",
    eyebrow: "Paso 1",
    title: "Primero agreguen las tarjetas",
    body: "En Tarjetas agreguen cada plástico de crédito o débito, los últimos 4 números y el día del mes en que suelen pagar.",
    tip: "Pónganle un nombre claro, por ejemplo: “Visa crédito”, “Débito del banco”.",
    cta: "Siguiente",
  },
  {
    id: "compra",
    eyebrow: "Paso 2",
    title: "Cuando compren algo",
    body: "Vayan a Sumar. Sirve para cuotas y también para un solo pago (débito o de contado: pongan 1 cuota). Indiquen qué día del mes se paga. Pueden escribirlo a mano o pegar el aviso de la app del banco.",
    tip: "Si ya venían pagando cuotas antiguas, activen “Ya venían pagando” e indiquen en qué cuota van.",
    cta: "Siguiente",
  },
  {
    id: "mes",
    eyebrow: "Paso 3",
    title: "Cada mes, marquen lo pagado",
    body: "En Este mes aparece lo que toca pagar, con el día de pago. Toquen cuando lo paguen: se tacha y baja el pendiente.",
    tip: "Háganlo juntos mirando la misma pantalla. Fin de la discusión.",
    cta: "Siguiente",
  },
  {
    id: "zen",
    eyebrow: "Extra",
    title: "Si ya se enojaron…",
    body: "En Zen hay una respiración corta para calmarse antes de hablar de dinero. Suena a chiste, pero ayuda.",
    tip: "Después vuelvan a Este mes y sigan marcando.",
    cta: "¡Empezar!",
  },
];

export function hasSeenTutorial(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_KEY) === "done";
}

export function markTutorialSeen(): void {
  localStorage.setItem(TUTORIAL_KEY, "done");
}

export function clearTutorialSeen(): void {
  localStorage.removeItem(TUTORIAL_KEY);
}
