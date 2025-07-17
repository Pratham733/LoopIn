import { NextRequest, NextResponse } from 'next/server';
import { testServerEmulators } from '@/lib/test-emulators-api';

/**
 * API route for testing Firebase emulator connectivity
 * 
 * This endpoint can be called from the browser to test both server-side
 * and client-side emulator connectivity in one go.
 */
export async function GET(request: NextRequest) {
  try {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        error: 'This endpoint is only available in development mode'
      }, { status: 403 });
    }

    // Check if emulator mode is enabled
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                       process.env.USE_FIREBASE_EMULATOR === 'true';
                       
    if (!useEmulator) {
      return NextResponse.json({
        error: 'Emulator mode is not enabled',
        message: 'Set USE_FIREBASE_EMULATOR=true or NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true'
      }, { status: 400 });
    }    // We now have a direct import from our API-friendly module
    console.log('Starting server-side emulator tests...');
    
    // Run server-side emulator connectivity tests
    const serverResults = await testServerEmulators();
    
    return NextResponse.json({
      success: true,
      serverEmulators: serverResults,
      message: 'Check the server logs for detailed test results'
    });
  } catch (error) {
    console.error('Error in emulator test API:', error);
    return NextResponse.json({
      error: 'Failed to test emulator connectivity',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
