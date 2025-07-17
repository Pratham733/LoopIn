/**
 * Firebase channel error handler and connection monitoring
 * 
 * This module helps manage Firestore connection errors, particularly:
 * 1. Status 400 errors on Firestore channels
 * 2. "Failed to obtain primary lease" errors with IndexedDB persistence
 * 3. Connection state monitoring to help with offline/online transitions
 */
import { doc, onSnapshot, disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';
import { networkStatus } from '../network';

// Keeps track of channel errors
let channelErrorCount = 0;
let lastChannelErrorTime = 0;
let isHandlingReset = false;
const CHANNEL_ERROR_THRESHOLD = 3; // Number of errors before taking action
const CHANNEL_ERROR_RESET_TIME = 30000; // Reset error count after 30 seconds of no errors

// Function to handle Firebase channel errors (400 errors)
export function setupChannelErrorHandler() {
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  console.log('Setting up Firebase channel error handler');

  // Add a global error handler for network requests
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    try {      // Convert input to string if it's a Request object
      const inputUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      
      // Special handling for emulator requests
      if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && 
          (inputUrl.includes('localhost:') || inputUrl.includes('firestore.googleapis.com'))) {
          // Force IPv4 address instead of localhost to prevent IPv6 issues
        let modifiedUrl = inputUrl.replace('localhost:', '127.0.0.1:');
        
        // If we're trying to access firestore.googleapis.com but we should be using emulator
        if (inputUrl.includes('firestore.googleapis.com')) {
          const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8092';
          console.log(`⚠️ Redirecting production Firestore request to emulator at ${emulatorHost}`);
          modifiedUrl = inputUrl.replace('https://firestore.googleapis.com/google.firestore', 
                                  `http://${emulatorHost}/google.firestore`);
        }
          // Make sure credentials are included
        const modifiedInit = { 
          ...init,
          // Always include credentials for emulator requests
          credentials: 'include' as RequestCredentials, 
          // Avoid CORS preflight by not using 'include' for cross-origin requests
          mode: 'cors' as RequestMode
        };
        
        // Add a cache-busting query parameter to avoid caching issues
        if (!modifiedUrl.includes('?')) {
          modifiedUrl += '?';
        } else {
          modifiedUrl += '&';
        }
        modifiedUrl += '_cb=' + Date.now();
        
        console.log(`🔄 Rerouting Firebase request to: ${modifiedUrl}`);
          try {
          // Try the modified request with detailed logging
          console.log(`🔄 Sending request to emulator: 
            URL: ${modifiedUrl}
            Method: ${modifiedInit.method || 'GET'}
            Headers: ${JSON.stringify(modifiedInit.headers || {})}
          `);
          
          const response = await originalFetch(modifiedUrl, modifiedInit);
          
          // Log the response status
          console.log(`📥 Emulator response: ${response.status} ${response.statusText}`);
          
          // Special handling for different status codes
          if (response.status === 400 && modifiedUrl.includes('Listen/channel')) {
            console.warn('⚠️ Channel error detected (status 400) - attempting recovery...');
            handleChannelError();
          } else if (response.status >= 400) {
            console.warn(`⚠️ Error response from emulator: ${response.status} ${response.statusText}`);
            // Clone the response to read the body without consuming it
            const clonedResponse = response.clone();
            try {
              const errorText = await clonedResponse.text();
              console.warn('Error response body:', errorText.substring(0, 500)); // Limit to 500 chars
            } catch (bodyError) {
              console.warn('Could not read error response body');
            }
          }
          
          return response;
        } catch (error) {
          console.error(`🚨 Firebase emulator fetch failed:`, error);
          
          // Add more detailed diagnostics
          console.error(`Failed request details: 
            URL: ${modifiedUrl}
            Error: ${error instanceof Error ? error.message : String(error)}
            Network status: ${navigator.onLine ? 'Online' : 'Offline'}
          `);
          
          // Special error handling for emulator connectivity issues
          networkStatus.setOffline(true);
          
          // Try to suggest solutions based on the error
          console.error(`
            🔧 Troubleshooting suggestions:
            - Make sure Firebase emulators are running (firebase emulators:start)
            - Check for network connectivity issues
            - Try restarting the development server
            - Visit http://localhost:9002/test-emulators to test connectivity
          `);
          
          throw error;
        }
      }
      
      // Normal handling for production requests
      const response = await originalFetch(input, init);
      
      // Check if this is a Firestore channel request with a 400 error
      const url = input instanceof Request ? input.url : input.toString();
      if (
        response.status === 400 &&
        url.includes('firestore.googleapis.com') &&
        url.includes('Listen/channel')
      ) {
        handleChannelError();
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  console.log('Firebase channel error handler set up');
}

// Specifically handle Firestore channel errors
async function handleChannelError() {
  const now = Date.now();
  
  // Reset error count if it's been a while since the last error
  if (now - lastChannelErrorTime > CHANNEL_ERROR_RESET_TIME) {
    channelErrorCount = 0;
  }
  
  // Increment error count and update last error time
  channelErrorCount++;
  lastChannelErrorTime = now;
  
  console.warn(`Firebase channel error detected (${channelErrorCount}/${CHANNEL_ERROR_THRESHOLD})`);
  
  // If we've hit the threshold, try to restart the Firestore connection
  if (channelErrorCount >= CHANNEL_ERROR_THRESHOLD && !isHandlingReset) {
    console.log('Attempting to recover from persistent channel errors');
    channelErrorCount = 0; // Reset counter
    isHandlingReset = true;
    
    try {
      // Get the Firestore instance
      const db = getFirestore();
      
      // Disable and re-enable the network connection to force a new connection
      console.log('Disabling Firestore network connection...');
      await disableNetwork(db);
      
      // Longer delay to ensure everything is cleaned up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Re-enabling Firestore network connection...');      await enableNetwork(db);
      
      // Update network status
      networkStatus.updateStatus({ firebaseConnected: true });
      
      console.log('Firestore connection reset complete');
    } catch (error) {
      console.error('Error while trying to reset Firestore connection:', error);
    } finally {
      isHandlingReset = false; // Make sure we reset this flag
    }
  }
}

// Check connection status
export function monitorFirestoreConnection() {
  if (typeof window === 'undefined') {
    return () => {}; // Return empty function for SSR
  }
  
  try {
    // Get the Firestore instance
    const db = getFirestore();
    
    // Monitor the .info/connected document
    const connectedRef = doc(db, '.info/connected');
    return onSnapshot(
      connectedRef,
      (snap) => {
        const connected = snap.data()?.connected || false;
        networkStatus.updateStatus({ firebaseConnected: connected });
        console.log(`Firestore connection state: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
      },
      (error) => {
        console.error('Error monitoring Firestore connection:', error);
        networkStatus.updateStatus({ firebaseConnected: false });
      }
    );
  } catch (error) {
    console.error('Failed to set up Firestore connection monitor:', error);
    return () => {}; // Return empty function on error
  }
}
