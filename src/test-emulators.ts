/**
 * Firebase Emulator Connection Test Script
 * 
 * This script tests connectivity to all Firebase emulators and helps diagnose issues.
 * Run this script to check if your emulators are properly configured and reachable.
 */

import { checkEmulatorConnectivity } from './lib/firebase/admin';
import { networkStatus, checkFirebaseConnectivity } from './lib/network';

// Test server-side emulator connectivity
async function testServerEmulators() {
  console.log('🔥 Testing Firebase Emulators (server-side)');
  
  let fetch: any = null;
  
  // Dynamically import node-fetch only in Node.js environment
  if (typeof window === 'undefined') {
    try {
      const module = await import('node-fetch');
      fetch = module.default;
    } catch (error) {
      console.warn('Could not import node-fetch, HTTP tests will be skipped');
    }
  }
  
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
  
  // Try HTTP connections to validate API access
  try {
    console.log('\nTesting HTTP connections to emulator APIs...');
    
    // Only run HTTP tests if fetch is available
    if (fetch) {
      // Test Firestore emulator
      const firestoreResponse = await fetch(`http://${ipv4FirestoreHost}:${firestorePort}/`);
      console.log(`Firestore API: ${firestoreResponse.status === 200 ? '✅ OK' : '⚠️ Status: ' + firestoreResponse.status}`);
    } else {
      console.log('Skipping HTTP tests - fetch not available');
    }
  } catch (error) {
    console.error('Error testing HTTP connections:', error);
  }
  
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

// Main test function
async function runTests() {
  console.log('='.repeat(50));
  console.log('🧪 FIREBASE EMULATOR CONNECTION TESTS');
  console.log('='.repeat(50));
  
  console.log('\n📌 ENVIRONMENT CHECK:');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`USE_FIREBASE_EMULATOR: ${process.env.USE_FIREBASE_EMULATOR || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR || 'not set'}`);
  
  // Check if emulator mode is enabled
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                      process.env.USE_FIREBASE_EMULATOR === 'true';
                      
  if (!useEmulator) {
    console.log('\n⚠️ WARNING: Emulator mode is not enabled!');
    console.log('Set USE_FIREBASE_EMULATOR=true or NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true to enable emulators.');
  }
  
  // Run server-side emulator tests
  await testServerEmulators();
  
  console.log('\n✅ Emulator tests completed!');
  console.log('='.repeat(50));
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
}

export { testServerEmulators };
