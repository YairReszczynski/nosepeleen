# No Se Peleen

El amor supera las cuotas.

App web móvil para que Pamela e Itae lleven **una sola agenda** de compras en cuotas.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completá las keys de Firebase en .env.local
npm run dev
```

## Firebase + Netlify (para el celu)

| Pieza | Para qué |
| --- | --- |
| **Netlify** | Hosting: abren `https://…netlify.app` en el navegador del celular |
| **Firebase** | Nube: los dos celulares ven y editan lo mismo en tiempo real |

### 1. Firebase (una sola vez)

1. Entrá a [Firebase Console](https://console.firebase.google.com/) → crear proyecto `nosepeleen`
2. **Authentication** → Sign-in method → habilitar **Anonymous**
3. **Firestore Database** → Create database (modo producción) → pegá las reglas de `firestore.rules`
4. **Project settings** → Add app → Web → copiá la config
5. Completá `.env.local` con esas keys (mismo formato que `.env.example`)

### 2. Netlify

1. Subí el repo a GitHub
2. En [Netlify](https://app.netlify.com/) → Add new site → Import from Git
3. Build command: `npm run build` (ya está en `netlify.toml`)
4. En Site settings → Environment variables, agregá las mismas `NEXT_PUBLIC_FIREBASE_*`
5. Deploy

### 3. En el celular de tus papás

1. Abren la URL de Netlify
2. Van a **Tarjetas** → **Crear casa** (en un celular)
3. Copian el código `AMOR-1234` y lo mandan por WhatsApp
4. En el otro celular: **Unirme a esa casa**

Listo: lo que marque uno, lo ve el otro.
