# Using Firebase in Next.js

This guide explains how to properly use Firebase in a Next.js application, addressing common issues with server-only Node.js modules.

## Background

Firebase Admin SDK uses Node.js-specific modules like `fs`, `child_process`, and `net` which are not available in the browser. When using Next.js, which can run code in both server and browser environments, we need to handle these dependencies carefully.

## Project Structure

We use a modular approach to handle Firebase SDK imports:

```
src/lib/firebase/
  ├── client.ts     # Client-side Firebase SDK
  ├── admin.ts      # Server-side Firebase Admin SDK
  ├── ensure-admin.ts # Helper to initialize Admin SDK in API routes
  └── index.ts      # Re-exports for convenience
```

## Setup

1. **Client Setup**: Uses the standard Firebase Web SDK
   ```typescript
   // src/lib/firebase/client.ts
   import { initializeApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";
   ...
   ```

2. **Admin Setup**: Uses dynamic imports for Firebase Admin
   ```typescript
   // src/lib/firebase/admin.ts
   // Only runs on the server
   if (typeof window === 'undefined') {
     import('firebase-admin').then((firebaseAdmin) => {
       // Admin SDK initialization
     });
   }
   ```

3. **Next.js Configuration**: Set webpack to ignore Node.js modules in client bundles
   ```typescript
   // next.config.ts
   webpack: (config, { isServer }) => {
     if (!isServer) {
       config.resolve.fallback = {
         fs: false,
         path: false,
         child_process: false,
         // ... other Node.js modules
       };
     }
     return config;
   }
   ```

## Usage

### Client-side Code

```typescript
import { db, auth } from '@/lib/firebase/client';

// Use standard Firebase Web SDK
const usersRef = collection(db, 'users');
const user = auth.currentUser;
```

### Server-side Code (API Routes)

```typescript
import { db } from '@/lib/firebase/client';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET() {
  // For Admin SDK operations
  const { adminDb, adminAuth } = await ensureFirebaseAdmin();
  
  // Use Admin SDK for privileged operations
  if (adminDb) {
    const users = await adminDb.collection('users').get();
  }

  // Client SDK is also available
  const clientQuery = query(collection(db, 'users'));
}
```

## Troubleshooting

If you encounter errors like:

```
Module not found: Can't resolve 'fs'
Module not found: Can't resolve 'child_process'
```

Make sure:

1. Your Next.js webpack config has the proper fallbacks
2. You're not directly importing Firebase Admin SDK in client components
3. You're using the dynamic import pattern for Firebase Admin

## Testing Your Setup

Use our diagnostic endpoint to verify your Firebase configuration:

```
GET /api/test-firebase
```

This will check both client-side and server-side Firebase connections and report any issues.
