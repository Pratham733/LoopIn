// setup-emulat# Configure admin SDK to use emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8092';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9090'; data - admin.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK with no credentials (works in emulator)
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'demo-loopinchat',
    });
}

// Configure admin SDK to use emulators
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Get admin instances
const adminDb = admin.firestore();
const adminAuth = admin.auth();

// Firebase config for client SDK
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA3AAZt-UDNFhORSM4dBy7TUvJukNabH-w",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "loopinchat.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loopinchat",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loopinchat.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "59902205122",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:59902205122:web:652d49cb3b15305041ef5b"
};

// Initialize Firebase client
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators using correct methods
try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9090', { disableWarnings: true });
} catch (error) {
    // Emulator already connected
    console.log('Auth emulator already connected');
}

try {
    connectFirestoreEmulator(db, '127.0.0.1', 8092);
} catch (error) {
    // Emulator already connected
    console.log('Firestore emulator already connected');
}

// Test users
const TEST_USERS = [
    {
        email: 'user1@example.com',
        password: 'password123',
        displayName: 'Alice Johnson',
        username: 'alice',
        bio: 'Software developer and coffee enthusiast',
        avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?nature',
        following: ['user2', 'user3'],
        followers: ['user2'],
        interests: ['technology', 'coffee', 'hiking']
    },
    {
        email: 'user2@example.com',
        password: 'password123',
        displayName: 'Bob Smith',
        username: 'bobsmith',
        bio: 'Photographer and travel blogger',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?travel',
        following: ['user1'],
        followers: ['user1', 'user3'],
        interests: ['photography', 'travel', 'food']
    },
    {
        email: 'user3@example.com',
        password: 'password123',
        displayName: 'Charlie Davis',
        username: 'charlie',
        bio: 'Music producer and dog lover',
        avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?music',
        following: ['user2'],
        followers: ['user1'],
        interests: ['music', 'dogs', 'cooking']
    }
];

