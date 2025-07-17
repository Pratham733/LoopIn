/**
 * This module provides utilities to help with Firebase emulator connection issues.
 */
import { networkStatus, checkFirebaseConnectivity } from '@/lib/network';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from './client';
import { checkEmulatorConnectivity } from './admin';

/**
 * Checks whether emulators are properly connected and available
 * @returns Object with connectivity status
 */
export async function checkEmulatorStatus() {
  // Only run on the client
  if (typeof window === 'undefined') {
    throw new Error('checkEmulatorStatus can only be run on the client');
  }
  
  const isEmulatorMode = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  if (!isEmulatorMode) {
    return { 
      usingEmulator: false,
      message: 'Not using emulators - set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true to use emulators'
    };
  }
  
  // Get the emulator hosts
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8092';
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  const storageHost = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
  
  // Parse connection strings
  const [firestoreHostname, firestorePortStr] = firestoreHost.split(':');
  const firestorePort = parseInt(firestorePortStr, 10);
  
  // Get current connection status
  const isFirebaseConnected = await checkFirebaseConnectivity();
  
  return {
    usingEmulator: true,
    emulators: {
      firestore: firestoreHost,
      auth: authHost,
      storage: storageHost
    },
    connected: isFirebaseConnected,
    networkStatus: {
      isOnline: networkStatus.isOnline,
      firebaseConnected: networkStatus.firebaseConnected
    },
    message: isFirebaseConnected 
      ? 'Successfully connected to Firebase emulators' 
      : 'Not connected to Firebase emulators'
  };
}

/**
 * Helper function to reset Firebase connections when there are issues
 */
export async function resetFirebaseConnection() {
  // Only run on the client
  if (typeof window === 'undefined') {
    throw new Error('resetFirebaseConnection can only be run on the client');
  }
  
  try {
    // Disable then re-enable network to force a new connection
    await disableNetwork(db);
    
    // Short delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-enable network
    await enableNetwork(db);
    
    return { success: true, message: 'Firebase connection reset successful' };
  } catch (error) {
    console.error('Error resetting Firebase connection:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error resetting connection'
    };
  }
}

/**
 * UI helper to display emulator status
 */
export function getEmulatorStatusInfo() {
  // Only run on the client
  if (typeof window === 'undefined') {
    return { isEmulator: false, statusText: 'Server-side rendering', statusColor: 'gray' };
  }
  
  const isEmulatorMode = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  if (!isEmulatorMode) {
    return { isEmulator: false, statusText: 'Production', statusColor: 'blue' };
  }
  
  const isOnline = networkStatus.isOnline;
  const isConnected = networkStatus.firebaseConnected;
  
  if (!isOnline) {
    return { isEmulator: true, statusText: 'Offline', statusColor: 'red' };
  }
  
  if (isConnected) {
    return { isEmulator: true, statusText: 'Emulator', statusColor: 'green' };
  }
  
  return { isEmulator: true, statusText: 'Disconnected', statusColor: 'orange' };
}
