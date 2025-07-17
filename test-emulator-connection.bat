@echo off
echo =======================================================
echo Firebase Emulator Connection Tester
echo =======================================================

:: Set IPv4 preference for Node.js
set NODE_OPTIONS=--dns-result-order=ipv4first

:: Set environment variables for emulator mode
set USE_FIREBASE_EMULATOR=true
set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

:: Set specific IPv4 addresses for emulators
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
set NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199

echo Testing emulator connectivity...

:: Run the test script
npx tsx src/test-emulators.ts

echo.
echo You can also visit http://localhost:3000/test-emulators to test 
echo client-side emulator connectivity in the browser.
echo.

pause
