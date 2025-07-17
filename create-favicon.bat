@echo off
echo Creating Favicon from Logo
echo ========================
echo.
echo To fix the tab icon, you need to:
echo.
echo 1. Convert your logo.png to favicon.ico format
echo 2. Replace the current favicon.ico file
echo.
echo You can do this by:
echo.
echo Option A: Use an online converter
echo - Go to: https://favicon.io/favicon-converter/
echo - Upload your logo.png file
echo - Download the generated favicon.ico
echo - Replace the file in public/favicon.ico
echo.
echo Option B: Use a local tool
echo - Install a favicon generator tool
echo - Convert logo.png to favicon.ico
echo - Replace the file in public/favicon.ico
echo.
echo Option C: Manual replacement
echo - Create a 32x32 or 16x16 version of your logo
echo - Save it as favicon.ico in the public folder
echo.
echo After replacing the favicon.ico file, redeploy your app:
echo vercel --prod
echo.
pause 