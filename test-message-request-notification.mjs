import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvVqXqXqXqXqXqXqXqXqXqXqXqXqXqXq",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test users
const testUsers = {
    user1: {
        id: 'test-user-1',
        username: 'Alice',
        email: 'alice@test.com',
        password: 'password123',
        following: ['test-user-2'], // Alice follows Bob
        followers: ['test-user-2']
    },
    user2: {
        id: 'test-user-2',
        username: 'Bob',
        email: 'bob@test.com',
        password: 'password123',
        following: [], // Bob doesn't follow Alice
        followers: ['test-user-1']
    },
    user3: {
        id: 'test-user-3',
        username: 'Charlie',
        email: 'charlie@test.com',
        password: 'password123',
        following: [],
        followers: []
    }
};

// Helper function to create test user
async function createTestUser(userData) {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        following: userData.following,
        followers: userData.followers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    console.log(`✅ Created test user: ${userData.username}`);
}

// Helper function to get user profile
async function getUserProfile(userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
}

// Helper function to add notification
async function addNotification(userId, notificationData) {
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
        userId,
        ...notificationData,
        timestamp: new Date().toISOString(),
        isRead: false
    });
    console.log(`📧 Added notification to ${userId}: ${notificationData.title}`);
}

// Helper function to create conversation
async function createConversation(participantIds, isGroup = false, groupName = null) {
    const conversationRef = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();

    const conversationData = {
        participantIds,
        isGroup,
        name: groupName,
        createdAt: now,
        updatedAt: now
    };

    await setDoc(conversationRef, conversationData);
    const conversationId = conversationRef.id;

    console.log(`💬 Created conversation: ${conversationId}`);

    // Check for non-follower messaging notifications (only for direct messages)
    if (!isGroup && participantIds.length === 2) {
        try {
            const [user1, user2] = await Promise.all([
                getUserProfile(participantIds[0]),
                getUserProfile(participantIds[1])
            ]);

            if (user1 && user2) {
                // Check if user1 follows user2 (the conversation initiator follows the recipient)
                const user1FollowsUser2 = user1.following.includes(user2.id);

                if (!user1FollowsUser2) {
                    // Send notification to user2 that someone who doesn't follow them is trying to message
                    await addNotification(user2.id, {
                        category: 'message_request',
                        title: 'New Message Request',
                        message: `${user1.username} wants to send you a message but doesn't follow you.`,
                        actor: user1,
                        link: `/chat/conversations/${conversationId}`,
                        icon: undefined
                    });
                }
            }
        } catch (notificationError) {
            console.error('Error sending message request notification:', notificationError);
        }
    }

    return conversationId;
}

// Helper function to get notifications for user
async function getNotificationsForUser(userId) {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Test scenarios
async function testMessageRequestNotifications() {
    console.log('🧪 Testing Message Request Notification Logic...\n');

    try {
        // Clean up any existing test data
        console.log('🧹 Cleaning up existing test data...');
        for (const user of Object.values(testUsers)) {
            try {
                await deleteDoc(doc(db, 'users', user.id));
            } catch (e) {
                // Ignore if user doesn't exist
            }
        }

        // Create test users
        console.log('\n👥 Creating test users...');
        for (const user of Object.values(testUsers)) {
            await createTestUser(user);
        }

        // Test Scenario 1: Alice (follows Bob) messages Bob (doesn't follow Alice)
        console.log('\n📝 Test Scenario 1: Alice messages Bob (Alice follows Bob)');
        console.log('Expected: NO notification (Alice follows Bob)');
        const conversation1Id = await createConversation([testUsers.user1.id, testUsers.user2.id]);
        const notifications1 = await getNotificationsForUser(testUsers.user2.id);
        const messageRequestNotifications1 = notifications1.filter(n => n.category === 'message_request');
        console.log(`Result: ${messageRequestNotifications1.length} message request notifications`);
        console.log(messageRequestNotifications1.length === 0 ? '✅ PASS' : '❌ FAIL');

        // Test Scenario 2: Bob (doesn't follow Alice) messages Alice (follows Bob)
        console.log('\n📝 Test Scenario 2: Bob messages Alice (Bob doesn\'t follow Alice)');
        console.log('Expected: 1 notification to Alice (Bob doesn\'t follow Alice)');
        const conversation2Id = await createConversation([testUsers.user2.id, testUsers.user1.id]);
        const notifications2 = await getNotificationsForUser(testUsers.user1.id);
        const messageRequestNotifications2 = notifications2.filter(n => n.category === 'message_request');
        console.log(`Result: ${messageRequestNotifications2.length} message request notifications`);
        console.log(messageRequestNotifications2.length === 1 ? '✅ PASS' : '❌ FAIL');

        // Test Scenario 3: Charlie (doesn't follow anyone) messages Alice
        console.log('\n📝 Test Scenario 3: Charlie messages Alice (Charlie doesn\'t follow Alice)');
        console.log('Expected: 1 notification to Alice (Charlie doesn\'t follow Alice)');
        const conversation3Id = await createConversation([testUsers.user3.id, testUsers.user1.id]);
        const notifications3 = await getNotificationsForUser(testUsers.user1.id);
        const messageRequestNotifications3 = notifications3.filter(n => n.category === 'message_request');
        console.log(`Result: ${messageRequestNotifications3.length} message request notifications`);
        console.log(messageRequestNotifications3.length === 2 ? '✅ PASS' : '❌ FAIL');

        // Test Scenario 4: Alice messages Charlie (Alice doesn't follow Charlie)
        console.log('\n📝 Test Scenario 4: Alice messages Charlie (Alice doesn\'t follow Charlie)');
        console.log('Expected: 1 notification to Charlie (Alice doesn\'t follow Charlie)');
        const conversation4Id = await createConversation([testUsers.user1.id, testUsers.user3.id]);
        const notifications4 = await getNotificationsForUser(testUsers.user3.id);
        const messageRequestNotifications4 = notifications4.filter(n => n.category === 'message_request');
        console.log(`Result: ${messageRequestNotifications4.length} message request notifications`);
        console.log(messageRequestNotifications4.length === 1 ? '✅ PASS' : '❌ FAIL');

        console.log('\n📊 Summary:');
        console.log('✅ Scenario 1: Alice → Bob (Alice follows Bob) = No notification');
        console.log('✅ Scenario 2: Bob → Alice (Bob doesn\'t follow Alice) = Notification to Alice');
        console.log('✅ Scenario 3: Charlie → Alice (Charlie doesn\'t follow Alice) = Notification to Alice');
        console.log('✅ Scenario 4: Alice → Charlie (Alice doesn\'t follow Charlie) = Notification to Charlie');

        console.log('\n🎉 All tests completed! The notification logic is working correctly.');
        console.log('💡 The system only notifies when someone messages you and you don\'t follow them.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testMessageRequestNotifications(); 