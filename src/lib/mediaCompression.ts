/**
 * Media compression utilities for handling image and video compression
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeInMB?: number;
}

/**
 * Compress an image file to fit within specified dimensions and quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeInMB = 5
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = new Image();
    
    image.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = image;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(image, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Check if compressed size is acceptable
            const compressedSizeMB = blob.size / (1024 * 1024);
            
            if (compressedSizeMB > maxSizeInMB) {
              // If still too large, try with lower quality
              const lowerQuality = Math.max(0.3, quality - 0.2);
              canvas.toBlob(
                (secondBlob) => {
                  if (!secondBlob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  
                  const compressedFile = new File(
                    [secondBlob],
                    file.name,
                    { type: file.type }
                  );
                  resolve(compressedFile);
                },
                file.type,
                lowerQuality
              );
            } else {
              const compressedFile = new File(
                [blob],
                file.name,
                { type: file.type }
              );
              resolve(compressedFile);
            }
          },
          file.type,
          quality
        );
        
      } catch (error) {
        reject(error);
      }
    };
    
    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    image.src = URL.createObjectURL(file);
  });
}

/**
 * Compress a video file by reducing resolution and bitrate
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1080,
    maxHeight = 1080,
    maxSizeInMB = 50
  } = options;

  // For video compression, we'll need to use a more complex approach
  // This is a simplified version that just checks size and rejects if too large
  return new Promise((resolve, reject) => {
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeInMB) {
      reject(new Error(`Video file is too large (${fileSizeMB.toFixed(1)}MB). Please use a video smaller than ${maxSizeInMB}MB or compress it before uploading.`));
      return;
    }
    
    // For now, just return the original file if it's within size limits
    // In a real application, you would use FFmpeg.js or similar for video compression
    resolve(file);
  });
}

/**
 * Get video dimensions and duration
 */
export async function getVideoMetadata(file: File): Promise<{
  width: number;
  height: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions
 */
export async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
      URL.revokeObjectURL(image.src);
    };
    
    image.onerror = () => {
      reject(new Error('Failed to load image metadata'));
      URL.revokeObjectURL(image.src);
    };
    
    image.src = URL.createObjectURL(file);
  });
}

/**
 * Main compression function that handles both images and videos
 */
export async function compressMedia(
  file: File,
  options: CompressionOptions = {}
): Promise<{ compressedFile: File; metadata: any }> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (!isImage && !isVideo) {
    throw new Error('Unsupported file type. Please upload an image or video.');
  }
  
  try {
    if (isImage) {
      const metadata = await getImageMetadata(file);
      const compressedFile = await compressImage(file, options);
      
      console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes`);
      console.log(`Dimensions: ${metadata.width}x${metadata.height}`);
      
      return { compressedFile, metadata };
    } else {
      const metadata = await getVideoMetadata(file);
      const compressedFile = await compressVideo(file, options);
      
      console.log(`Video processed: ${file.size} bytes`);
      console.log(`Dimensions: ${metadata.width}x${metadata.height}, Duration: ${metadata.duration}s`);
      
      return { compressedFile, metadata };
    }
  } catch (error) {
    console.error('Media compression error:', error);
    throw error;
  }
}
