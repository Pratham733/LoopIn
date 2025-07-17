// seed-test-user.mjs - Simple script to create a test user
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

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

// Connect to emulators
try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9090', { disableWarnings: true });
    console.log('Connected to Auth emulator');
} catch (error) {
    console.log('Auth emulator already connected');
}

try {
    connectFirestoreEmulator(db, '127.0.0.1', 8092);
    console.log('Connected to Firestore emulator');
} catch (error) {
    console.log('Firestore emulator already connected');
}

async function createTestUser() {
    try {
        console.log('Setting up test user...');

        let user;
        let isNewUser = false;

        try {
            // Try to create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
            user = userCredential.user;
            isNewUser = true;
            console.log('New user created:', user.uid);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log('User already exists in Auth emulator');
                // Sign in to get the existing user
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
                user = userCredential.user;
                console.log('Signed in existing user:', user.uid);
            } else {
                throw error;
            }
        }

        // Create or update user document in Firestore
        const userDoc = {
            id: user.uid,
            uid: user.uid,
            email: user.email,
            displayName: 'Test User',
            username: 'testuser',
            bio: 'A test user for the application',
            profileImage: null,
            avatar: null,
            following: [],
            followers: [],
            createdAt: isNewUser ? new Date().toISOString() : new Date('2024-01-01').toISOString(),
            updatedAt: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true
            }
        };

        await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
        console.log('User document created/updated in Firestore');

        console.log('Test user setup completed successfully!');
        console.log('Email: test@example.com');
        console.log('Password: password123');
        console.log('Username: testuser');
        console.log('User ID:', user.uid);

    } catch (error) {
        console.error('Error setting up test user:', error);
    }
}

// Run the script
createTestUser().then(() => {
    console.log('Script completed');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
