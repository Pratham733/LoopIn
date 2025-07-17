import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
    }
    
    // Query Firestore for users with this username
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    // If we found any users with this username, it's taken
    const isTaken = !querySnapshot.empty;
    
    return NextResponse.json({ isTaken }, { status: 200 });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Failed to check username availability' }, { status: 500 });
  }
}
