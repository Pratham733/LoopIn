# Working Offline with Firebase in LoopIn

This guide explains how the application handles offline scenarios and network disruptions.

## Offline Capabilities

The LoopIn app includes robust offline support through Firebase's offline persistence. Here's what to expect:

### What Works Offline

- **Reading previously loaded data**: Any content you've previously viewed will be available offline
- **Creating new posts/comments**: These will be queued and sent once you're back online
- **Liking posts**: Like operations will be synchronized when reconnected
- **Profile updates**: Profile changes are queued for when connectivity returns

### What Requires Connection

- **Initial data loading**: First-time loading of content requires a connection
- **Media uploads**: Adding images/videos requires connectivity
- **Creating new conversations**: Starting conversations with new users needs connectivity
- **Account operations**: Sign-up, login, and password changes require connectivity

## Testing Offline Mode

The app includes built-in tools to test offline functionality:

1. **Network Status Banner**: A banner shows your current connection status
   - Appears automatically when offline
   - In the Chat interface, it includes controls to simulate offline mode

2. **Connection Test Controls**:  
   - Click "Test Offline Mode" to simulate being offline
   - Click "Test Online Mode" to restore connectivity
   - Note: This only affects Firebase connectivity, not your actual network connection

3. **Browser Network Controls**:
   - Most browsers include network simulation in Developer Tools
   - Use Chrome DevTools > Network tab > "Offline" checkbox for a complete offline experience

## Troubleshooting

If you encounter issues with offline mode:

1. **App seems stuck**: Try refreshing the page once online to sync latest changes
2. **Data inconsistencies**: These should resolve once back online as changes sync
3. **Error messages**: "Failed to get document because client is offline" is expected when offline
4. **Persistent problems**: Clear browser cache and reload

## Implementation Details

The app implements several strategies for offline resilience:

- **Firestore Offline Persistence**: Cached data available when offline
- **Retry Mechanisms**: Automatic retries for network operations
- **Optimistic Updates**: UI updates immediately, then syncs when online
- **Conflict Resolution**: Server timestamps resolve most conflicts automatically

Questions or issues? Contact support@loopin.app
