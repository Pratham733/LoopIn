/**
 * Test script for the notification system
 * This script tests all notification types to ensure they're working correctly
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

// Firebase configuration (use your actual config)
const firebaseConfig = {
    // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test users
const testUsers = {
    user1: {
        id: 'test-user-1',
        username: 'testuser1',
        email: 'test1@example.com',
        status: 'online',
        followers: [],
        following: [],
        bio: 'Test user 1',
        isPrivate: false,
        savedPosts: []
    },
    user2: {
        id: 'test-user-2',
        username: 'testuser2',
        email: 'test2@example.com',
        status: 'online',
        followers: [],
        following: [],
        bio: 'Test user 2',
        isPrivate: true,
        savedPosts: []
    }
};

// Test notification function
async function addTestNotification(userId, notificationData) {
    try {
        const notificationsColRef = collection(db, 'users', userId, 'notifications');
        await addDoc(notificationsColRef, {
            ...notificationData,
            isRead: false,
            timestamp: serverTimestamp(),
        });
        console.log(`✅ ${notificationData.category} notification added for ${userId}`);
    } catch (error) {
        console.error(`❌ Failed to add ${notificationData.category} notification:`, error);
    }
}

// Test all notification types
async function testAllNotifications() {
    console.log('🧪 Testing Notification System...\n');

    // 1. Test FOLLOW_REQUEST notification
    console.log('1. Testing FOLLOW_REQUEST notification...');
    await addTestNotification(testUsers.user2.id, {
        category: 'follow_request',
        title: 'New Follow Request',
        message: `${testUsers.user1.username} has requested to follow you.`,
        actor: testUsers.user1,
        link: `/chat/profile/${testUsers.user1.id}`,
        icon: undefined
    });

    // 2. Test FOLLOW notification
    console.log('\n2. Testing FOLLOW notification...');
    await addTestNotification(testUsers.user1.id, {
        category: 'follow',
        title: 'New Follower',
        message: `${testUsers.user2.username} started following you.`,
        actor: testUsers.user2,
        link: `/chat/profile/${testUsers.user2.id}`,
        icon: undefined
    });

    // 3. Test POST_LIKE notification
    console.log('\n3. Testing POST_LIKE notification...');
    await addTestNotification(testUsers.user1.id, {
        category: 'post_like',
        title: 'New Like',
        message: `${testUsers.user2.username} liked your post.`,
        actor: testUsers.user2,
        link: `/chat/profile/${testUsers.user1.id}/posts`,
        icon: undefined
    });

    // 4. Test POST_COMMENT notification
    console.log('\n4. Testing POST_COMMENT notification...');
    await addTestNotification(testUsers.user1.id, {
        category: 'post_comment',
        title: 'New Comment',
        message: `${testUsers.user2.username} commented on your post.`,
        actor: testUsers.user2,
        link: `/chat/profile/${testUsers.user1.id}/posts`,
        icon: undefined
    });

    // 5. Test POST_TAG notification (NEW)
    console.log('\n5. Testing POST_TAG notification...');
    await addTestNotification(testUsers.user1.id, {
        category: 'post_tag',
        title: 'You were tagged in a post',
        message: `${testUsers.user2.username} tagged you in their post.`,
        actor: testUsers.user2,
        link: `/chat/profile/${testUsers.user2.id}/posts`,
        icon: undefined
    });

    // 6. Test MESSAGE notification (post share)
    console.log('\n6. Testing MESSAGE notification (post share)...');
    await addTestNotification(testUsers.user2.id, {
        category: 'message',
        title: 'Post Shared with You',
        message: `${testUsers.user1.username} shared a post with you.`,
        actor: testUsers.user1,
        link: `/chat/conversations`,
        icon: undefined
    });

    // 7. Test MESSAGE_REQUEST notification (NEW)
    console.log('\n7. Testing MESSAGE_REQUEST notification...');
    await addTestNotification(testUsers.user1.id, {
        category: 'message_request',
        title: 'New Message Request',
        message: `${testUsers.user2.username} wants to send you a message but doesn't follow you.`,
        actor: testUsers.user2,
        link: `/chat/conversations`,
        icon: undefined
    });

    console.log('\n🎉 All notification tests completed!');
    console.log('\n📋 Summary of notification types tested:');
    console.log('   • FOLLOW_REQUEST - Friend requests to private accounts');
    console.log('   • FOLLOW - New followers and request responses');
    console.log('   • POST_LIKE - When someone likes your post');
    console.log('   • POST_COMMENT - When someone comments on your post');
    console.log('   • POST_TAG - When someone tags you in their post (NEW)');
    console.log('   • MESSAGE - When someone shares a post with you');
    console.log('   • MESSAGE_REQUEST - When someone who doesn\'t follow you tries to message (NEW)');
    console.log('\n💡 Check the notification bell in the app to see these notifications!');
}

// Run the tests
testAllNotifications().catch(console.error); 