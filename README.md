# NexTorqen

Sistema base de gestión para talleres mecánicos y servicios automotrices.

## Stack

- React + Vite
- React Router
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting
- CSS modular por feature

## Inicio

```bash
npm install
npm run dev
```

Credencial inicial:

- Usuario: `misaelr893`
- Email: `misaelr893@nextorqen.local`
- Contraseña: `admin`

Sin variables `VITE_FIREBASE_*`, la app usa `localStorage` para que login y CRUD funcionen durante el desarrollo inicial. Al configurar Firebase, se usa Firestore/Auth.

## Firebase

1. Copiar `.env.example` a `.env`.
2. Completar los valores del proyecto Firebase.
3. Activar Authentication con Email/Password.
4. Crear Firestore Database.
5. Desplegar reglas e hosting con Firebase CLI.

```bash
firebase deploy
```

## Arquitectura

```text
src/
  components/
  context/
  firebase/
  hooks/
  layouts/
  modules/
    auth/
    dashboard/
    usuarios/
  pages/
  routes/
  services/
  styles/
  utils/
```

La app separa rutas, providers, servicios de datos y módulos funcionales. Los próximos módulos pueden seguir el patrón de `modules/usuarios` con su propio servicio, página y estilos.

## Nota de seguridad

La visualización y almacenamiento de contraseñas en Firestore/localStorage queda implementada solo para esta etapa de desarrollo solicitada. En producción conviene eliminar esa colección de credenciales visibles, usar Firebase Auth/Admin SDK o Cloud Functions para alta de usuarios, y aplicar reglas por rol con custom claims.
