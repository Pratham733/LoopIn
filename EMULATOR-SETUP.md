# Firebase Emulator Setup Guide

This guide will help you set up Firebase emulators for local development, which will solve the Firebase connection issues you're experiencing.

## Quick Start

1. Create `.env.local` file from the example:
   ```
   copy .env.local.example .env.local
   ```

2. Run the setup script:
   ```
   setup-emulators.bat
   ```

3. In a separate terminal, start the app with emulator support:
   ```
   npm run dev:emulator
   ```

## Manual Setup Steps

If you prefer to set up manually, follow these steps:

1. Install the Firebase CLI globally:
   ```
   npm install -g firebase-tools
   ```

2. Install cross-env as a dev dependency:
   ```
   npm install --save-dev cross-env
   ```

3. Start the Firebase emulators:
   ```
   firebase emulators:start --import=./firebase-data --export-on-exit=./firebase-data
   ```

4. In a separate terminal, run the data setup script:
   ```
   node setup-emulator-data.mjs
   ```

5. Run the application with emulator configuration:
   ```
   npm run dev:emulator
   ```

## Using the Emulator UI

The Firebase Emulator UI is available at http://localhost:4000 when the emulators are running.

## Test User Accounts

The setup includes these test user accounts:

- Email: user1@example.com, Password: password123
- Email: user2@example.com, Password: password123
- Email: user3@example.com, Password: password123

## Troubleshooting

If you encounter issues:

1. Make sure all emulators are running (Auth, Firestore, Storage)
2. Check that the app is running with emulator environment variables
3. Try clearing your browser cache and refreshing

## How it Works

- The app uses the Firebase client and admin SDKs with special configurations when `USE_FIREBASE_EMULATOR=true`
- The emulators run local versions of Firebase services to avoid needing real credentials
- Data is persisted between emulator runs in the `/firebase-data` directory
