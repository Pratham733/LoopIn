@echo off
echo Firebase Service Account Setup for Vercel
echo ========================================
echo.
echo To fix the Firebase permission errors in your deployment:
echo.
echo 1. Go to Firebase Console: https://console.firebase.google.com
echo 2. Select your project: loopinchat
echo 3. Go to Project Settings (gear icon)
echo 4. Click "Service accounts" tab
echo 5. Click "Generate new private key"
echo 6. Download the JSON file
echo 7. Open the JSON file and copy its entire contents
echo.
echo Then run this command:
echo vercel env add FIREBASE_SERVICE_ACCOUNT
echo.
echo When prompted, paste the entire JSON content (not just the email)
echo.
echo This will fix the "Missing or insufficient permissions" errors.
echo.
pause 