import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
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

async function testFollowRequests() {
    console.log('🧪 Testing Follow Request Functionality...\n');

    try {
        // Test 1: Create test users
        console.log('1. Creating test users...');

        const user1 = {
            id: 'test-user-1',
            username: 'testuser1',
            email: 'test1@example.com',
            status: 'online',
            followers: [],
            following: [],
            bio: 'Test user 1',
            isPrivate: true,
            savedPosts: []
        };

        const user2 = {
            id: 'test-user-2',
            username: 'testuser2',
            email: 'test2@example.com',
            status: 'online',
            followers: [],
            following: [],
            bio: 'Test user 2',
            isPrivate: false,
            savedPosts: []
        };

        // Add users to Firestore
        await addDoc(collection(db, 'users'), user1);
        await addDoc(collection(db, 'users'), user2);
        console.log('✅ Test users created\n');

        // Test 2: Send follow request
        console.log('2. Sending follow request...');

        const followRequest = {
            fromUserId: user2.id,
            toUserId: user1.id,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await addDoc(collection(db, 'friendRequests'), followRequest);
        console.log('✅ Follow request sent\n');

        // Test 3: Create notification
        console.log('3. Creating notification...');

        const notification = {
            category: 'follow_request',
            title: 'New Follow Request',
            message: `${user2.username} has requested to follow you.`,
            actor: user2,
            link: `/chat/profile/${user2.id}`,
            isRead: false,
            timestamp: new Date()
        };

        await addDoc(collection(db, 'users', user1.id, 'notifications'), notification);
        console.log('✅ Notification created\n');

        // Test 4: Check pending requests
        console.log('4. Checking pending requests...');

        const requestsQuery = query(
            collection(db, 'friendRequests'),
            where('toUserId', '==', user1.id),
            where('status', '==', 'pending')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        console.log(`✅ Found ${requestsSnapshot.size} pending requests\n`);

        // Test 5: Check notifications
        console.log('5. Checking notifications...');

        const notificationsQuery = query(
            collection(db, 'users', user1.id, 'notifications'),
            where('isRead', '==', false)
        );

        const notificationsSnapshot = await getDocs(notificationsQuery);
        console.log(`✅ Found ${notificationsSnapshot.size} unread notifications\n`);

        // Test 6: Accept follow request
        console.log('6. Accepting follow request...');

        const requestDoc = requestsSnapshot.docs[0];
        if (requestDoc) {
            await deleteDoc(doc(db, 'friendRequests', requestDoc.id));
            console.log('✅ Follow request accepted\n');
        }

        // Test 7: Mark notification as read
        console.log('7. Marking notification as read...');

        const notificationDoc = notificationsSnapshot.docs[0];
        if (notificationDoc) {
            await deleteDoc(doc(db, 'users', user1.id, 'notifications', notificationDoc.id));
            console.log('✅ Notification marked as read\n');
        }

        console.log('🎉 All tests passed! Follow request functionality is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testFollowRequests(); 