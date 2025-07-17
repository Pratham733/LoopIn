@echo off
echo Fixing Production Deployment
echo ===========================
echo.
echo The issue is that your deployment is trying to use Firebase emulators
echo which don't exist in production. Here's what we've done:
echo.
echo ✅ Removed emulator environment variables from Vercel
echo ✅ Your app will now use real Firebase in production
echo.
echo Next steps:
echo.
echo 1. Add Firebase Service Account JSON to Vercel:
echo    - Run: add-firebase-service-account.bat
echo    - Follow the instructions to get the service account JSON
echo    - Add it to Vercel with: vercel env add FIREBASE_SERVICE_ACCOUNT
echo.
echo 2. Redeploy your application:
echo    vercel --prod
echo.
echo 3. Test your profile page - it should now work without permission errors
echo.
echo Note: Your local development will still use emulators (which is good)
echo but production will use real Firebase.
echo.
pause 