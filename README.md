# No Se Peleen

El amor supera las cuotas.

App web móvil para que Pamela e Itae lleven **una sola agenda** de gastos (crédito, débito, cuotas o de contado).

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completen las keys de Firebase en .env.local
npm run dev
```

## Firebase + Netlify

| Pieza | Para qué |
| --- | --- |
| **Netlify** | Hosting: abren la URL en el navegador del teléfono |
| **Firebase** | Nube: los dos teléfonos ven y editan lo mismo en tiempo real |

### 1. Firebase (una sola vez)

1. [Firebase Console](https://console.firebase.google.com/) → proyecto `nosepeleen`
2. **Authentication** → Sign-in method → **Anonymous** ON
3. **Firestore Database** → crear base → reglas de `firestore.rules`
4. Project settings → app Web → copiar config a `.env.local` / Netlify

### 2. Netlify

1. Importar el repo de GitHub
2. Variables `NEXT_PUBLIC_FIREBASE_*`
3. Deploy

### 3. En el teléfono

1. Abren la URL de Netlify
2. Eligen **Soy Pamela** o **Soy Itae**
3. Listo: la agenda se sincroniza sola (misma nube para los dos)

No hay códigos ni “crear casa”: al abrir la app ya quedan en la misma agenda.
