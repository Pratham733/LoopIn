"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/common/UserAvatar';
import { getProfileImageUrl } from '@/lib/firebase/storageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfilePicture } from '@/services/userService';

export default function TestProfilePicture() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };    const handleUpload = async () => {
    if (!user || !imageUrl) return;
    
    setIsUploading(true);
    setMessage('Uploading image...');
    
    try {
      // Import validate function for quick check before sending
      const { validateImageSize } = await import('@/lib/imageUtils');
      const sizeCheck = validateImageSize(imageUrl);
      
      if (!sizeCheck.valid) {
        throw new Error(sizeCheck.message || 'Image is too large');
      }
      
      setMessage(`Processing image (${sizeCheck.size.toFixed(1)} KB)...`);
      console.log("Uploading profile picture for user:", user.id);
      const downloadURL = await updateProfilePicture(user.id, imageUrl);
      console.log("Profile picture uploaded successfully, URL:", downloadURL);
        // Update the user context with new profile image only once
      await updateUser({ 
        profileImage: downloadURL,
        updatedAt: new Date().toISOString() // Update timestamp in one call
      });
      console.log("User context updated with new profile image");
      
      setImageUrl(''); // Clear the selected image
      setMessage(`Upload successful! Image URL: ${downloadURL}`);
      
      toast({
        title: 'Profile Picture Updated',
        description: 'Your profile picture has been updated successfully.'
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      
      // Display more helpful error messages
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'There was an error uploading your profile picture.';
      
      setMessage(`Upload failed: ${errorMessage}`);
      
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Picture Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Profile Picture</h2>
          
          <div className="space-y-4">
            <div>
              <Input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            
            {imageUrl && (
              <div className="flex justify-center">
                <img src={imageUrl} alt="Preview" className="w-40 h-40 object-cover rounded-full" />
              </div>
            )}
            
            <Button 
              onClick={handleUpload} 
              disabled={!imageUrl || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
            </Button>
            
            {message && (
              <div className="text-sm mt-2 p-2 bg-secondary/20 rounded">
                {message}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Avatar Display</h2>
          
          <div className="flex flex-col items-center space-y-6">
            <div>
              <h3 className="text-center mb-2">Current User Avatar</h3>
              <div className="flex justify-center">
                <UserAvatar user={user} size="xl" />
              </div>
              <p className="text-center text-sm mt-2">
                {user?.profileImage ? 'Custom Profile Picture' : 'Default Avatar'}
              </p>
            </div>
            
            <div>
              <h3 className="text-center mb-2">Avatar Sizes</h3>
              <div className="flex justify-center space-x-4">
                <UserAvatar user={user} size="xs" />
                <UserAvatar user={user} size="sm" />
                <UserAvatar user={user} size="md" />
                <UserAvatar user={user} size="lg" />
                <UserAvatar user={user} size="xl" />
              </div>
              <p className="text-center text-sm mt-2">
                XS, SM, MD, LG, XL
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
