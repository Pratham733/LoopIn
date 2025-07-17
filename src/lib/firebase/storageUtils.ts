import { storage } from './client';
import { ref, getDownloadURL } from 'firebase/storage';
import { DEFAULT_AVATAR } from '@/lib/constants';

/**
 * Refreshes a Firebase Storage URL to ensure it has a valid token
 * @param url The Firebase Storage URL to refresh
 * @returns A fresh URL with a valid token
 */
export async function refreshStorageUrl(url: string): Promise<string> {
  try {    // If it's not a Firebase Storage URL, just return it as is
    if (!url.includes('firebasestorage.googleapis.com') && 
        !url.includes('.appspot.com') &&
        !url.includes('localhost:9190')) {
      return url;
    }

    // Extract the path from the URL
    const path = extractPathFromStorageUrl(url);
    if (!path) {
      console.warn('Could not extract path from Firebase Storage URL:', url);
      return url;
    }

    // Get a fresh URL with a valid token
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error refreshing storage URL:', error);
    // Return the original URL if there's an error
    return url;
  }
}

/**
 * Extracts the storage path from a Firebase Storage URL
 * @param url The Firebase Storage URL
 * @returns The storage path or null if not found
 */
export function extractPathFromStorageUrl(url: string): string | null {
  try {    // For emulator
    if (url.includes('localhost:9190')) {
      const match = url.match(/\/v0\/b\/[^/]+\/o\/([^?]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return null;
    }

    // For production Firebase Storage
    const urlObj = new URL(url);
    
    // Check if it's the newer Firebase Storage URL format with /o/ in the path
    if (urlObj.pathname.includes('/o/')) {
      const match = urlObj.pathname.match(/\/o\/([^?]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    
    // If it's the older format or we couldn't match the newer format
    // Extract the path from the alt path parameter
    const altPath = urlObj.searchParams.get('alt');
    if (altPath) {
      return altPath;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting path from Storage URL:', error, url);
    return null;
  }
}

/**
 * Check if Firebase Storage is accessible by attempting to list files
 * @returns Promise that resolves to true if storage is accessible, false otherwise
 */
export async function isStorageAccessible(): Promise<boolean> {
  try {
    // In emulator mode, always return true for storage accessibility
    if (typeof window !== 'undefined' && 
        (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
         (window as any).__FIREBASE_EMULATOR_MODE__)) {
      console.log('Running in Firebase emulator mode - assuming storage is accessible');
      return true;
    }

    const testRef = ref(storage, '.storage_test');
    await getDownloadURL(testRef).catch(() => {});
    return true;
  } catch (error) {
    console.error('Firebase Storage accessibility check failed:', error);
    return false;
  }
}

/**
 * Get a valid profile image URL with proper fallbacks
 * @param user User object or profileImage URL
 * @param size Optional size for the default avatar
 * @returns A valid URL for the user's profile image
 */
export function getProfileImageUrl(user: { profileImage?: string; avatar?: string; username?: string } | string | null | undefined, size = 80): string {
  // If user is a string, assume it's a direct profile image URL
  if (typeof user === 'string') {
    // Check if it's a valid URL (not empty, not just whitespace, not a blob URL)
    if (!user || user.trim() === '' || user.startsWith('blob:')) {
      return DEFAULT_AVATAR + `&size=${size}`;
    }
    return user;
  }

  // Handle null/undefined user
  if (!user) {
    return DEFAULT_AVATAR + `&size=${size}`;
  }
  
  // Extract profile image from user object - prioritize profileImage over avatar
  const profileImage = user.profileImage || user.avatar;
  const username = user.username || 'user';

  // Check if profile image is valid (not empty, not whitespace, not a blob URL)
  if (!profileImage || profileImage === '' || profileImage.trim() === '' || profileImage.startsWith('blob:')) {
    // Create a deterministic avatar based on username
    return `${DEFAULT_AVATAR}&name=${encodeURIComponent(username.substring(0, 2))}&size=${size}`;
  }
  
  // For Firebase Storage URLs, return as is (they should be valid)
  if (profileImage.includes('firebasestorage.googleapis.com') || 
      profileImage.includes('appspot.com') ||
      profileImage.includes('localhost:9190')) {
    return profileImage;
  }
  
  // For other URLs, validate they're not blob URLs and return
  if (!profileImage.startsWith('blob:')) {
    return profileImage;
  }
  
  // Fallback to default avatar
  return `${DEFAULT_AVATAR}&name=${encodeURIComponent(username.substring(0, 2))}&size=${size}`;
}
