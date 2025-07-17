// This file ensures firebase-admin is initialized properly for API routes
import { adminDb, adminAuth, adminStorage } from '@/lib/firebase/admin';

// This function can be used in API routes to ensure firebase admin is initialized
export async function ensureFirebaseAdmin() {
  // Check if we're using emulators
  const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true';
  
  // Wait for dynamic import to complete if it hasn't already
  let attempts = 0;
  const maxAttempts = 3;
  
  while (!adminDb && attempts < maxAttempts) {
    console.log(`Firebase Admin not initialized yet, waiting... (attempt ${attempts + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    attempts++;
  }
  
  // Log status
  if (adminDb) {
    console.log('Firebase Admin is initialized');
    
    if (useEmulator) {
      console.log('⚠️ Running in EMULATOR MODE - no real authentication needed');
      console.log('📌 Make sure you started the emulators with: npm run emulators');
    }
  } else {
    if (useEmulator) {
      console.warn('⚠️ Firebase Admin could not be initialized in emulator mode.');
      console.warn('📌 Make sure you started the emulators with: npm run emulators');
      console.warn('📌 Try running: start-emulators.bat');
    } else {
      console.warn('Firebase Admin could not be initialized. Check your Firebase configuration:');
      console.warn('1. Ensure FIREBASE_SERVICE_ACCOUNT is set in .env.local');
      console.warn('2. Or ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid service account file');
      console.warn('3. Or set USE_FIREBASE_EMULATOR=true to use emulators instead');
      console.warn('See docs/firebase-configuration.md for setup instructions');
    }
  }
  
  return { adminDb, adminAuth, adminStorage };
}

export default ensureFirebaseAdmin;
