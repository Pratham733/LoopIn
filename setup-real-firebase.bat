@echo off
echo ===================================
echo Real Firebase Setup Utility
echo ===================================
echo.
echo This script will add test data to your REAL Firebase project.
echo.
echo WARNING: This will modify your actual Firebase database.
echo Only proceed if you understand what this does.
echo.
echo Press Ctrl+C to cancel or any key to continue...
pause > nul

echo.
echo Setting up test data in your real Firebase project...
node setup-real-firebase-data.mjs

echo.
echo ==================================
echo Setup complete!
echo ==================================
echo.
echo Your app should now connect to the real Firebase
echo project with sample test data.
echo.
echo You can run the app with:
echo npm run dev
echo.
echo Press any key to exit...
pause > nul
