# Firebase Configuration Guide

This document explains how to properly configure Firebase for this application.

## Client-side Firebase Configuration

The client-side Firebase configuration requires the following environment variables to be set in your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

You can find these values in your Firebase project settings under "Your apps" > "SDK setup and configuration".

## Server-side Firebase Admin SDK Configuration

For server-side Firebase functionality, you need to set up Firebase Admin SDK credentials. There are two ways to do this:

### Option 1: Using a Service Account JSON (Recommended)

1. Go to your Firebase project settings > Service accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Set the content of the JSON file as an environment variable:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
```

### Option 2: Using Application Default Credentials

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Set up application default credentials: `firebase login:ci`
4. Set the path to your credentials file:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json
```

## Using Firebase Emulators for Development

To speed up development and avoid using your production Firebase resources, you can use Firebase's local emulators.

### Setting up Emulators

1. **Install Firebase CLI** globally if you haven't already:
   ```
   npm install -g firebase-tools
   ```

2. **Enable emulator mode** in your `.env.local`:
   ```
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   USE_FIREBASE_EMULATOR=true
   ```

3. **Start the emulators** using the provided script:
   ```
   ./start-emulators.bat
   ```

This will start emulator instances for Firestore, Auth, and Storage with data persistence between restarts.

### Emulator URLs

When emulators are running, they'll be available at:
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

### Testing your Firebase Setup

You can test both client-side and server-side Firebase connections by visiting:
```
http://localhost:3000/api/test-firebase
```

This endpoint will verify:
1. Client-side Firebase initialization and Firestore access
2. Server-side Firebase Admin SDK initialization
3. Server-side Firestore database access

## Testing Your Firebase Configuration

1. After setting up your environment variables, restart your development server.
2. Navigate to `/api/test-firebase` to verify that both client-side and server-side Firebase connections are working.

## Common Issues and Solutions

### Client-side Firebase Issues

- **"Firebase config is missing or incomplete"**: Check that all NEXT_PUBLIC_FIREBASE_* environment variables are set in your .env.local file.
- **"Could not reach Cloud Firestore backend"**: Check your internet connection. If using Firebase emulators, ensure they are running.

### Server-side Firebase Admin Issues

- **"Could not load the default credentials"**: Ensure you have set up either FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS properly.
- **"Failed to initialize Firebase Admin with credentials"**: Verify that your service account has the necessary permissions in Firebase.


