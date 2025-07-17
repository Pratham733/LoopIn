import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { collection, query, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Query Firestore for users using admin SDK
    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, limit(100));
    const querySnapshot = await getDocs(q);
    
    const users: Array<{id: string} & Omit<User, 'id'>> = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as {id: string} & Omit<User, 'id'>);
    });
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, username, profile } = body;
    
    if (!uid || !email || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists in Firestore using admin SDK
    const userRef = doc(adminDb, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // User already exists, no need to create
      return NextResponse.json({ success: true, message: 'User already exists' }, { status: 200 });
    } else {
      // Create or update the user profile
      const timestamp = new Date().toISOString();
      
      // Use provided profile or create a new one
      const userData = profile || {
        id: uid,
        username: username.toLowerCase(),
        fullName: username,
        email: email,
        status: 'online',
        bio: `Welcome to LoopIn!`,
        followers: [],
        following: [],
        isPrivate: false,
        savedPosts: [],
        showCurrentlyPlaying: true,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await setDoc(userRef, userData);
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created successfully' 
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
