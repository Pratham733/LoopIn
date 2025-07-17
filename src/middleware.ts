import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware: Processing request for ${pathname}`);

  // Handle CORS for all requests
  const response = NextResponse.next();
  
  // Add CORS headers to handle Firebase emulator communication
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // The root path "/" is now our main authentication page, so we don't redirect it.
  // We only redirect /login and /signup to the root page to unify the auth flow.
  if (pathname === '/login' || pathname === '/signup') {
    console.log(`Middleware: Redirecting ${pathname} to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If the user tries to access /chat directly without being "authenticated",
  // you might want to redirect them to the login page.
  // For this mock app, we'll let them through, but in a real app, you'd add auth checks here.
  if (pathname.startsWith('/chat')) {
    // Here we could check for a session cookie and redirect if not authenticated
    // For now, we'll just let them through and the client-side auth will handle it
    console.log('Middleware: Allowing access to chat route');
  }

  // Add a diagnostic header to help with debugging
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export const config = {
  // Match these routes to handle redirection and potentially check authentication
  matcher: ['/login', '/signup', '/chat/:path*'],
};
