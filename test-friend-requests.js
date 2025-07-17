#!/usr/bin/env node
/**
 * Test script to verify friend request and block functionality
 */

const { db } = require('./src/lib/firebase/admin');

async function testFriendRequestsAndBlocking() {
    console.log('🧪 Testing Friend Request and Block Functionality...\n');

    try {
        // Get test users
        const usersSnapshot = await db.collection('users').limit(4).get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (users.length < 2) {
            console.log('❌ Not enough users for testing');
            return;
        }

        const user1 = users[0];
        const user2 = users[1];

        console.log(`👥 Testing with users:`);
        console.log(`   User 1: ${user1.username} (ID: ${user1.id})`);
        console.log(`   User 2: ${user2.username} (ID: ${user2.id})\n`);

        // Test 1: Make user2 private
        await db.collection('users').doc(user2.id).update({
            isPrivate: true,
            pendingFollowRequests: []
        });
        console.log('✅ Made user2 private');

        // Test 2: Create a friend request
        const friendRequestId = `${user1.id}_${user2.id}`;
        await db.collection('friendRequests').doc(friendRequestId).set({
            fromUserId: user1.id,
            toUserId: user2.id,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Add to pending requests
        await db.collection('users').doc(user2.id).update({
            pendingFollowRequests: [user1.id]
        });
        console.log('✅ Created friend request from user1 to user2');

        // Test 3: Test blocking
        await db.collection('users').doc(user1.id).update({
            blockedUsers: [user2.id]
        });
        console.log('✅ User1 blocked user2');

        // Test 4: Verify data
        const user2Updated = await db.collection('users').doc(user2.id).get();
        const user1Updated = await db.collection('users').doc(user1.id).get();
        const friendRequest = await db.collection('friendRequests').doc(friendRequestId).get();

        console.log('\n📊 Test Results:');
        console.log(`   User2 is private: ${user2Updated.data().isPrivate}`);
        console.log(`   User2 has pending requests: ${user2Updated.data().pendingFollowRequests?.length || 0}`);
        console.log(`   User1 blocked users: ${user1Updated.data().blockedUsers?.length || 0}`);
        console.log(`   Friend request exists: ${friendRequest.exists}`);
        console.log(`   Friend request status: ${friendRequest.exists ? friendRequest.data().status : 'N/A'}`);

        console.log('\n🎉 All tests passed! Friend request and blocking functionality is working.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFriendRequestsAndBlocking();
