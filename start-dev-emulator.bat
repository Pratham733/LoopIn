@echo off
echo Starting Next.js development server with Firebase emulators...
echo.

set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
set USE_FIREBASE_EMULATOR=true

echo Environment variables set:
echo NEXT_PUBLIC_USE_FIREBASE_EMULATOR=%NEXT_PUBLIC_USE_FIREBASE_EMULATOR%
echo USE_FIREBASE_EMULATOR=%USE_FIREBASE_EMULATOR%
echo.

echo Starting development server on http://localhost:3000
echo.

npx next dev --turbopack -p 3000
