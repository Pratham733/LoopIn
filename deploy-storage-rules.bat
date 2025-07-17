@echo off
echo Deploying Firebase Storage Rules...
firebase deploy --only storage
echo Storage rules deployed successfully!
pause 