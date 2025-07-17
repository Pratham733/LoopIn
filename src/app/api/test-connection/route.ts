import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase connection by listing collections
    const collectionNames: string[] = [];
    
    try {
      // Get collections by querying specific collections we know exist
      const usersQuery = await getDocs(collection(db, 'users'));
      if (!usersQuery.empty) {
        collectionNames.push('users');
      }
      
      // Try to get other collections you might have
      const postsQuery = await getDocs(collection(db, 'posts'));
      if (!postsQuery.empty) {
        collectionNames.push('posts');
      }
      
      const conversationsQuery = await getDocs(collection(db, 'conversations'));
      if (!conversationsQuery.empty) {
        collectionNames.push('conversations');
      }
    } catch (collectionsError) {
      console.warn('Error listing collections:', collectionsError);
    }
      return NextResponse.json({ 
      status: 'Connected to Firebase successfully',
      collections: collectionNames,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      database: 'Firestore'
    }, { status: 200 });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({ 
      status: 'Error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
