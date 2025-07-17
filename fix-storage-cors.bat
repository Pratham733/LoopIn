@echo off
echo Fixing Firebase Storage CORS Configuration
echo =========================================
echo.
echo This will configure Firebase Storage to allow requests from your Vercel domain.
echo.
echo Prerequisites:
echo 1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
echo 2. Login to Google Cloud: gcloud auth login
echo 3. Set your project: gcloud config set project loopinchat
echo.
echo Then run this command:
echo gsutil cors set fix-storage-cors.json gs://loopinchat.firebasestorage.app
echo.
echo This will allow your app to upload files to Firebase Storage.
echo.
pause 