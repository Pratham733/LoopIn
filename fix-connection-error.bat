@echo off
echo =======================================================
echo FIREBASE CONNECTION ERROR FIXER
echo =======================================================

echo This script will fix the "Could not reach Cloud Firestore backend" error
echo by restarting your emulators and Next.js server properly.

echo.
echo Step 1: Checking for running processes...
echo.

taskkill /F /IM node.exe >nul 2>&1
echo All Node.js processes terminated.

echo.
echo Step 2: Setting up environment variables for IPv4 only...
echo.

:: Configure Node.js to prefer IPv4
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

echo Environment variables set to use 127.0.0.1 instead of localhost.

echo.
echo Step 3: Running network diagnostics...
echo.

node debug-emulator.js

echo.
echo Step 4: Starting emulators with IPv4 binding...
echo.

start cmd /k "echo Starting Firebase Emulators... && firebase emulators:start --import=./firebase-data --export-on-exit=./firebase-data --host=127.0.0.1"

echo.
echo Waiting 10 seconds for emulators to start...
timeout /t 10 /nobreak > nul

echo.
echo Step 5: Starting Next.js development server...
echo.

start cmd /k "echo Starting Next.js... && set NODE_OPTIONS=--dns-result-order=ipv4first && npm run dev"

echo.
echo =======================================================
echo All processes started! 
echo =======================================================
echo.
echo If your application is still having connectivity issues:
echo 1. Close both command windows that opened
echo 2. Try running with a different port:
echo    - firebase emulators:start --host=127.0.0.1 --project demo-project
echo.
echo Then open your browser to:
echo http://localhost:3000/test-emulators
echo.
echo This page will let you test connectivity to all emulators.
echo =======================================================

pause
