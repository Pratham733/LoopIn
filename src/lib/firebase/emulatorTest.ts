/**
 * This file tests the client-side connectivity to Firebase emulators
 * It can be included in a test page to diagnose connection issues
 */

import { db, storage, auth } from '@/lib/firebase/client';
import { collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { signInAnonymously, signOut } from 'firebase/auth';
import { networkStatus, checkFirebaseConnectivity } from '@/lib/network';

/**
 * Tests client-side connectivity to Firebase emulators
 * @returns Object with test results
 */
export async function testClientEmulators() {
  const results = {
    firestoreRead: false,
    firestoreWrite: false,
    storageUpload: false,
    authAnonymous: false
  };

  console.group('📱 CLIENT-SIDE FIREBASE EMULATOR TESTS');

  // Check if we're in emulator mode
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  console.log(`Emulator mode enabled: ${useEmulator ? '✅ YES' : '❌ NO'}`);

  if (!useEmulator) {
    console.warn('⚠️ Not running in emulator mode. Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true');
    console.groupEnd();
    return results;
  }

  // Check overall Firebase connectivity
  try {
    console.log('Testing overall Firebase connectivity...');
    const isConnected = await checkFirebaseConnectivity();
    console.log(`Firebase connectivity: ${isConnected ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
    
    // Network status from the observer
    console.log('Network status from observer:', {
      isOnline: networkStatus.isOnline,
      firebaseConnected: networkStatus.firebaseConnected
    });
  } catch (error) {
    console.error('Error checking Firebase connectivity:', error);
  }

  // Test Firestore read operations
  try {
    console.log('\nTesting Firestore read operations...');
    const testCollection = collection(db, 'emulator_test');
    const querySnapshot = await getDocs(testCollection);
    console.log(`Found ${querySnapshot.size} test documents`);
    results.firestoreRead = true;
    console.log('✅ Firestore read operations working');
  } catch (error) {
    console.error('❌ Firestore read test failed:', error);
  }

  // Test Firestore write operations
  try {
    console.log('\nTesting Firestore write operations...');
    const testCollection = collection(db, 'emulator_test');
    const docRef = await addDoc(testCollection, {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Test document from client connectivity test'
    });
    console.log(`✅ Document created with ID: ${docRef.id}`);
    
    // Clean up the test document
    await deleteDoc(docRef);
    console.log('✅ Test document cleaned up');
    
    results.firestoreWrite = true;
  } catch (error) {
    console.error('❌ Firestore write test failed:', error);
  }

  // Test Storage operations
  try {
    console.log('\nTesting Storage operations...');
    const storageRef = ref(storage, `emulator_test/${Date.now()}.txt`);
    
    // Upload a small test string
    await uploadString(storageRef, 'Hello from emulator test!');
    console.log('✅ Test file uploaded');
    
    // Try to get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`✅ Download URL obtained: ${downloadUrl}`);
    
    // Clean up the test file
    await deleteObject(storageRef);
    console.log('✅ Test file cleaned up');
    
    results.storageUpload = true;
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }

  // Test Auth operations
  try {
    console.log('\nTesting Auth operations...');
    const userCredential = await signInAnonymously(auth);
    console.log(`✅ Signed in anonymously with UID: ${userCredential.user.uid}`);
    
    // Sign out
    await signOut(auth);
    console.log('✅ Signed out successfully');
    
    results.authAnonymous = true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }

  // Summary
  console.log('\n📋 CLIENT-SIDE EMULATOR TEST SUMMARY:');
  console.log(`Firestore Read: ${results.firestoreRead ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Firestore Write: ${results.firestoreWrite ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Storage Upload: ${results.storageUpload ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Anonymous: ${results.authAnonymous ? '✅ PASS' : '❌ FAIL'}`);

  console.groupEnd();
  return results;
}

export default testClientEmulators;
