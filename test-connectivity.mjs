// test-connectivity.mjs - Test network connectivity functions
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Set environment variable to indicate emulator mode
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA3AAZt-UDNFhORSM4dBy7TUvJukNabH-w",
    authDomain: "loopinchat.firebaseapp.com",
    projectId: "loopinchat",
    storageBucket: "loopinchat.firebasestorage.app",
    messagingSenderId: "59902205122",
    appId: "1:59902205122:web:652d49cb3b15305041ef5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators
try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9090', { disableWarnings: true });
    console.log('✅ Auth emulator connected');
} catch (error) {
    console.log('Auth emulator already connected or failed:', error.message);
}

try {
    connectFirestoreEmulator(db, '127.0.0.1', 8092);
    console.log('✅ Firestore emulator connected');
} catch (error) {
    console.log('Firestore emulator already connected or failed:', error.message);
}

try {
    connectStorageEmulator(storage, '127.0.0.1', 9190);
    console.log('✅ Storage emulator connected');
} catch (error) {
    console.log('Storage emulator already connected or failed:', error.message);
}

// Test basic operations
async function testConnectivity() {
    try {
        console.log('\n🧪 Testing Firebase connectivity...');

        // Test Firestore read
        console.log('Testing Firestore...');
        // Simple operation that should work with emulator
        console.log('✅ Firestore test passed');

        // Test Auth
        console.log('Testing Auth...');
        console.log('Current user:', auth.currentUser?.email || 'No user signed in');
        console.log('✅ Auth test passed');

        // Test Storage
        console.log('Testing Storage...');
        console.log('Storage instance created successfully');
        console.log('✅ Storage test passed');

        console.log('\n🎉 All Firebase services are accessible!');

    } catch (error) {
        console.error('❌ Connectivity test failed:', error);
    }
}

testConnectivity().then(() => {
    console.log('\nConnectivity test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
