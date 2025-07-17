import { auth, db, storage } from './src/lib/firebase/client';
import { adminDb, adminAuth } from './src/lib/firebase/admin';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function testFirebaseSetup() {
    console.log('========================================');
    console.log('FIREBASE CONFIGURATION TEST');
    console.log('========================================');

    // Test Firebase client SDK
    try {
        console.log('\n1. Testing Firebase Client SDK:');

        console.log('  - Firestore connection:');
        const testQuery = query(collection(db, 'users'), limit(1));
        const snapshot = await getDocs(testQuery);
        console.log(`    Success! Found ${snapshot.size} users in the test query.`);

        console.log('  - Storage bucket:');
        const bucket = storage.bucket;
        console.log(`    Success! Storage bucket name: ${bucket?.name || '[Default bucket]'}`);

    } catch (error) {
        console.error('  ERROR testing Firebase client SDK:', error);
    }

    // Test Firebase Admin SDK
    try {
        console.log('\n2. Testing Firebase Admin SDK:');

        if (!adminDb) {
            console.log('  - Admin Firestore not initialized. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
        } else {
            console.log('  - Admin Firestore connection:');
            const snapshot = await adminDb.collection('users').limit(1).get();
            console.log(`    Success! Found ${snapshot.size} users in the test query.`);
        }

        if (!adminAuth) {
            console.log('  - Admin Auth not initialized. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
        } else {
            console.log('  - Admin Auth connection:');
            console.log('    Success! Admin Auth SDK initialized correctly.');
        }

    } catch (error) {
        console.error('  ERROR testing Firebase Admin SDK:', error);
        console.log('  Make sure you have set up the FIREBASE_SERVICE_ACCOUNT environment variable correctly.');
    }

    console.log('\nFINISHED TESTING FIREBASE CONFIGURATION');
    console.log('========================================');
}

// Run the test
testFirebaseSetup().catch(console.error);
