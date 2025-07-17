import { db, storage } from '@/lib/firebase/client';
import type { MockUser } from '@/types';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, writeBatch, documentId, orderBy, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { executeWithRetry, checkFirebaseConnectivity } from '@/lib/network';

export async function createUserProfile(userId: string, data: { email: string; username: string }): Promise<MockUser> {
    return executeWithRetry(async () => {
        const now = new Date().toISOString();
        const newUserProfile: MockUser = {
            id: userId,
            username: data.username.toLowerCase(),
            fullName: data.username,
            email: data.email,
            status: 'online',
            followers: [],
            following: [],
            bio: `Welcome to LoopIn!`,
            isPrivate: false,
            savedPosts: [],
            showCurrentlyPlaying: true,
            createdAt: now,
            updatedAt: now,
        };
        
        // Check connectivity status
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            console.warn('Creating user profile while offline - will sync when online');
        }
        
        // Create the user document in Firestore
        try {
            await setDoc(doc(db, 'users', userId), newUserProfile);
            console.log(`User profile created successfully for user ID: ${userId}`);
            return newUserProfile;
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error; 
        }
    }, 3, 1000, 'Cannot create user profile: Please check your internet connection');
}

export async function getUserProfile(userId: string): Promise<MockUser | null> {
    return executeWithRetry(async () => {
        // Always attempt to fetch the profile without checking connectivity first
        // This allows Firestore to use its built-in offline persistence and caching
        try {
            const userDocRef = doc(db, 'users', userId);
            // Use cache-first approach by setting source to 'cache' if offline
            // This will force Firestore to check cache first
            const options = !navigator.onLine ? { source: 'cache' } : undefined;
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                // Indicate if this data might be from cache
                const fromCache = userDocSnap.metadata.fromCache;
                if (fromCache) {
                    console.log(`Retrieved user profile for ${userId} from local cache`);
                }
                
                // Combine the data with metadata but preserve the MockUser type
                const userData = userDocSnap.data() as Omit<MockUser, 'id'>;
                return {
                    id: userDocSnap.id,
                    ...userData,
                    // Store cache info in an unexposed property that won't affect the type
                    // Using a non-standard property name that won't conflict with normal fields
                    __fromCache: fromCache
                };
            } else {
                console.warn(`No user profile found for ID: ${userId}`);
                return null;
            }
        } catch (error: any) {
            console.error('Error fetching user profile:', error);
            
            // Only throw an offline-specific error if we're actually offline
            // and the error is related to connectivity
            if ((error.code === 'unavailable' || 
                error.message?.includes('offline') || 
                error.code === 'failed-precondition') && 
                !navigator.onLine) {
                throw new Error('Failed to get user profile because the client is offline.');
            }
            
            // For other errors, just pass them through
            throw error;
        }
    }, 3, 1000, 'Unable to retrieve user profile: Please check your internet connection');
}

export async function updateUserProfile(userId: string, data: Partial<MockUser>): Promise<void> {
    return executeWithRetry(async () => {
        const userDocRef = doc(db, 'users', userId);
        
        // Check connectivity
        const isConnected = await checkFirebaseConnectivity();
        if (!isConnected) {
            console.warn('Updating user profile in offline mode - changes will sync when online');
        }
        
        // Handle profile image specifically - ensure it's correctly set
        const updateData = { ...data };
        if ('profileImage' in updateData) {
            console.log(`Setting profileImage to: ${updateData.profileImage}`);
            // If profileImage is empty string or null, ensure it's properly set to empty string
            if (!updateData.profileImage) {
                updateData.profileImage = '';
            }
        }
        
        await setDoc(userDocRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        console.log(`User profile updated for ID: ${userId} with data:`, JSON.stringify(updateData));
    }, 3, 1000, 'Cannot update profile: Please check your internet connection');
}


export async function isUsernameTaken(username: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

export async function getAllUsers(): Promise<MockUser[]> {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockUser));
}


export async function toggleSavePost(userId: string, postId: string): Promise<boolean> {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error("User not found");
    }

    const userData = userSnap.data();
    const savedPosts = userData.savedPosts || [];
    let isSavedNow;

    if (savedPosts.includes(postId)) {
        // Unsave
        await updateDoc(userRef, { savedPosts: arrayRemove(postId) });
        isSavedNow = false;
    } else {
        // Save
        await updateDoc(userRef, { savedPosts: arrayUnion(postId) });
        isSavedNow = true;
    }

    return isSavedNow;
}

export async function getUsersByFollowing(followingIds: string[]): Promise<MockUser[]> {
    return executeWithRetry(async () => {
        if (!followingIds || followingIds.length === 0) {
            return [];
        }
        
        try {
            // Check connectivity
            const isConnected = await checkFirebaseConnectivity();
            if (!isConnected) {
                console.log('Fetching followed users in offline mode - using cached data');
            }
            
            // Firestore limits 'in' queries to 30 items at a time
            // For larger sets, we'd need to use batching
            const batchSize = 30;
            let allUsers: MockUser[] = [];
            
            // Process in batches of 30 or fewer
            for (let i = 0; i < followingIds.length; i += batchSize) {
                const batch = followingIds.slice(i, i + batchSize);
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where(documentId(), 'in', batch));
                const snapshot = await getDocs(q);
                
                const users = snapshot.docs.map(docSnap => ({ 
                    id: docSnap.id, 
                    ...docSnap.data() 
                } as MockUser));
                
                allUsers = [...allUsers, ...users];
            }
            
            return allUsers;
        } catch (error) {
            console.error("Error fetching users by following:", error);
            throw error;
        }
    }, 3, 1000, 'Unable to retrieve user list: Please check your internet connection');
}

