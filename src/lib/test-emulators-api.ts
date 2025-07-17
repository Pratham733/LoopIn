/**
 * API-friendly version of the emulator tests
 * This module is designed to be imported in the API routes
 */

import { checkEmulatorConnectivity } from '@/lib/firebase/admin';

// Test server-side emulator connectivity
export async function testServerEmulators() {
  console.log('🔥 Testing Firebase Emulators (server-side)');
  
  // Get emulator hosts from environment variables
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8092';
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
  
  // Parse connection strings
  const [firestoreHostname, firestorePortStr] = firestoreHost.split(':');
  const firestorePort = parseInt(firestorePortStr, 10);
  const [authHostname, authPortStr] = authHost.split(':');
  const authPort = parseInt(authPortStr, 10);
  const [storageHostname, storagePortStr] = storageHost.split(':');
  const storagePort = parseInt(storagePortStr, 10);
  
  // Always use IPv4 (127.0.0.1) instead of localhost to prevent IPv6 issues
  const ipv4FirestoreHost = firestoreHostname === 'localhost' ? '127.0.0.1' : firestoreHostname;
  const ipv4AuthHost = authHostname === 'localhost' ? '127.0.0.1' : authHostname;
  const ipv4StorageHost = storageHostname === 'localhost' ? '127.0.0.1' : storageHostname;
  
  console.log('Testing TCP connections to emulator ports...');
  
  // Check individual connectivity for each emulator
  const firestoreReachable = await checkEmulatorConnectivity(ipv4FirestoreHost, firestorePort);
  console.log(`Firestore Emulator (${ipv4FirestoreHost}:${firestorePort}): ${firestoreReachable ? '✅ REACHABLE' : '❌ UNREACHABLE'}`);
  
  const authReachable = await checkEmulatorConnectivity(ipv4AuthHost, authPort);
  console.log(`Auth Emulator (${ipv4AuthHost}:${authPort}): ${authReachable ? '✅ REACHABLE' : '❌ UNREACHABLE'}`);
  
  const storageReachable = await checkEmulatorConnectivity(ipv4StorageHost, storagePort);
  console.log(`Storage Emulator (${ipv4StorageHost}:${storagePort}): ${storageReachable ? '✅ REACHABLE' : '❌ UNREACHABLE'}`);
  
  // Summary
  console.log('\n📋 SERVER-SIDE EMULATOR TEST SUMMARY:');
  console.log(`Firestore: ${firestoreReachable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth: ${authReachable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Storage: ${storageReachable ? '✅ PASS' : '❌ FAIL'}`);
  
  return {
    firestoreReachable,
    authReachable,
    storageReachable
  };
}