// Test posts
const TEST_POSTS = [
    {
        userId: 'user1',
        text: 'Just launched my new website! Check it out: loopinchat.com #webdev #coding',
        image: 'https://source.unsplash.com/random/800x600/?website',
        likes: ['user2', 'user3'],
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        comments: [
            { userId: 'user2', text: 'Looks great! Congratulations!', createdAt: new Date(Date.now() - 1800000).toISOString() }
        ]
    },
    {
        userId: 'user2',
        text: 'Exploring the mountains this weekend. The view is breathtaking! 🏔️',
        image: 'https://source.unsplash.com/random/800x600/?mountains',
        likes: ['user1'],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        comments: []
    },
    {
        userId: 'user3',
        text: 'Just finished composing a new track. Can\'t wait to share it with everyone! 🎵 #music #production',
        image: null,
        likes: ['user2'],
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        comments: [
            { userId: 'user1', text: 'Can\'t wait to hear it!', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ]
    }
];

// Test conversations
const TEST_CONVERSATIONS = [
    {
        id: 'conv1',
        participantIds: ['user1', 'user2'],
        lastMessage: {
            text: 'See you tomorrow at the conference!',
            senderId: 'user2',
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
        updatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        messages: [
            {
                id: 'msg1',
                text: 'Hi Bob, are you going to the tech conference this week?',
                senderId: 'user1',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                read: true
            },
            {
                id: 'msg2',
                text: 'Yes, I\'ll be there! Are you presenting?',
                senderId: 'user2',
                timestamp: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
                read: true
            },
            {
                id: 'msg3',
                text: 'Yes, I have a session on Firebase integration. Hope you can make it!',
                senderId: 'user1',
                timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
                read: true
            },
            {
                id: 'msg4',
                text: 'See you tomorrow at the conference!',
                senderId: 'user2',
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                read: false
            }
        ]
    },
    {
        id: 'conv2',
        participantIds: ['user1', 'user3'],
        lastMessage: {
            text: 'Thanks for the feedback on my track!',
            senderId: 'user3',
            timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
        },
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        messages: [
            {
                id: 'msg5',
                text: 'Hey Charlie, I listened to your new track. It\'s amazing!',
                senderId: 'user1',
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                read: true
            },
            {
                id: 'msg6',
                text: 'Thanks for the feedback on my track!',
                senderId: 'user3',
                timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
                read: false
            }
        ]
    }
];

async function setupUsers() {
    console.log('Setting up test users in Firebase emulators...');

    try {
        // Check if users already exist
        const usersSnapshot = await adminDb.collection('users').get();
        if (!usersSnapshot.empty) {
            console.log(`Found ${usersSnapshot.size} existing users, skipping user creation.`);
            return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const createdUsers = [];

        for (const userData of TEST_USERS) {
            try {
                // Create user in Authentication
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    userData.email,
                    userData.password
                );

                const userId = userCredential.user.uid;

                // Create user document in Firestore (using admin SDK to bypass rules)
                await adminDb.collection('users').doc(userData.username).set({
                    id: userData.username,
                    email: userData.email,
                    displayName: userData.displayName,
                    username: userData.username,
                    bio: userData.bio,
                    avatar: userData.avatar,
                    coverImage: userData.coverImage,
                    following: userData.following || [],
                    followers: userData.followers || [],
                    interests: userData.interests || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authId: userId
                });

                createdUsers.push({
                    id: userData.username,
                    ...userData,
                    authId: userId
                });

            } catch (error) {
                console.error(`Error creating user ${userData.email}:`, error);
            }
        }

        console.log(`Created ${createdUsers.length} test users.`);
        return createdUsers;

    } catch (error) {
        console.error('Error setting up test users:', error);
        throw error;
    }
}

async function setupPosts() {
    console.log('Setting up test posts...');

    try {
        // Check if posts already exist
        const postsSnapshot = await adminDb.collection('posts').get();
        if (!postsSnapshot.empty) {
            console.log(`Found ${postsSnapshot.size} existing posts, skipping post creation.`);
            return;
        }

        for (const [index, postData] of TEST_POSTS.entries()) {
            try {
                await adminDb.collection('posts').doc(`post${index + 1}`).set({
                    id: `post${index + 1}`,
                    ...postData
                });
            } catch (error) {
                console.error(`Error creating post ${index + 1}:`, error);
            }
        }

        console.log(`Created ${TEST_POSTS.length} test posts.`);

    } catch (error) {
        console.error('Error setting up test posts:', error);
        throw error;
    }
}

async function setupConversations() {
    console.log('Setting up test conversations...');

    try {
        // Check if conversations already exist
        const convsSnapshot = await adminDb.collection('conversations').get();
        if (!convsSnapshot.empty) {
            console.log(`Found ${convsSnapshot.size} existing conversations, skipping conversation creation.`);
            return;
        }

        for (const conversation of TEST_CONVERSATIONS) {
            try {
                // Create the conversation document
                await adminDb.collection('conversations').doc(conversation.id).set({
                    id: conversation.id,
                    participantIds: conversation.participantIds,
                    lastMessage: conversation.lastMessage,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt
                });

                // Create message documents
                for (const message of conversation.messages) {
                    await adminDb.collection('messages').doc(message.id).set({
                        id: message.id,
                        conversationId: conversation.id,
                        ...message
                    });
                }
            } catch (error) {
                console.error(`Error creating conversation ${conversation.id}:`, error);
            }
        }

        console.log(`Created ${TEST_CONVERSATIONS.length} test conversations with messages.`);

    } catch (error) {
        console.error('Error setting up test conversations:', error);
        throw error;
    }
}

// Main function to run the script
async function main() {
    console.log('Starting Firebase emulator data setup...');

    try {
        const users = await setupUsers();

        // These functions now use the admin SDK to bypass security rules
        await setupPosts();
        await setupConversations();

        console.log('Firebase emulator data setup complete!');

    } catch (error) {
        console.error('Error setting up data:', error);
    } finally {
        // Terminate the app when done
        process.exit(0);
    }
}

main();
