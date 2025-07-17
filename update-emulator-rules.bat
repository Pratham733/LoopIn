@echo off
echo Updating Firestore rules for emulator...

:: First, make a backup of the current rules file
copy /y firebase\firestore.rules firebase\firestore.rules.backup

:: Replace the current rules with the simplified emulator rules
copy /y firebase\firestore.rules.emulator firebase\firestore.rules

:: Run firebase emulators:exec to apply the rules
firebase emulators:exec --only firestore "echo Rules applied" --project demo-loopinchat

:: Restore the original rules file
copy /y firebase\firestore.rules.backup firebase\firestore.rules

echo Firestore emulator rules have been updated.
