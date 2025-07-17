'use client';

import { useEffect, useState } from 'react';
import { auth, db, storage } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<{
    initialized: boolean;
    error: string | null;
    authReady: boolean;
    firestoreReady: boolean;
  }>({
    initialized: false,
    error: null,
    authReady: false,
    firestoreReady: false
  });

  useEffect(() => {
    // Check if Firebase is properly initialized
    const checkFirebase = async () => {
      try {
        // Check Auth initialization
        const authUnsubscribe = onAuthStateChanged(auth, (user) => {
          setStatus(prev => ({ ...prev, authReady: true }));
        }, (error) => {
          setStatus(prev => ({ ...prev, error: `Auth error: ${error.message}` }));
        });

        // Check Firestore initialization
        try {
          const usersCollection = collection(db, 'users');
          const q = query(usersCollection, limit(1));
          await getDocs(q);
          setStatus(prev => ({ ...prev, firestoreReady: true }));
        } catch (error: any) {
          if (error.code === 'failed-precondition' || error.code === 'resource-exhausted') {
            // These errors are related to offline mode, which means Firestore is at least initialized
            setStatus(prev => ({ ...prev, firestoreReady: true }));
          } else {
            setStatus(prev => ({ ...prev, error: `Firestore error: ${error.message}` }));
          }
        }

        // Mark as initialized when both are ready
        setStatus(prev => ({ 
          ...prev, 
          initialized: prev.authReady && prev.firestoreReady 
        }));

        // Cleanup auth subscription
        return () => authUnsubscribe();
      } catch (error: any) {
        setStatus({
          initialized: false,
          error: error.message,
          authReady: false,
          firestoreReady: false
        });
      }
    };

    checkFirebase();
  }, []);

  // In production or if everything is initialized correctly, don't show anything
  if (process.env.NODE_ENV === 'production' || (status.initialized && !status.error)) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 text-yellow-800 p-2 text-center text-sm">
      {status.error ? (
        <div className="bg-red-100 text-red-800 p-2 rounded">
          Firebase initialization error: {status.error}
        </div>
      ) : !status.initialized ? (
        <div className="flex justify-center items-center gap-2">
          <span className="animate-spin">⟳</span>
          <span>Initializing Firebase... {status.authReady ? '✓' : '○'} Auth {status.firestoreReady ? '✓' : '○'} Firestore</span>
        </div>
      ) : null}
    </div>
  );
}
