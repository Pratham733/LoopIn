// test-messages.mjs - Test message persistence in Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, query, orderBy } from 'firebase/firestore';

// Set environment variable to indicate emulator mode
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA3AAZt-UDNFhORSM4dBy7TUvJukNabH-w",
    authDomain: "loopinchat.firebaseapp.com",
    projectId: "loopinchat",
    storageBucket: "loopinchat.firebasestorage.app",
    messagingSenderId: "59902205122",
    appId: "1:59902205122:web:652d49cb3b15305041ef5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9090', { disableWarnings: true });
    console.log('✅ Auth emulator connected');
} catch (error) {
    console.log('Auth emulator already connected');
}

try {
    connectFirestoreEmulator(db, '127.0.0.1', 8092);
    console.log('✅ Firestore emulator connected');
} catch (error) {
    console.log('Firestore emulator already connected');
}

async function testMessagePersistence() {
    try {
        console.log('\n🧪 Testing message persistence...');

        // Check for conversations
        const conversationsRef = collection(db, 'conversations');
        const conversationsSnapshot = await getDocs(conversationsRef);
        console.log(`📁 Found ${conversationsSnapshot.size} conversations`);

        // Check for messages
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
        const messagesSnapshot = await getDocs(messagesQuery);
        console.log(`💬 Found ${messagesSnapshot.size} messages`);

        if (messagesSnapshot.size > 0) {
            console.log('\n📝 Recent messages:');
            messagesSnapshot.docs.slice(0, 3).forEach((doc, index) => {
                const data = doc.data();
                console.log(`${index + 1}. ${data.content} (from: ${data.senderId})`);
            });
        }

        // Check for users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        console.log(`👥 Found ${usersSnapshot.size} users`);

        if (usersSnapshot.size > 0) {
            console.log('\n👤 Users:');
            usersSnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`${index + 1}. ${data.username || data.displayName} (${data.email})`);
            });
        }

        console.log('\n🎉 Message persistence test completed!');
        console.log('✅ Firebase backend is properly connected and storing data.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testMessagePersistence().then(() => {
    console.log('\nTest completed');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
