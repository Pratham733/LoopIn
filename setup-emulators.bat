@echo off
echo ===================================
echo Firebase Emulator Setup Utility
echo ===================================
echo.

if not exist .env.local (
  echo Creating .env.local from example...
  copy .env.local.example .env.local
  echo .env.local created successfully!
  echo.
) else (
  echo .env.local exists already.
)

echo Installing required dependencies...
call npm install -g firebase-tools
call npm install cross-env

echo.
echo Clearing browser data may help avoid persistence errors.
echo Please close all instances of your browser before continuing.
echo.
pause

echo.
echo Creating firebase-data directory if it doesn't exist...
if not exist firebase-data mkdir firebase-data

echo.
echo Starting Firebase emulators...
echo IMPORTANT: Keep this terminal window open while developing!
echo.
echo Starting emulators in 3 seconds...
timeout /t 3 /nobreak
start cmd /k "color 0A && echo FIREBASE EMULATORS && echo. && firebase emulators:start --import=./firebase-data --export-on-exit=./firebase-data"

echo.
echo Waiting for emulators to start...
echo This may take up to 30 seconds...
timeout /t 20 /nobreak

echo.
echo Setting up test data in emulators...
call node setup-emulator-data.mjs

echo.
echo ==================================
echo Setup complete!
echo ==================================
echo.
echo Now you can run the app with emulators:
echo npm run dev:emulator
echo.
echo TROUBLESHOOTING:
echo - If you see database connection errors, restart your browser
echo - Make sure the emulator console shows "All emulators ready!"
echo - If problems persist, try "npm cache clean --force" then restart
echo.
echo Press any key to exit...
pause > nul
