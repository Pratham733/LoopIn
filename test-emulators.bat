@echo off
echo =====================================================
echo Firebase Emulator Connection Test
echo =====================================================

echo Setting environment variables for emulator mode...
set USE_FIREBASE_EMULATOR=true
set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

echo Using IPv4 for emulator connections...
set NODE_OPTIONS=--dns-result-order=ipv4first

echo Setting emulator hosts...
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199

echo Running test script...
npx tsx src/test-emulators.ts

echo.
echo Test completed!
echo =====================================================

pause
