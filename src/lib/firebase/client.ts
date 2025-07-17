// Firebase initialization with proper emulator setup
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  doc,
  onSnapshot
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { networkStatus } from "../network";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase config is valid
const isMissingConfig = Object.values(firebaseConfig).some(value => !value);
if (isMissingConfig && typeof window !== 'undefined') {
  console.error('Firebase config is missing or incomplete. Check your environment variables:',
    Object.keys(firebaseConfig).filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
  );
}

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
    console.log('� Connecting to Firebase emulators...');
    
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

// Add Firebase connection error handling
if (typeof window !== 'undefined') {
  // Enable Firestore offline persistence with better error handling
  // Only attempt to enable persistence in production or if explicitly enabled
  const isProd = process.env.NODE_ENV === 'production';
  const skipPersistence = process.env.NEXT_PUBLIC_SKIP_FIRESTORE_PERSISTENCE === 'true';
  const forceEnablePersistence = process.env.NEXT_PUBLIC_FORCE_FIRESTORE_PERSISTENCE === 'true';
  
  // In development, don't use persistence by default to avoid errors
  // In production or with explicit enable flag, use persistence
  if ((isProd || forceEnablePersistence) && !skipPersistence) {
    try {
      // Use single-tab persistence which is more reliable
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          console.warn('Firestore persistence failed to enable: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the features required for persistence
          console.warn('Firestore persistence is not available in this browser');
        } else {
          console.error('Error enabling Firestore persistence:', err);
        }
      });
    } catch (error) {
      console.error('Failed to set up Firestore persistence:', error);
    }  } else {
    console.log('Firestore persistence is disabled for development to avoid errors');
  }
}

export { app, auth, db, storage };
