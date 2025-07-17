@echo off
echo =======================================================
echo Firebase Emulator Setup with IPv4 Configuration
echo =======================================================

echo Setting JAVA_HOME environment variable...

:: Set JAVA_HOME to the Temurin JDK path
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.7.6-hotspot
echo JAVA_HOME set to: %JAVA_HOME%

:: Add Java to the PATH
set PATH=%JAVA_HOME%\bin;%PATH%

:: Configure Node.js to prefer IPv4
echo Configuring Node.js to prefer IPv4 addresses...
set NODE_OPTIONS=--dns-result-order=ipv4first

:: Set environment variables for emulator mode
echo Setting environment variables for emulator mode...
set USE_FIREBASE_EMULATOR=true
set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

:: Set specific IPv4 addresses for emulators
echo Setting explicit IPv4 addresses for emulators...
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
set FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
set NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199

:: Verify Java version
echo Verifying Java installation...
java -version

echo =======================================================
echo Starting Firebase emulators with IPv4 bindings...
echo =======================================================
echo The emulator UI will be available at: http://127.0.0.1:4000
echo Firestore: http://127.0.0.1:8080
echo Auth:      http://127.0.0.1:9099
echo Storage:   http://127.0.0.1:9199
echo =======================================================

:: Start Firebase emulators with explicit IPv4 binding
firebase emulators:start --import=./firebase-data --export-on-exit=./firebase-data --only auth,firestore,storage

pause
