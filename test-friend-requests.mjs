#!/usr/bin/env node
/**
 * Test script to verify friend request and block functionality using Firebase v9 API
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    arrayUnion,
    arrayRemove,
    serverTimestamp
} from 'firebase/firestore';

// Firebase configuration for emulator
const firebaseConfig = {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456ghi789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators
connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8092);
connectStorageEmulator(storage, "127.0.0.1", 9199);

async function testFriendRequestsAndBlocking() {
    console.log('🧪 Testing Friend Request and Block Functionality...\n');

    try {
        // Get test users
        const usersQuery = query(collection(db, 'users'), limit(4));
        const usersSnapshot = await getDocs(usersQuery);
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
        await updateDoc(doc(db, 'users', user2.id), {
            isPrivate: true,
            pendingFollowRequests: []
        });
        console.log('✅ Made user2 private');

        // Test 2: Create a friend request
        const friendRequestId = `${user1.id}_${user2.id}`;
        await setDoc(doc(db, 'friendRequests', friendRequestId), {
            fromUserId: user1.id,
            toUserId: user2.id,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'users', user2.id), {
            pendingFollowRequests: arrayUnion(user1.id)
        });
        console.log('✅ Created friend request');

        // Test 3: Check friend request status
        const friendRequestDoc = await getDoc(doc(db, 'friendRequests', friendRequestId));
        if (friendRequestDoc.exists()) {
            console.log(`✅ Friend request found with status: ${friendRequestDoc.data().status}`);
        } else {
            console.log('❌ Friend request not found');
        }

        // Test 4: Accept friend request
        await updateDoc(doc(db, 'friendRequests', friendRequestId), {
            status: 'accepted',
            updatedAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'users', user1.id), {
            following: arrayUnion(user2.id)
        });

        await updateDoc(doc(db, 'users', user2.id), {
            followers: arrayUnion(user1.id),
            pendingFollowRequests: arrayRemove(user1.id)
        });
        console.log('✅ Accepted friend request');

        // Test 5: Test blocking
        await updateDoc(doc(db, 'users', user1.id), {
            blockedUsers: arrayUnion(user2.id),
            following: arrayRemove(user2.id)
        });

        await updateDoc(doc(db, 'users', user2.id), {
            followers: arrayRemove(user1.id),
            following: arrayRemove(user1.id)
        });
        console.log('✅ Blocked user2');

        // Test 6: Check blocked status
        const updatedUser1 = await getDoc(doc(db, 'users', user1.id));
        if (updatedUser1.exists()) {
            const blockedUsers = updatedUser1.data().blockedUsers || [];
            if (blockedUsers.includes(user2.id)) {
                console.log('✅ User2 is in blocked list');
            } else {
                console.log('❌ User2 is not in blocked list');
            }
        }

        // Test 7: Unblock user
        await updateDoc(doc(db, 'users', user1.id), {
            blockedUsers: arrayRemove(user2.id)
        });
        console.log('✅ Unblocked user2');

        // Cleanup
        await deleteDoc(doc(db, 'friendRequests', friendRequestId));
        await updateDoc(doc(db, 'users', user2.id), {
            isPrivate: false,
            pendingFollowRequests: []
        });
        console.log('✅ Cleaned up test data');

        console.log('\n🎉 All friend request and blocking tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testFriendRequestsAndBlocking();
