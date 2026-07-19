export const TUTORIAL_KEY = "nosepeleen-tutorial-v1";

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
    body: "Es una agenda compartida para las compras en cuotas. Así los dos ven lo mismo: qué se compró, con qué tarjeta y qué cuota toca pagar este mes.",
    tip: "La idea: menos agendas aparte, menos peleas.",
    cta: "Siguiente",
  },
  {
    id: "tarjetas",
    eyebrow: "Paso 1",
    title: "Primero carguen las tarjetas",
    body: "En la pestaña Tarjetas agreguen cada plástico (Visa, Mastercard, etc.), los últimos 4 números y el día de vencimiento del resumen.",
    tip: "Pueden ponerle nombre fácil: “Visa de María”, “Master de Juan”.",
    cta: "Siguiente",
  },
  {
    id: "compra",
    eyebrow: "Paso 2",
    title: "Cuando compren algo en cuotas",
    body: "Vayan a Sumar. Pueden escribirlo a mano o pegar el aviso de la app del banco. Si ya venían pagando (ej: van en la cuota 7 de 12), activen “Ya venían pagando cuotas”.",
    tip: "Pongan el mes de la primera cuota (aunque sea de enero) y en qué cuota están hoy.",
    cta: "Siguiente",
  },
  {
    id: "mes",
    eyebrow: "Paso 3",
    title: "Cada mes, marquen lo pagado",
    body: "En Este mes aparece todo lo que toca pagar, agrupado por tarjeta. Toquen cada cuota cuando la paguen: se tacha y baja el pendiente.",
    tip: "Háganlo juntos mirando la misma pantalla. Fin de la discusión.",
    cta: "Siguiente",
  },
  {
    id: "zen",
    eyebrow: "Extra",
    title: "Si ya se enojaron…",
    body: "En Zen hay una respiración corta para calmarse antes de hablar de plata. Suena a chiste, pero ayuda.",
    tip: "Después vuelven a Este mes y siguen marcando.",
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
