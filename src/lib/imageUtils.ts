// Image utilities for handling profile pictures and other image uploads
import { MAX_PROFILE_IMAGE_SIZE_KB } from '@/lib/constants';

/**
 * Resizes and compresses an image from a data URL
 * @param dataUrl The original image data URL
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @param quality JPEG quality (0-1)
 * @returns A Promise that resolves with the compressed image data URL
 */
export async function compressImageFromDataUrl(
  dataUrl: string,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use better quality settings
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG data URL with quality setting
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validates an image data URL size
 * @param dataUrl Image data URL
 * @param maxSizeKB Maximum size in kilobytes
 * @returns Object with validation result and size information
 */
export function validateImageSize(dataUrl: string, maxSizeKB = MAX_PROFILE_IMAGE_SIZE_KB): { 
  valid: boolean; 
  size: number; 
  message?: string; 
} {
  // Calculate size in KB (data URLs are base64 encoded, ~33% larger than binary)
  const base64String = dataUrl.split(',')[1];
  if (!base64String) {
    return { valid: false, size: 0, message: 'Invalid data URL format' };
  }
  
  // Calculate approximate size in KB
  const sizeInBytes = (base64String.length * 3) / 4;
  const sizeInKB = sizeInBytes / 1024;
  
  if (sizeInKB > maxSizeKB) {
    return {
      valid: false,
      size: sizeInKB,
      message: `Image is too large (${sizeInKB.toFixed(1)} KB). Maximum size is ${maxSizeKB} KB.`
    };
  }
  
  return { valid: true, size: sizeInKB };
}