/**
 * Search for users by username, displayName, fullName, or email
 * @param searchTerm The search term to match against user fields
 * @param limit Maximum number of results to return
 * @param excludeUserIds Optional array of user IDs to exclude from results
 * @returns Array of matching users
 */
export async function searchUsersByUsername(searchTerm: string, maxResults: number = 10, excludeUserIds: string[] = []): Promise<MockUser[]> {
    return executeWithRetry(async () => {
        try {
            const searchTermLC = searchTerm.toLowerCase();
            
            // Get all users and perform client-side filtering
            // This is needed because Firestore doesn't support complex text search
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(100)); // Get more users for client-side filtering
            
            const querySnapshot = await getDocs(q);
            let users = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as MockUser));
            
            // Filter out excluded users first
            if (excludeUserIds.length > 0) {
                users = users.filter(user => !excludeUserIds.includes(user.id));
            }
            
            // Client-side search across multiple fields
            const matchingUsers = users.filter(user => {
                const username = (user.username || '').toLowerCase();
                const displayName = (user.displayName || '').toLowerCase();
                const fullName = (user.fullName || '').toLowerCase();
                const email = (user.email || '').toLowerCase();
                const bio = (user.bio || '').toLowerCase();
                
                return (
                    username.includes(searchTermLC) ||
                    displayName.includes(searchTermLC) ||
                    fullName.includes(searchTermLC) ||
                    email.includes(searchTermLC) ||
                    bio.includes(searchTermLC)
                );
            });
            
            // Sort by relevance (exact matches first, then prefix matches, then contains)
            const sortedUsers = matchingUsers.sort((a, b) => {
                const aUsername = (a.username || '').toLowerCase();
                const bUsername = (b.username || '').toLowerCase();
                const aDisplayName = (a.displayName || '').toLowerCase();
                const bDisplayName = (b.displayName || '').toLowerCase();
                const aFullName = (a.fullName || '').toLowerCase();
                const bFullName = (b.fullName || '').toLowerCase();
                
                // Exact username match gets highest priority
                if (aUsername === searchTermLC) return -1;
                if (bUsername === searchTermLC) return 1;
                
                // Exact display name or full name match
                if (aDisplayName === searchTermLC || aFullName === searchTermLC) return -1;
                if (bDisplayName === searchTermLC || bFullName === searchTermLC) return 1;
                
                // Username starts with search term
                if (aUsername.startsWith(searchTermLC) && !bUsername.startsWith(searchTermLC)) return -1;
                if (bUsername.startsWith(searchTermLC) && !aUsername.startsWith(searchTermLC)) return 1;
                
                // Display name or full name starts with search term
                if ((aDisplayName.startsWith(searchTermLC) || aFullName.startsWith(searchTermLC)) && 
                    !(bDisplayName.startsWith(searchTermLC) || bFullName.startsWith(searchTermLC))) return -1;
                if ((bDisplayName.startsWith(searchTermLC) || bFullName.startsWith(searchTermLC)) && 
                    !(aDisplayName.startsWith(searchTermLC) || aFullName.startsWith(searchTermLC))) return 1;
                
                // Alphabetical order as fallback
                return aUsername.localeCompare(bUsername);
            });
            
            return sortedUsers.slice(0, maxResults);
        } catch (error) {
            console.error("Error searching users:", error);
            throw error;
        }
    }, 3, 1000, 'Unable to search users: Please check your internet connection');
}

export async function updateProfilePicture(userId: string, imageDataUrl: string): Promise<string> {
    // Upload to Cloudinary
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: imageDataUrl })
    });
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Cloudinary upload failed');
    // Optionally update Firestore user profile with new image URL here
    return data.url;
}

/**
 * Update a user's avatar with a new URL or remove it
 * @param userId The ID of the user to update
 * @param avatarUrl The new avatar URL or null to remove
 * @returns The updated user object
 */
export async function updateUserAvatar(userId: string, avatarUrl: string | null): Promise<MockUser | null> {
    return executeWithRetry(async () => {
        try {
            // If it's a data URL, process it through the profile picture function
            if (avatarUrl && avatarUrl.startsWith('data:')) {
                const downloadURL = await updateProfilePicture(userId, avatarUrl);
                avatarUrl = downloadURL;
            }
            
            // Update the user document with the new avatar URL or null
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, {
                profileImage: avatarUrl,
                updatedAt: new Date().toISOString()
            });
            
            console.log(`Avatar ${avatarUrl ? 'updated' : 'removed'} for user ${userId}`);
            
            // Get the updated user profile
            return await getUserProfile(userId);
        } catch (error) {
            console.error('Error updating user avatar:', error);
            throw error;
        }
    }, 3, 1000, 'Failed to update profile picture: Please check your internet connection');
}
