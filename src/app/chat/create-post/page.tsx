"use client";

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addPost } from '@/services/postService';
import { mockUsers } from '@/lib/mockData';
import type { Post, MockUser } from '@/types';
import { ImagePlus, Video, Loader2, Send, PlusSquare, MapPin, Tag, X, ArrowUpFromLine, ArrowLeft, ArrowRight, Sparkles, RotateCw, FlipHorizontal, FlipVertical, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UserTaggingModal } from '@/components/chat/UserTaggingModal';
import { Badge } from '@/components/ui/badge';
import { compressMedia } from '@/lib/mediaCompression';


interface MediaFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  transform: {
    rotate: number;
    scaleX: number;
    scaleY: number;
  };
}

// Animated upload button component
function AnimatedUploadButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative w-full group" onClick={onClick} style={{ maxWidth: 140, margin: '0 auto' }}>
      <div
        className="relative z-40 cursor-pointer group-hover:translate-x-8 group-hover:shadow-2xl group-hover:-translate-y-8 transition-all duration-500 bg-neutral-900 flex items-center justify-center h-32 w-32 mx-auto rounded-xl"
      >
        <svg
          className="h-6 w-6 text-white/60"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          height="24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
          <path d="M7 9l5 -5l5 5"></path>
          <path d="M12 4l0 12"></path>
        </svg>
      </div>
      <div
        className="absolute border opacity-0 group-hover:opacity-80 transition-all duration-300 border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 w-32 mx-auto rounded-xl"
      ></div>
    </div>
  );
}

