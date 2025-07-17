// setup-emulator-data-simple.mjs
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK with no credentials (works in emulator)
admin.initializeApp({
    projectId: 'demo-loopinchat',
});

// Connect to the Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Get admin Firestore instance (bypasses security rules)
const db = admin.firestore();

// Test users
const TEST_USERS = [
    {
        id: 'user1',
        email: 'user1@example.com',
        displayName: 'Alice Johnson',
        username: 'alice',
        bio: 'Software developer and coffee enthusiast',
        avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?nature',
        following: ['user2', 'user3'],
        followers: ['user2'],
        interests: ['technology', 'coffee', 'hiking'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'user2',
        email: 'user2@example.com',
        displayName: 'Bob Smith',
        username: 'bobsmith',
        bio: 'Photographer and travel blogger',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?travel',
        following: ['user1'],
        followers: ['user1', 'user3'],
        interests: ['photography', 'travel', 'food'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'user3',
        email: 'user3@example.com',
        displayName: 'Charlie Davis',
        username: 'charlie',
        bio: 'Music producer and dog lover',
        avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
        coverImage: 'https://source.unsplash.com/random/1000x300/?music',
        following: ['user2'],
        followers: ['user1'],
        interests: ['music', 'dogs', 'cooking'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Test posts
const TEST_POSTS = [
    {
        id: 'post1',
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
        id: 'post2',
        userId: 'user2',
        text: 'Exploring the mountains this weekend. The view is breathtaking! 🏔️',
        image: 'https://source.unsplash.com/random/800x600/?mountains',
        likes: ['user1'],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        comments: []
    },
    {
        id: 'post3',
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
        updatedAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
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
        updatedAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    }
];

// Test messages
const TEST_MESSAGES = [
    {
        id: 'msg1',
        conversationId: 'conv1',
        text: 'Hi Bob, are you going to the tech conference this week?',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        read: true
    },
    {
        id: 'msg2',
        conversationId: 'conv1',
        text: 'Yes, I\'ll be there! Are you presenting?',
        senderId: 'user2',
        timestamp: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
        read: true
    },
    {
        id: 'msg3',
        conversationId: 'conv1',
        text: 'Yes, I have a session on Firebase integration. Hope you can make it!',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        read: true
    },
    {
        id: 'msg4',
        conversationId: 'conv1',
        text: 'See you tomorrow at the conference!',
        senderId: 'user2',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        read: false
    },
    {
        id: 'msg5',
        conversationId: 'conv2',
        text: 'Hey Charlie, I listened to your new track. It\'s amazing!',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        read: true
    },
    {
        id: 'msg6',
        conversationId: 'conv2',
        text: 'Thanks for the feedback on my track!',
        senderId: 'user3',
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        read: false
    }
];

// Notifications
const TEST_NOTIFICATIONS = [
    {
        id: 'notif1',
        userId: 'user1',
        type: 'follow',
        fromUserId: 'user2',
        read: false,
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
        id: 'notif2',
        userId: 'user2',
        type: 'like',
        fromUserId: 'user1',
        postId: 'post2',
        read: true,
        createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    },
    {
        id: 'notif3',
        userId: 'user3',
        type: 'comment',
        fromUserId: 'user1',
        postId: 'post3',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
];

async function setupCollection(collectionName, data) {
    console.log(`Setting up ${collectionName}...`);

    try {
        // Check if collection already has data
        const snapshot = await db.collection(collectionName).get();
        if (!snapshot.empty) {
            console.log(`Found ${snapshot.size} existing ${collectionName}, skipping creation.`);
            return;
        }

        // Add all documents in a batch
        const batch = db.batch();

        for (const item of data) {
            const docRef = db.collection(collectionName).doc(item.id);
            batch.set(docRef, item);
        }

        await batch.commit();
        console.log(`Created ${data.length} ${collectionName}.`);

    } catch (error) {
        console.error(`Error setting up ${collectionName}:`, error);
    }
}

// Main function to run the script
async function main() {
    console.log('Starting Firebase emulator data setup with Admin SDK...');

    try {
        await setupCollection('users', TEST_USERS);
        await setupCollection('posts', TEST_POSTS);
        await setupCollection('conversations', TEST_CONVERSATIONS);
        await setupCollection('messages', TEST_MESSAGES);
        await setupCollection('notifications', TEST_NOTIFICATIONS);

        console.log('Firebase emulator data setup complete!');

    } catch (error) {
        console.error('Error setting up data:', error);
    } finally {
        // Terminate the app when done
        process.exit(0);
    }
}

main();
