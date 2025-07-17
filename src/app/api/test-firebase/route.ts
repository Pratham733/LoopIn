import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import ensureFirebaseAdmin from '@/lib/firebase/ensure-admin';

export async function GET(request: NextRequest) {  try {    // Test client-side Firebase connection
    console.log('Testing client-side Firebase connection...');
    const clientStatus = { 
      connected: false,
      usersCount: 0,
      error: null,
      usingEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
    };
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(5));
      const querySnapshot = await getDocs(q);
      
      const users: Array<{id: string; [key: string]: any}> = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      clientStatus.connected = true;
      clientStatus.usersCount = users.length;
      console.log(`Client-side Firebase found ${users.length} users`);
    } catch (error: any) {
      console.error('Error testing client-side Firebase:', error);
      clientStatus.error = error.message || String(error);
    }

    // Initialize admin SDK for server-side operations
    console.log('Testing server-side Firebase Admin connection...');
    const { adminDb, adminAuth } = await ensureFirebaseAdmin();
    
  // Test server-side admin SDK if available
    let adminStatus: {
      initialized: boolean;
      usersCount: number;
      error: string | null;
    } = {
      initialized: false,
      usersCount: 0,
      error: null
    };
    
    try {
      if (adminDb) {
        const adminUsersSnapshot = await adminDb.collection('users').limit(5).get();
        adminStatus = {
          initialized: true,
          usersCount: adminUsersSnapshot.size,
          error: null
        };
        console.log(`Admin SDK connected, found ${adminUsersSnapshot.size} users`);
      } else {
        console.log('Admin SDK not initialized');
      }
    } catch (adminError) {
      console.error('Error using Admin SDK:', adminError);
      adminStatus.error = adminError instanceof Error ? adminError.message : String(adminError);
    }    // Return diagnostic information
    return NextResponse.json({ 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      usingEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
      clientSide: clientStatus,
      serverSide: {
        adminInitialized: adminStatus.initialized,
        adminUsersCount: adminStatus.usersCount,
        adminError: adminStatus.error
      },
      environmentVariables: {
        // Check which environment variables are set (don't show values)
        projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 200 });  } catch (error) {
    console.error('Firebase connection error:', error);
    return NextResponse.json({ 
      status: 'Error connecting to Firebase',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
