@echo off
echo Updating model files to Firebase-compatible versions...
copy src\models\ChatNew.ts src\models\Chat.ts
copy src\models\PostNew.ts src\models\Post.ts
echo Done!
