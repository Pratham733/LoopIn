@echo off
echo ===== Deploying Firebase Rules =====

echo.
echo Checking if Firebase CLI is installed...
firebase --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Firebase CLI not found. Installing...
  npm install -g firebase-tools
)

echo.
echo Logging in to Firebase (if not already logged in)...
firebase login:list > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  firebase login
)

echo.
echo Selecting Firebase project...
firebase use --project %NEXT_PUBLIC_FIREBASE_PROJECT_ID%

echo.
echo Deploying Firestore Rules...
firebase deploy --only firestore:rules

echo.
echo Deploying Storage Rules...
firebase deploy --only storage:rules

echo.
echo ===== Firebase Rules Deployment Complete =====
echo.
