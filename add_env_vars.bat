@echo off
echo Adding environment variables to Vercel...

vercel env add NEXT_PUBLIC_FIREBASE_API_KEY "AIzaSyA3AAZt-UDNFhORSM4dBy7TUvJukNabH-w"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "loopinchat.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID "loopinchat"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "loopinchat.firebasestorage.app"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "59902205122"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID "1:59902205122:web:652d49cb3b15305041ef5b"
vercel env add GMAIL_USER "spratham388@gmail.com"
vercel env add GMAIL_APP_PASSWORD "oysfagdbprihazcn"
vercel env add ADMIN_EMAIL "spratham388@gmail.com"
vercel env add APP_NAME "LoopIn"
vercel env add NEXT_PUBLIC_APP_URL "https://loopin-five.vercel.app"
vercel env add NEXT_PUBLIC_USE_FIREBASE_EMULATOR "false"
vercel env add USE_FIREBASE_EMULATOR "false"
vercel env add NEXT_PUBLIC_SKIP_FIRESTORE_PERSISTENCE "false"

echo.
echo All environment variables have been processed.
echo Please check for any errors above.
echo If successful, redeploy with 'vercel --prod'.
