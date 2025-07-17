// Network connectivity utility for Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc, getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

// Create an observable network status
class NetworkStatusObservable {
  private listeners: Array<(status: NetworkStatusState) => void> = [];
  private _state: NetworkStatusState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastChecked: Date.now(),
    firebaseConnected: true
  };

  get isOnline() {
    return this._state.isOnline;
  }
  
  get firebaseConnected() {
    return this._state.firebaseConnected;
  }
  
  get lastChecked() {
    return this._state.lastChecked;
  }
    set firebaseConnected(value: boolean) {
    this._state = {
      ...this._state,
      firebaseConnected: value
    };
    this.notifyListeners();
  }
  
  setOffline(value: boolean) {
    this._state = {
      ...this._state,
      isOnline: !value,
      firebaseConnected: !value
    };
    this.notifyListeners();
  }
  
  updateStatus(status: Partial<NetworkStatusState>) {
    this._state = {
      ...this._state,
      ...status,
      lastChecked: Date.now()
    };
    this.notifyListeners();
  }

  // Update state without notifying listeners - used to prevent infinite loops
  _updateStatusSilently(status: Partial<NetworkStatusState>) {
    this._state = {
      ...this._state,
      ...status,
      lastChecked: Date.now()
    };
    // No notification to prevent recursive calls
  }

  subscribe(listener: (status: NetworkStatusState) => void) {
    this.listeners.push(listener);
    // Immediately call the listener with current state
    listener(this._state);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this._state));
  }
}

// Network status type definition
interface NetworkStatusState {
  isOnline: boolean;
  lastChecked: number;
  firebaseConnected: boolean;
}

// Create a singleton instance
const networkStatus = new NetworkStatusObservable();

// Flag to prevent concurrent connectivity checks
let isCheckingConnectivity = false;

/**
 * Function to check Firebase connectivity
 * @returns Promise resolving to true if connected to Firebase, false otherwise
 */
export const checkFirebaseConnectivity = async (): Promise<boolean> => {
  // In emulator mode, always return true for connectivity
  if (typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
       (window as any).__FIREBASE_EMULATOR_MODE__)) {
    console.log('Running in Firebase emulator mode - assuming connectivity');
    networkStatus._updateStatusSilently({ 
      isOnline: true, 
      firebaseConnected: true 
    });
    return true;
  }

  // Cache the connectivity state temporarily to prevent excessive checks
  const CONNECTIVITY_CACHE_TIME = 5000; // 5 seconds
  const now = Date.now();
  
  // If browser reports we're offline, we're definitely offline
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return false;
  }
  
  // If already checking or checked recently, return the current status
  // but only if we're online according to browser
  if (isCheckingConnectivity || 
      (now - networkStatus.lastChecked < CONNECTIVITY_CACHE_TIME && 
       typeof window !== 'undefined' && navigator.onLine)) {
    return networkStatus.firebaseConnected;
  }
  
  // If running on server, we assume it's online
  if (typeof window === 'undefined') {
    return true;
  }
  
  try {
    isCheckingConnectivity = true;
    
    // First check browser's navigator.onLine - this is fastest
    const isOnline = navigator.onLine;
    networkStatus._updateStatusSilently({ isOnline });
    
    if (!isOnline) {
      console.log('Browser reports offline status');
      networkStatus._updateStatusSilently({
        isOnline: false,
        firebaseConnected: false
      });
      isCheckingConnectivity = false;
      return false;
    }
    
    // For Firebase-specific connectivity, perform a more reliable check
    try {
      // Faster method: Check if there are pending writes
      // If there are pending operations but we're offline, we'd see them here
      const hasPendingWrites = await new Promise<boolean>(resolve => {
        // Set a short timeout in case something goes wrong
        const shortTimeout = setTimeout(() => {
          console.log('Fast connectivity check timed out, trying slower method');
          resolve(false);
        }, 1000);
        
        try {          // Try to use the Firestore connection directly if available
          // Note: This is a non-standard way to check, but can work in some cases
          const firebaseInstance = (window as any).firebase;
          if (firebaseInstance?.firestore?.INTERNAL?.getPendingWrites) {
            const pendingWrites = firebaseInstance.firestore.INTERNAL.getPendingWrites();
            clearTimeout(shortTimeout);
            return resolve(pendingWrites.length > 0);
          }
          clearTimeout(shortTimeout);
          resolve(false);
        } catch (e) {
          clearTimeout(shortTimeout);
          resolve(false);
        }
      });
      
      // If fast check found pending operations, we assume we're online
      if (hasPendingWrites) {
        networkStatus._updateStatusSilently({ firebaseConnected: true });
        return true;
      }
      
      // Fall back to the more reliable but slower .info/connected check
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Firebase connectivity check timed out');
          // Don't immediately assume we're offline - could be slow network
          // We'll use the last known state instead
          resolve(networkStatus.firebaseConnected);
        }, 3000); // Shorter timeout to prevent UI blocking
        
        // Use the .info/connected special collection
        const unsubscribe = onSnapshot(
          doc(db, '.info/connected'),
          (snapshot: any) => {
            clearTimeout(timeout);
            unsubscribe();
            const connected = snapshot.data()?.connected === true;
            console.log('Firebase connectivity check:', connected ? 'ONLINE' : 'OFFLINE');
            networkStatus._updateStatusSilently({ firebaseConnected: connected });
            resolve(connected);
          },
          (error: any) => {
            clearTimeout(timeout);
            unsubscribe();
            console.error('Firebase connectivity check error:', error);
            
            // For any errors including 400 errors, we'll assume we're online
            // if the browser reports we're online - this prevents false offline states
            // and lets Firebase handle retries
            if (navigator.onLine) {
              console.warn('Error during connectivity check, but browser reports online');
              networkStatus._updateStatusSilently({ firebaseConnected: true });
              resolve(true);
            } else {
              networkStatus._updateStatusSilently({ firebaseConnected: false });
              resolve(false);
            }
          }
        );
      });  
    } catch (error) {
      console.error('Error checking Firebase connectivity:', error);
      networkStatus._updateStatusSilently({ firebaseConnected: false });
      return false;
    }
  } finally {
    isCheckingConnectivity = false;
  }
};