export default function CreatePostPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [postContent, setPostContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(mediaFile => {
        if (mediaFile.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(mediaFile.previewUrl);
        }
      });
    };
  }, [mediaFiles]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];
    const fileArray = Array.from(files);

    // Show loading toast for multiple files
    if (fileArray.length > 1) {
      toast({
        title: 'Processing Files',
        description: `Compressing ${fileArray.length} files to 1080p quality...`,
      });
    }

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `Skipping '${file.name}'. Please select only image or video files.`,
        });
        continue;
      }

      try {
        // Show individual file processing for single files
        if (fileArray.length === 1) {
          toast({
            title: 'Processing Media',
            description: `Compressing ${file.name} to 1080p quality...`,
          });
        }

        // Compress the media file
        const { compressedFile, metadata } = await compressMedia(file, {
          maxWidth: 1080,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeInMB: file.type.startsWith('image/') ? 5 : 50
        });

        const isImage = file.type.startsWith('image/');
        let previewUrl: string;

        if (isImage) {
          // For images, create data URL for preview and upload
          previewUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });
        } else {
          // For videos, use blob URL for preview
          previewUrl = URL.createObjectURL(compressedFile);
        }

        newMediaFiles.push({
          id: `${compressedFile.name}-${compressedFile.lastModified}`,
          file: compressedFile,
          previewUrl,
          type: isImage ? 'image' : 'video',
          transform: {
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
          },
        });

        // Show compression results
        if (file.size !== compressedFile.size) {
          const originalSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(1);
          
          toast({
            title: 'Media Compressed',
            description: `${file.name}: ${originalSizeMB}MB → ${compressedSizeMB}MB (${metadata.width}x${metadata.height})`,
          });
        }

      } catch (error: any) {
        console.error('Error processing file:', error);
        toast({
          variant: 'destructive',
          title: 'File Processing Error',
          description: error.message || `Could not process file '${file.name}'.`,
        });
      }
    }

    if (newMediaFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
      
      if (fileArray.length > 1) {
        toast({
          title: 'Files Processed',
          description: `${newMediaFiles.length} files ready for posting.`,
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removeMediaFile = (index: number) => {
    const fileToRemove = mediaFiles[index];
    // Only revoke blob URLs, not data URLs
    if (fileToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleMoveMedia = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === mediaFiles.length - 1) return;

    const newMediaFiles = [...mediaFiles];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const itemToMove = newMediaFiles[index];
    
    newMediaFiles.splice(index, 1);
    newMediaFiles.splice(targetIndex, 0, itemToMove);

    setMediaFiles(newMediaFiles);
  };

  const handleRotate = (index: number) => {
    setMediaFiles(prev =>
      prev.map((media, i) =>
        i === index
          ? {
              ...media,
              transform: {
                ...media.transform,
                rotate: (media.transform.rotate + 90) % 360,
              },
            }
          : media
      )
    );
  };

  const handleFlip = (index: number, axis: 'horizontal' | 'vertical') => {
    setMediaFiles(prev =>
      prev.map((media, i) =>
        i === index
          ? {
              ...media,
              transform: {
                ...media.transform,
                scaleX: axis === 'horizontal' ? media.transform.scaleX * -1 : media.transform.scaleX,
                scaleY: axis === 'vertical' ? media.transform.scaleY * -1 : media.transform.scaleY,
              },
            }
          : media
      )
    );
  };


  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleGenerateCaption = async () => {
    if (mediaFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Media',
        description: 'Please add some media first.',
      });
      return;
    }

    setIsGeneratingCaption(true);
    try {
      // Convert media files to the format expected by the API
      const mediaForAI = mediaFiles.map(mf => ({
        dataUri: mf.previewUrl,
        mimeType: mf.file.type,
      }));

      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media: mediaForAI,
          userContext: postContent.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate caption');
      }

      const result = await response.json();
      setPostContent(result.caption);
      
      toast({
        title: 'Caption Generated!',
        description: 'AI has generated a creative caption for your post.',
      });
    } catch (error) {
      console.error('Error generating caption:', error);
      toast({
        variant: 'destructive',
        title: 'Caption Generation Failed',
        description: 'Could not generate caption. Please try again.',
      });
    } finally {
      setIsGeneratingCaption(false);
    }
  };


  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || mediaFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Media Required',
        description: 'Please select at least one image or video to post.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaForPost = mediaFiles.map(mf => ({
        url: mf.previewUrl,
        type: mf.type,
        dataAiHint: 'user upload' 
      }));

      const newPostData = {
        userId: currentUser.id,
        username: currentUser.username,
        content: postContent.trim(),
        media: mediaForPost,
        taggedUserIds: taggedUserIds,
      };
      
      await addPost(newPostData); 

      toast({
        title: 'Post Created!',
        description: 'Your post has been successfully shared.',
      });
      
      router.push(`/chat/profile/${currentUser.id}`);

    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Post',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const taggedUsers = mockUsers.filter(u => taggedUserIds.includes(u.id));

  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <>
    <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6 flex flex-col h-full">
      <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold flex items-center mb-4 sm:mb-6">
        <PlusSquare className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 md:h-8 md:w-8 text-primary" /> Create New Post
      </h1>
      
      <Card className="flex-grow flex flex-col shadow-xl bg-card/80 dark:bg-card/70 backdrop-blur-sm">
         <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*"
            multiple
            disabled={isSubmitting}
        />

        {mediaFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                 <ImagePlus className="h-24 w-24 text-muted-foreground/50 mb-4" strokeWidth={1} />
                 <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Create a new post</h2>
                 <p className="text-sm text-muted-foreground mb-6">Select photos and videos to share.</p>
                 <AnimatedUploadButton onClick={triggerFileInput} />
            </div>
        ) : (
            <form onSubmit={handleCreatePost} className="flex-grow flex flex-col">
                <div className="grid md:grid-cols-2 flex-grow min-h-0">
                    <div className="relative bg-black/80 md:rounded-l-lg overflow-hidden flex flex-col">
                        <div className="flex-grow p-2 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {mediaFiles.map((media, index) => (
                                    <div key={media.id} className="relative group aspect-square bg-black rounded-md overflow-hidden">
                                        {media.type === 'image' ? (
                                            <Image 
                                                src={media.previewUrl} 
                                                alt={`preview ${index}`} 
                                                layout="fill" 
                                                objectFit="cover" 
                                                className="transition-transform duration-300"
                                                style={{
                                                    transform: `rotate(${media.transform.rotate}deg) scaleX(${media.transform.scaleX}) scaleY(${media.transform.scaleY})`,
                                                }}
                                                data-ai-hint="post image preview"
                                            />
                                        ) : (
                                            <video 
                                                src={media.previewUrl} 
                                                className="h-full w-full object-cover transition-transform duration-300" 
                                                data-ai-hint="post video preview"
                                                style={{
                                                    transform: `rotate(${media.transform.rotate}deg) scaleX(${media.transform.scaleX}) scaleY(${media.transform.scaleY})`,
                                                }}
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={() => handleMoveMedia(index, 'left')}
                                                    disabled={index === 0}
                                                    aria-label="Move left"
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                </Button>
                                                 <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={() => handleMoveMedia(index, 'right')}
                                                    disabled={index === mediaFiles.length - 1}
                                                    aria-label="Move right"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={() => removeMediaFile(index)}
                                                    aria-label="Remove media"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => handleRotate(index)} aria-label="Rotate">
                                                    <RotateCw className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => handleFlip(index, 'horizontal')} aria-label="Flip Horizontal">
                                                    <FlipHorizontal className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => handleFlip(index, 'vertical')} aria-label="Flip Vertical">
                                                    <FlipVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="p-2 border-t border-border/20">
                            <Button type="button" variant="outline" onClick={triggerFileInput} className="w-full text-xs">
                                <ImagePlus className="mr-2 h-4 w-4" /> Add More Media
                            </Button>
                         </div>
                    </div>

                    <div className="flex flex-col p-4 sm:p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <UserCircle className="h-10 w-10 text-muted-foreground"/>
                            <p className="font-semibold text-sm">{currentUser.username}</p>
                        </div>
                        
                        <div className="relative">
                            <Label htmlFor="postContent" className="sr-only">Caption</Label>
                            <Textarea
                                id="postContent"
                                placeholder="Write a caption, or let AI help you..."
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                className="min-h-[120px] text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 pr-12"
                                disabled={isSubmitting || isGeneratingCaption}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-1 h-8 w-8 text-primary rounded-full hover:bg-primary/10"
                                onClick={handleGenerateCaption}
                                disabled={isSubmitting || isGeneratingCaption || mediaFiles.length === 0}
                                aria-label="Generate caption with AI"
                            >
                                {isGeneratingCaption ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-5 w-5" />
                                )}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsTaggingModalOpen(true)}
                                    className="w-full justify-start text-muted-foreground font-normal pl-10 text-sm"
                                >
                                    {taggedUsers.length > 0 ? `Tagged ${taggedUsers.length} people` : "Tag people"}
                                </Button>
                            </div>
                            {taggedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pl-1">
                                    {taggedUsers.map(user => (
                                        <Badge key={user.id} variant="secondary" className="pr-1.5">
                                            {user.username}
                                            <button type="button" onClick={() => setTaggedUserIds(ids => ids.filter(id => id !== user.id))} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input disabled placeholder="Add location" className="pl-10 text-sm" onClick={() => toast({title: "Feature not available", description: "Google Maps integration is not yet implemented."})}/>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                             <Button type="submit" className="w-full text-base" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Share Post</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        )}
      </Card>
    </div>
     <UserTaggingModal
        isOpen={isTaggingModalOpen}
        onOpenChange={setIsTaggingModalOpen}
        currentUser={currentUser}
        selectedUserIds={taggedUserIds}
        onSelectedUserIdsChange={setTaggedUserIds}
      />
    </>
  );
}
