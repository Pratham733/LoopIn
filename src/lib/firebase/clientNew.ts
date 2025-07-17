// Firebase initialization with proper emulator setup
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Check if we should use emulators
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Connect to emulators (only once and only in browser)
if (useEmulators && typeof window !== 'undefined') {
  // Track if emulators have been connected to avoid duplicate connections
  const emulatorsConnected = 'firebaseEmulatorsConnected' in window;
  
  if (!emulatorsConnected) {
    console.log('🔧 Connecting to Firebase emulators...');
    
    // Auth Emulator
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9090', { disableWarnings: true });
      console.log('✅ Auth emulator connected');
    } catch (err) {
      console.warn('⚠️ Auth emulator connection failed:', err);
    }
    
    // Firestore Emulator  
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8092);
      console.log('✅ Firestore emulator connected');
    } catch (err) {
      console.warn('⚠️ Firestore emulator connection failed:', err);
    }
    
    // Storage Emulator
    try {
      connectStorageEmulator(storage, '127.0.0.1', 9190);
      console.log('✅ Storage emulator connected');
    } catch (err) {
      console.warn('⚠️ Storage emulator connection failed:', err);
    }
    
    // Mark as connected
    (window as any).firebaseEmulatorsConnected = true;
  }
}

export { auth, db, storage };
export default app;
