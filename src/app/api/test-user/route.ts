import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.id || !body.username || !body.email) {
      return NextResponse.json({ error: 'Missing required user data' }, { status: 400 });
    }
    
    const userData = {
      id: body.id,
      username: body.username.toLowerCase(),
      fullName: body.fullName || body.username,
      email: body.email.toLowerCase(),
      status: 'online',
      followers: [],
      following: [],
      bio: `Welcome to LoopIn!`,
      isPrivate: false,
      savedPosts: [],
      showCurrentlyPlaying: true,
    };

    // Add user to Firestore
    await setDoc(doc(db, 'users', userData.id), userData);
    
    // Verify data was saved correctly
    const firestoreUser = await getDoc(doc(db, 'users', userData.id));
    
    return NextResponse.json({ 
      status: 'Success',
      message: firestoreUser.exists() ? 'User created in Firebase successfully' : 'Failed to create user in Firebase',
      user: userData
    }, { status: 201 });  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ 
      status: 'Error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
