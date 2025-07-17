// create-test-users.mjs
// Script to create test users in Firebase Auth emulator

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for emulator
admin.initializeApp({
    projectId: 'demo-loopinchat',
});

// Set emulator hosts
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const auth = admin.auth();
const db = admin.firestore();

// Test users to create
const TEST_USERS = [
    {
        uid: 'test-user-1',
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        displayName: 'Test User',
        bio: 'This is a test user for development'
    },
    {
        uid: 'test-user-2',
        email: 'alice@example.com',
        password: 'password123',
        username: 'alice',
        displayName: 'Alice Johnson',
        bio: 'Software developer and coffee enthusiast'
    },
    {
        uid: 'test-user-3',
        email: 'bob@example.com',
        password: 'password123',
        username: 'bob',
        displayName: 'Bob Smith',
        bio: 'Photographer and travel blogger'
    }
];

async function createTestUsers() {
    console.log('🔥 Creating test users in Firebase Auth emulator...');

    for (const userData of TEST_USERS) {
        try {
            console.log(`Creating user: ${userData.email}`);

            // Create user in Auth emulator
            const userRecord = await auth.createUser({
                uid: userData.uid,
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                emailVerified: true
            });

            console.log(`✅ Created Auth user: ${userRecord.email} (${userRecord.uid})`);

            // Create corresponding Firestore profile
            await db.collection('users').doc(userData.uid).set({
                uid: userData.uid,
                email: userData.email,
                username: userData.username,
                displayName: userData.displayName,
                bio: userData.bio,
                avatar: null,
                coverImage: null,
                following: [],
                followers: [],
                interests: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Created Firestore profile for: ${userData.username}`);

        } catch (error) {
            if (error.code === 'auth/uid-already-exists') {
                console.log(`⚠️  User ${userData.email} already exists, skipping...`);
            } else {
                console.error(`❌ Error creating user ${userData.email}:`, error.message);
            }
        }
    }

    console.log('\n🎉 Test user creation complete!');
    console.log('\nYou can now log in with:');
    TEST_USERS.forEach(user => {
        console.log(`  Email: ${user.email} | Password: ${user.password}`);
    });

    process.exit(0);
}

createTestUsers().catch(error => {
    console.error('❌ Failed to create test users:', error);
    process.exit(1);
});
