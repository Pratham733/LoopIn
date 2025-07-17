# LoopIn Chat

A modern chat application built with Firebase.

## Architecture Overview

This application uses a Firebase-based architecture:

- **Firebase Authentication**: Used for user management and authentication
- **Firebase Firestore**: Used for data storage and real-time features
- **Firebase Storage**: Used for file uploads and media storage

> **Note**: This project uses a special setup for Firebase with Next.js to handle Node.js modules properly.  
> See [Firebase in Next.js](./docs/firebase-nextjs.md) for details on the implementation.
>
> **Offline Support**: This application supports offline functionality with Firebase.  
> See [Working Offline](./docs/offline-support.md) for details on offline capabilities and testing.

## Setting Up

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Set up your `.env.local` file with:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Service Account (for server-side operations)
# Generate from: Firebase Console → Project Settings → Service Accounts → Generate new private key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
```

4. Run the development server:

```bash
npm run dev
```

## Firebase Architecture

This project leverages Firebase's comprehensive ecosystem:

1. **Authentication**: Uses Firebase Authentication for secure user management
2. **User Profiles**: Stored in Firestore with efficient querying
3. **Chats & Messages**: Real-time conversations powered by Firestore
4. **Real-time Updates**: Leverages Firestore's real-time listeners
5. **Media Storage**: Uses Firebase Storage for media files

## API Routes

- `/api/users`: Manage user profiles
- `/api/conversations`: Create and retrieve conversations
- `/api/messages`: Send and retrieve messages

## Data Strategy

The application uses Firestore's capabilities for efficient data management:

1. **User Creation**: When a user signs up, their profile is created in Firestore
2. **User Updates**: Profile updates are written using Firestore transactions
3. **Real-time Updates**: UI components listen to Firestore for real-time updates

## Firebase Security Rules

The application includes security rules for both Firestore and Storage to ensure data security:

### Deploying Firebase Rules

Run the deployment script to apply the security rules to your Firebase project:

```bash
deploy-firebase-rules.bat
```

Or manually deploy using Firebase CLI:

```bash
firebase deploy --only firestore:rules,storage:rules
```

### Security Rule Highlights

- **User Profiles**: Readable by anyone, writable only by the owner
- **Conversations**: Only accessible to participants
- **Messages**: Only accessible to conversation participants
- **Posts**: Readable by anyone, writable only by the author
- **Storage**: Enforces size limits and content types for uploaded files

## Testing Firebase Setup

To verify your Firebase configuration is working correctly:

```bash
npm run test-firebase
```

This will test both client-side and server-side Firebase connections to ensure your application is properly configured.

For server-side operations, make sure your `FIREBASE_SERVICE_ACCOUNT` environment variable is properly set in `.env.local`.
