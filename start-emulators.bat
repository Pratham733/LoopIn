@echo off
echo ===================================
echo Firebase Emulator - Start Script
echo ===================================
echo.

:: Set up Java environment explicitly
echo Setting up Java environment...
for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk*") do (
  set JAVA_HOME=%%i
  goto :found_java
)

for /d %%i in ("C:\Program Files\Java\jdk*") do (
  set JAVA_HOME=%%i
  goto :found_java
)

echo Could not find Java installation automatically.
echo Trying with current environment...
goto :continue_setup

:found_java
echo Found Java at: %JAVA_HOME%
set PATH=%JAVA_HOME%\bin;%PATH%

:continue_setup
echo Java version:
java -version
echo.

:: Check if firebase-data directory exists, if not create it
if not exist firebase-data (
  echo Creating firebase-data directory...
  mkdir firebase-data
)

:: Check if firebase-tools is installed globally
call firebase --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Firebase CLI not found, installing...
  call npm install -g firebase-tools
)

echo.
echo Starting Firebase emulators with data persistence...
echo Press Ctrl+C to stop the emulators when done.
echo.

:: Clear the screen for cleaner output
cls
color 0A
echo ===========================================
echo FIREBASE EMULATORS
echo ===========================================
echo.
echo Starting emulators at:
echo - Firestore: http://127.0.0.1:8092
echo - Auth:      http://127.0.0.1:9090
echo - Storage:   http://127.0.0.1:9190
echo - UI:        http://127.0.0.1:4010
echo.
echo Loading...
echo.

:: Start emulators with data persistence and project ID
firebase emulators:start --project=loopinchat --import=./firebase-data --export-on-exit=./firebase-data

echo.
echo Firebase emulators stopped.
echo.
pause
