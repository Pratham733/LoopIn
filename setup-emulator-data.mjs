// setup-emulator-data.mjs
// This script populates the Firebase emulators with sample data for development
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    connectFirestoreEmulator,
    collection,
    addDoc,
    doc,
    setDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';

import {
    getAuth,
    connectAuthEmulator,
    createUserWithEmailAndPassword
} from 'firebase/auth';

// Ensure we're running in non-secure mode for emulators
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Firebase config using demo values for emulator
const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "loopinchat.firebaseapp.com",
    projectId: "loopinchat",
    storageBucket: "loopinchat.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099');

// Test users
const users = [
    {
        email: "user1@example.com",
        password: "password123",
        userData: {
            username: "user1",
            displayName: "Test User 1",
            bio: "This is a test user for the Firebase emulator",
            profileImage: "https://source.unsplash.com/random/200x200?face=1",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    },
    {
        email: "user2@example.com",
        password: "password123",
        userData: {
            username: "user2",
            displayName: "Test User 2",
            bio: "Another test user account",
            profileImage: "https://source.unsplash.com/random/200x200?face=2",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    },
    {
        email: "user3@example.com",
        password: "password123",
        userData: {
            username: "user3",
            displayName: "Test User 3",
            bio: "Third test user for development",
            profileImage: "https://source.unsplash.com/random/200x200?face=3",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    }
];

async function setupUsers() {
    console.log("Setting up test users in Firebase emulators...");

    // Check if users already exist
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
        console.log(`Found ${usersSnapshot.size} existing users, skipping user creation.`);
        return;
    }

    // Create users
    for (const user of users) {
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
            const uid = userCredential.user.uid;

            // Add user data to Firestore
            await setDoc(doc(db, 'users', uid), {
                ...user.userData,
                uid: uid,
                email: user.email,
                createdAt: new Date().toISOString()
            });

            console.log(`Created user: ${user.email} with ID: ${uid}`);
        } catch (error) {
            console.error(`Error creating user ${user.email}:`, error);
        }
    }
}

async function setupFollowRelationships() {
    console.log("Setting up follow relationships...");

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userDocs = [];
    usersSnapshot.forEach(doc => userDocs.push({ id: doc.id, ...doc.data() }));

    if (userDocs.length >= 3) {
        // Create follow relationships
        // user1 follows user2 and user3
        await setDoc(doc(db, 'users', userDocs[0].id), {
            ...userDocs[0],
            following: [userDocs[1].id, userDocs[2].id]
        });

        // user2 follows user1
        await setDoc(doc(db, 'users', userDocs[1].id), {
            ...userDocs[1],
            following: [userDocs[0].id]
        });

        // Add followers lists
        await setDoc(doc(db, 'users', userDocs[1].id), {
            ...userDocs[1],
            followers: [userDocs[0].id]
        });

        await setDoc(doc(db, 'users', userDocs[2].id), {
            ...userDocs[2],
            followers: [userDocs[0].id]
        });

        console.log("Follow relationships created successfully");
    }
}

// Run setup
async function main() {
    try {
        console.log("Starting Firebase emulator data setup...");
        await setupUsers();
        await setupFollowRelationships();
        console.log("Firebase emulator data setup complete!");
    } catch (error) {
        console.error("Error setting up data:", error);
    }
    process.exit(0);
}

main();
