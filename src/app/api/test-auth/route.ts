import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/client';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let clientAuthStatus = 'Not authenticated';
    let serverAuthStatus = 'Not authenticated';
    let firebaseUser: any = null;
    
    if (token) {
      try {
        // Verify the token on the server side
        const decodedToken = await adminAuth.verifyIdToken(token);
        serverAuthStatus = `Authenticated as ${decodedToken.uid}`;
        firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        };
      } catch (error) {
        serverAuthStatus = `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      clientAuthStatus,
      serverAuthStatus,
      firebaseUser,
      hasToken: !!token,
      environment: process.env.NODE_ENV,
      usingEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 