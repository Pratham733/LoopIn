import type { MockUser } from '@/types';
import { db } from '@/lib/firebase/client';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';

/**
 * Updates a user profile in Firebase
 * @param userId The Firebase user ID
 * @param data User profile data
 */
export async function syncUserProfile(userId: string, data: Partial<MockUser>): Promise<void> {
  try {
    // Update Firebase
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
    
    console.log(`User ${userId} updated in Firebase`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Creates a user profile in Firebase
 * @param userId The Firebase user ID
 * @param data User profile data
 */
export async function createUserProfile(userId: string, data: { email: string; username: string }): Promise<void> {
  try {
    // Create profile in Firebase
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
    };
    
    await setDoc(doc(db, 'users', userId), newUserProfile);
    
    console.log(`User ${userId} created in Firebase`);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Gets a user profile from Firebase
 * @param userId The Firebase user ID
 */
export async function getUserProfile(userId: string): Promise<MockUser | null> {
  try {
    // Get user from Firebase
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { id: userDocSnap.id, ...userDocSnap.data() } as MockUser;
    }
    
    console.warn(`No user profile found for ID: ${userId}`);
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Updates a user profile in Firebase
 * @param userId The Firebase user ID
 * @param data User profile data to update
 */
export async function updateUserProfile(userId: string, data: Partial<MockUser>): Promise<void> {
  await syncUserProfile(userId, data);
}

/**
 * Checks if a username is already taken in Firebase
 * @param username The username to check
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  try {
    // Check Firebase
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
}

/**
 * Gets all users from Firebase
 */
export async function getAllUsers(): Promise<MockUser[]> {
  try {
    // Get users from Firebase
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users: MockUser[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as MockUser);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}
