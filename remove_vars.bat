@echo off
echo Removing potentially conflicting environment variables...

vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY -y
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN -y
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID -y

echo.
echo Cleanup finished. You can ignore any "not found" errors.
echo Now, please run add_env_vars.bat again.
