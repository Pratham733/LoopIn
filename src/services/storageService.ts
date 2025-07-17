import { storage } from '@/lib/firebase/client';
import { ref, uploadString, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { executeWithRetry, checkFirebaseConnectivity } from '@/lib/network';

/**
 * Upload an image to Cloudinary from a data URL
 * @param dataUrl The data URL of the image
 * @returns The Cloudinary URL of the uploaded image
 */
export async function uploadImageFromDataUrl(
  dataUrl: string
): Promise<string> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: dataUrl })
  });
  const data = await res.json();
  if (!data.url) throw new Error(data.error || 'Cloudinary upload failed');
  return data.url;
}

/**
 * Delete an image from Firebase Storage
 * @param url The full URL or storage path of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  return executeWithRetry(async () => {
    try {
      // If it's a full URL, extract the path
      let path = url;
      if (url.startsWith('https://') || url.startsWith('http://')) {
        // Get the path part after the bucket name
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
        if (pathMatch && pathMatch[1]) {
          path = decodeURIComponent(pathMatch[1]);
        } else {
          throw new Error('Could not extract path from URL');
        }
      }
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log(`Image deleted successfully from ${path}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }, 3, 1000, 'Failed to delete image: Please check your internet connection');
}

/**
 * Upload a file to Cloudinary
 * @param file The file to upload
 * @returns The Cloudinary URL of the uploaded file
 */
export async function uploadFile(file: File): Promise<string> {
  // Convert file to base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const url = await uploadImageFromDataUrl(base64);
        resolve(url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
