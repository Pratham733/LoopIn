# Firebase Connection Error Handling

This document provides guidance on handling common Firebase connection issues, particularly the "400 errors" that can occur with Firestore's channels.

## Common Error: Status 400 on Firestore Listen/Channel

### Problem Description
You may see error messages like:
```
Failed to load resource: the server responded with a status of 400 ()
firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?gsessionid=...
```

### Causes
These 400 errors can occur for several reasons:
1. **Authentication token issues**: The Firebase auth token may be invalid or expired
2. **Multiple tabs/reconnection conflicts**: When a user opens multiple tabs or rapidly reconnects
3. **Network transitions**: Moving between networks or poor connectivity
4. **Firebase quota/rate limiting**: Hitting API limits with many reconnection attempts

### Our Solution
We've implemented a multi-layered approach:

1. **Channel Error Detection**: The `channel-handler.ts` module monitors all network requests to detect 400 errors specific to Firestore channels.

2. **Auto-Recovery**: When multiple 400 errors are detected in a short time, the system will:
   - Disable the Firestore network connection
   - Wait briefly
   - Re-enable the network connection
   - This forces Firebase to establish a fresh connection with new tokens

3. **Offline Persistence**: The app uses `enableMultiTabIndexedDbPersistence` to ensure data is available even when offline.

4. **Network Status Monitoring**: The `NetworkStatusBanner` component shows users when they're offline or having connection issues.

## How to Test

1. **Offline Mode**: Use browser DevTools to toggle "Offline" mode and see how the app handles it
2. **Poor Network Simulation**: Use the "Slow 3G" network throttling to simulate poor connections
3. **Multiple Tabs**: Open the app in several tabs to test multi-tab behavior

## User-facing Error Messages

When connection issues occur, users will see helpful messages:
- "You're currently offline. Some features may be limited."
- "Unable to retrieve user profile: Please check your internet connection"
- "Failed to get document because the client is offline."

These messages help users understand what's happening and what they can do about it.
