// setup-emulator-data-fixed.mjs
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
            bio: "Another test user for the Firebase emulator",
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
            bio: "A third test user for the Firebase emulator",
            profileImage: "https://source.unsplash.com/random/200x200?face=3",
            followers: [],
            following: [],
            posts: [],
            conversations: []
        }
    }
];

// Main setup function
async function setupEmulatorData() {
    try {
        console.log("Starting Firebase emulator data setup...");

        // Create users
        const userIds = await setupUsers();

        if (userIds.length >= 3) {
            // Create follow relationships
            await setupFollowRelationships(userIds);

            // Create test posts
            await setupPosts(userIds);

            // Create test conversations
            await setupConversations(userIds);
        }

        console.log("Firebase emulator data setup complete!");
    } catch (error) {
        console.error("Error setting up data:", error);
    }
}

// Setup users
async function setupUsers() {
    console.log("Setting up test users in Firebase emulators...");

    const userIds = [];

    // Check if users already exist
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
        console.log(`Found ${usersSnapshot.size} existing users, skipping user creation.`);
        usersSnapshot.forEach(doc => userIds.push(doc.id));
        return userIds;
    }

    // Create test users
    for (const user of users) {
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                user.email,
                user.password
            );

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
        } catch (error) {
            console.error(`Error creating user ${user.email}:`, error);
        }
    }

    return userIds;
}

// Setup follow relationships
async function setupFollowRelationships(userIds) {
    console.log("Setting up follow relationships...");

    try {
        if (userIds.length >= 3) {
            // Instead of updating user documents directly, create separate follow documents
            // user1 follows user2 and user3
            await addDoc(collection(db, 'follows'), {
                followerId: userIds[0],
                followingId: userIds[1],
                createdAt: new Date().toISOString()
            });

            await addDoc(collection(db, 'follows'), {
                followerId: userIds[0],
                followingId: userIds[2],
                createdAt: new Date().toISOString()
            });

            // user2 follows user1
            await addDoc(collection(db, 'follows'), {
                followerId: userIds[1],
                followingId: userIds[0],
                createdAt: new Date().toISOString()
            });

            // user3 follows user1 and user2
            await addDoc(collection(db, 'follows'), {
                followerId: userIds[2],
                followingId: userIds[0],
                createdAt: new Date().toISOString()
            });

            await addDoc(collection(db, 'follows'), {
                followerId: userIds[2],
                followingId: userIds[1],
                createdAt: new Date().toISOString()
            });

            console.log("Follow relationships created successfully");
        }
    } catch (error) {
        console.error("Error setting up follow relationships:", error);
    }
}

// Setup posts
async function setupPosts(userIds) {
    console.log("Setting up test posts...");

    try {
        // Create 2 posts for each user
        for (let i = 0; i < userIds.length; i++) {
            await addDoc(collection(db, 'posts'), {
                userId: userIds[i],
                content: `This is test post #1 from user${i + 1}`,
                imageUrl: i % 2 === 0 ? `https://source.unsplash.com/random/800x600?nature=${i}` : null,
                likes: [],
                comments: [],
                createdAt: new Date().toISOString()
            });

            await addDoc(collection(db, 'posts'), {
                userId: userIds[i],
                content: `This is test post #2 from user${i + 1}`,
                imageUrl: i % 2 === 1 ? `https://source.unsplash.com/random/800x600?city=${i}` : null,
                likes: [],
                comments: [],
                createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            });
        }

        console.log("Test posts created successfully");
    } catch (error) {
        console.error("Error setting up test posts:", error);
    }
}

// Setup conversations and messages
async function setupConversations(userIds) {
    console.log("Setting up test conversations...");

    try {
        // Create a group conversation with all users
        const groupConversationRef = await addDoc(collection(db, 'conversations'), {
            participantIds: userIds,
            isGroup: true,
            groupName: "Test Group Chat",
            groupImage: "https://source.unsplash.com/random/200x200?group",
            lastMessage: "Welcome to the group chat!",
            lastMessageTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        // Add initial messages to the group conversation
        await addDoc(collection(db, 'messages'), {
            conversationId: groupConversationRef.id,
            senderId: userIds[0],
            content: "Welcome to the group chat!",
            createdAt: new Date().toISOString(),
            readBy: [userIds[0]]
        });

        await addDoc(collection(db, 'messages'), {
            conversationId: groupConversationRef.id,
            senderId: userIds[1],
            content: "Hey everyone, how's it going?",
            createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            readBy: [userIds[1]]
        });

        // Create individual conversations between users
        if (userIds.length >= 2) {
            // Conversation between user 1 and 2
            const conv12Ref = await addDoc(collection(db, 'conversations'), {
                participantIds: [userIds[0], userIds[1]],
                isGroup: false,
                lastMessage: "Hey, how are you doing?",
                lastMessageTime: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });

            await addDoc(collection(db, 'messages'), {
                conversationId: conv12Ref.id,
                senderId: userIds[0],
                content: "Hey, how are you doing?",
                createdAt: new Date().toISOString(),
                readBy: [userIds[0]]
            });
        }

        console.log("Test conversations created successfully");
    } catch (error) {
        console.error("Error setting up test conversations:", error);
    }
}

// Run the setup
setupEmulatorData();