/**
 * Function to execute a Firebase operation with retries on network issues
 * @param operation The async operation to execute
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delayMs Base delay in milliseconds between retries (default: 1000)
 * @param offlineErrorMsg Custom error message when offline after all retries
 * @returns Promise resolving to the operation result
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  offlineErrorMsg = 'Cannot complete operation: You appear to be offline'
): Promise<T> {
  let retries = 0;
  let lastError: any = null;
  
  // Immediately check if we're offline before even starting
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('Device is offline - attempting operation anyway to use cached data');
    // We still try once - Firebase can use cached data in offline mode
    try {
      return await operation();
    } catch (offlineError: any) {
      console.error('Operation failed while offline:', offlineError);
      throw new Error(offlineErrorMsg);
    }
  }
  
  // Loop for retries when we're online or in a Node.js environment
  while (true) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Handle case where we go offline during execution
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('Device went offline during operation');
        throw new Error(offlineErrorMsg);
      }
      
      // Check if it's a network-related error
      const isNetworkError = 
        error?.code === 'failed-precondition' ||
        error?.code === 'unavailable' ||
        error?.code === 'resource-exhausted' ||
        error?.code === 'deadline-exceeded' ||
        error?.message?.includes('offline') ||
        error?.message?.includes('network') ||
        error?.message?.includes('failed to get') ||
        error?.name === 'AbortError';
      
      // If maximum retries reached or it's not a network error, throw
      if (retries >= maxRetries || !isNetworkError) {
        if (isNetworkError) {
          console.error('Network error after maximum retries:', error);
          throw new Error(offlineErrorMsg);
        }
        throw error;
      }
      
      // Increment retry counter
      retries++;
      
      // Log the retry
      console.log(`Network error occurred. Retrying (${retries}/${maxRetries})...`, error.message);
      
      // Use a progressive shorter backoff for better UX
      const backoffTime = delayMs * (1 + (retries * 0.5));
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Check again if we're offline before retrying
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.error('Device appears to have gone offline during retry wait');
        throw new Error(offlineErrorMsg);
      }
    }
  }
}

// Set up listeners for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser went online');
    networkStatus.updateStatus({ isOnline: true });
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser went offline');
    networkStatus.updateStatus({ isOnline: false });
  });
}

export { networkStatus };

/**
 * Toggle Firebase network connection
 * @param enable Whether to enable (true) or disable (false) the network
 * @returns Promise resolving when the network state has been changed
 */
export async function toggleFirebaseNetwork(enable: boolean): Promise<void> {
  if (typeof window === 'undefined') return; // No-op on server
  
  try {
    if (enable) {
      console.log('Enabling Firebase network connection');
      await enableNetwork(db);
      networkStatus.updateStatus({ firebaseConnected: true });
    } else {
      console.log('Disabling Firebase network connection');
      await disableNetwork(db);
      networkStatus.updateStatus({ firebaseConnected: false });
    }
  } catch (error) {
    console.error(`Error ${enable ? 'enabling' : 'disabling'} Firebase network:`, error);
    throw error;
  }
}

/**
 * Waits for online status before executing a task
 * @param task The task to execute when online
 * @param timeoutMs Timeout in milliseconds
 */
export function executeWhenOnline<T>(
  task: () => Promise<T>, 
  timeoutMs = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    // If already online, execute immediately
    if (navigator.onLine) {
      task().then(resolve).catch(reject);
      return;
    }
    
    // Set timeout
    const timeout = setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      reject(new Error('Timeout waiting for network connection'));
    }, timeoutMs);
    
    // Handler for when we go online
    const onlineHandler = () => {
      clearTimeout(timeout);
      window.removeEventListener('online', onlineHandler);
      task().then(resolve).catch(reject);
    };
    
    // Wait for online event
    window.addEventListener('online', onlineHandler);
  });
}
