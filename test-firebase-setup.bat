@echo off
echo Testing Firebase Configuration...
echo.

:: Check if the .env.local file exists
if not exist .env.local (
  echo [ERROR] .env.local file not found!
  echo Please copy .env.example to .env.local and fill in your Firebase configuration.
  exit /b 1
)

:: Check for required environment variables
findstr /C:"NEXT_PUBLIC_FIREBASE_API_KEY" .env.local > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [MISSING] NEXT_PUBLIC_FIREBASE_API_KEY not found in .env.local
  set ERROR=1
)

findstr /C:"NEXT_PUBLIC_FIREBASE_PROJECT_ID" .env.local > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [MISSING] NEXT_PUBLIC_FIREBASE_PROJECT_ID not found in .env.local
  set ERROR=1
)

:: Check for Firebase Admin credentials
findstr /C:"FIREBASE_SERVICE_ACCOUNT" .env.local > nul 2>&1
set FOUND_SERVICE_ACCOUNT=%ERRORLEVEL%

findstr /C:"GOOGLE_APPLICATION_CREDENTIALS" .env.local > nul 2>&1
set FOUND_CREDS_PATH=%ERRORLEVEL%

:: Check if at least one of the admin credential options is set
if %FOUND_SERVICE_ACCOUNT% NEQ 0 (
  if %FOUND_CREDS_PATH% NEQ 0 (
    echo [WARNING] No Firebase Admin credentials found.
    echo Either FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS should be set.
    echo Consider using emulators for development by setting:
    echo NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
    echo USE_FIREBASE_EMULATOR=true
  )
)

:: Check for emulator settings
findstr /C:"NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true" .env.local > nul 2>&1
set FOUND_EMULATOR=%ERRORLEVEL%

if %FOUND_EMULATOR% EQU 0 (
  echo [INFO] Emulator mode is enabled.
  echo Make sure to start emulators with: ./start-emulators.bat
)

echo.
echo Testing Firebase connections...
echo.
echo Making request to /api/test-firebase endpoint...
echo.
curl -s http://localhost:3000/api/test-firebase | findstr . || echo Failed to connect to test endpoint

echo.
if defined ERROR (
  echo [ERROR] Some Firebase configuration is missing. Please review the warnings above.
) else (
  echo [SUCCESS] Firebase configuration checks completed.
  echo Visit http://localhost:3000/api/test-firebase in your browser for detailed test results.
)
echo.
