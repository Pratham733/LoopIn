@echo off
echo =======================================================
echo Firebase Emulator Advanced Setup and Diagnostics
echo =======================================================

:: Check for administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script requires administrator privileges for some network diagnostics.
    echo Right-click the script and select "Run as administrator".
    pause
    exit /b
)

echo Setting JAVA_HOME environment variable...

:: Set JAVA_HOME to the Temurin JDK path
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot
echo JAVA_HOME set to: %JAVA_HOME%

:: Add Java to the PATH
set PATH=%JAVA_HOME%\bin;%PATH%

:: Configure Node.js to prefer IPv4
echo Configuring Node.js to prefer IPv4 addresses...
set NODE_OPTIONS=--dns-result-order=ipv4first

:: Display network information for diagnostics
echo.
echo =======================================================
echo NETWORK DIAGNOSTICS
echo =======================================================

echo IPv4 Address:
ipconfig | findstr "IPv4"

echo.
echo Checking localhost resolution...
ping localhost -4

echo.
echo Checking 127.0.0.1...
ping 127.0.0.1

echo.
echo Checking for existing processes on emulator ports...
netstat -ano | findstr "8080"
netstat -ano | findstr "9099"
netstat -ano | findstr "9199"

:: Set environment variables for emulator mode
echo.
echo =======================================================
echo SETTING ENVIRONMENT VARIABLES
echo =======================================================
echo Setting environment variables for emulator mode...
set USE_FIREBASE_EMULATOR=true
set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

:: Set specific IPv4 addresses for emulators with double-check
echo Setting explicit IPv4 addresses for emulators...

:: Setting and verifying Firestore emulator host
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
echo Firestore Emulator: %FIRESTORE_EMULATOR_HOST% (verifying port...)
netstat -ano | findstr "8080"

:: Setting and verifying Auth emulator host
set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
echo Auth Emulator: %FIREBASE_AUTH_EMULATOR_HOST% (verifying port...)
netstat -ano | findstr "9099"

:: Setting and verifying Storage emulator host
set FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
set NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
echo Storage Emulator: %FIREBASE_STORAGE_EMULATOR_HOST% (verifying port...)
netstat -ano | findstr "9199"

:: Verify Java version
echo.
echo =======================================================
echo JAVA VERIFICATION
echo =======================================================
echo Verifying Java installation...
java -version

echo.
echo =======================================================
echo STARTING FIREBASE EMULATORS WITH IPV4 BINDINGS
echo =======================================================
echo The emulator UI will be available at: http://127.0.0.1:4000
echo Firestore: http://127.0.0.1:8080
echo Auth:      http://127.0.0.1:9099
echo Storage:   http://127.0.0.1:9199
echo =======================================================

:: Start Firebase emulators with explicit IPv4 binding and additional options
echo Starting emulators with explicit IPv4 binding...
firebase emulators:start --import=./firebase-data --export-on-exit=./firebase-data --only auth,firestore,storage --host 127.0.0.1

echo.
echo If emulators failed to start, try running these commands manually:
echo 1. firebase emulators:start --host=127.0.0.1
echo 2. In a new command prompt: npm run dev

pause
