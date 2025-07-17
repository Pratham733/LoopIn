// setup-real-firebase-data.mjs
// This script populates your real Firebase project with sample data for development
// CAUTION: This will affect your real Firebase database, so use with care

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
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
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';

// Firebase config using your real project values from .env.local
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA3AAZt-UDNFhORSM4dBy7TUvJukNabH-w",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "loopinchat.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loopinchat",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loopinchat.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "59902205122",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:59902205122:web:652d49cb3b15305041ef5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test users
const users = [
    {
        email: "testuser1@example.com",
        password: "Password123!",
        userData: {
            username: "testuser1",
            displayName: "Test User 1",
            bio: "This is a test user for Firebase",
            profileImage: "https://source.unsplash.com/random/200x200?face=1",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    },
    {
        email: "testuser2@example.com",
        password: "Password123!",
        userData: {
            username: "testuser2",
            displayName: "Test User 2",
            bio: "Another test user account",
            profileImage: "https://source.unsplash.com/random/200x200?face=2",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    }
];

async function setupUsers() {
    console.log("Setting up test users in Firebase...");

    // Check if users already exist by trying to sign in
    const userIds = [];

    for (const user of users) {
        try {
            // Try to sign in first
            try {
                const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
                console.log(`User ${user.email} already exists, skipping creation`);
                userIds.push(userCredential.user.uid);
            } catch (signInError) {
                // User doesn't exist, create it
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                const uid = userCredential.user.uid;
                userIds.push(uid);

                // Add user data to Firestore
                await setDoc(doc(db, 'users', uid), {
                    ...user.userData,
                    uid: uid,
                    email: user.email,
                    createdAt: new Date().toISOString()
                });

                console.log(`Created user: ${user.email} with ID: ${uid}`);
            }
        } catch (error) {
            console.error(`Error handling user ${user.email}:`, error);
        }
    }

    return userIds;
}

async function setupFollowRelationships(userIds) {
    if (userIds.length >= 2) {
        console.log("Setting up follow relationships...");

        try {
            // user1 follows user2
            await setDoc(doc(db, 'users', userIds[0]), {
                following: [userIds[1]]
            }, { merge: true });

            // user2 has user1 as follower
            await setDoc(doc(db, 'users', userIds[1]), {
                followers: [userIds[0]]
            }, { merge: true });

            console.log("Follow relationships created successfully");
        } catch (error) {
            console.error("Error setting up follow relationships:", error);
        }
    }
}

// Run setup
async function main() {
    console.log("⚠️ WARNING: This script will add test data to your REAL Firebase project!");
    console.log("Press Ctrl+C within 5 seconds to cancel...");

    // Wait 5 seconds to allow cancellation
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        console.log("Starting Firebase data setup...");
        const userIds = await setupUsers();
        await setupFollowRelationships(userIds);
        console.log("Firebase data setup complete!");
    } catch (error) {
        console.error("Error setting up data:", error);
    } finally {
        // Always sign out when done
        await auth.signOut();
    }
    process.exit(0);
}

main();
