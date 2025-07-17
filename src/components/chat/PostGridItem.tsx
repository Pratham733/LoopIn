
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/types';
import { Heart, MessageCircle, Video as ReelsIcon, FileText, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostGridItemProps {
  post: Post;
}

export function PostGridItem({ post }: PostGridItemProps) {
  const firstMedia = post.media?.[0];

  return (
    <Link
      href={`/chat/profile/${post.userId}/posts`} // Consider linking to individual post view if that exists
      className={cn(
        "card-3d relative group overflow-hidden block", 
        "aspect-square bg-card border rounded-md shadow-lg" 
      )}
      aria-label={`View post: ${post.content ? post.content.substring(0, 30) + '...' : 'Media post'}`}
    >
      {firstMedia && firstMedia.type === 'image' ? (
        <Image
          src={firstMedia.url}
          alt={post.content?.substring(0,30) || "Post image"}
          layout="fill"
          objectFit="cover" // Use objectFit prop
          className="transition-transform duration-300 group-hover:scale-105" // Cleaned class: only transition/hover
          data-ai-hint={firstMedia.url.includes('placehold.co') ? "placeholder image" : "post image content"}
        />
      ) : firstMedia && firstMedia.type === 'video' ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            src={firstMedia.url}
            className="w-full h-full object-cover"
            data-ai-hint="post video content"
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <ReelsIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/80" />
          </div>
        </div>
      ) : !firstMedia && post.content ? (
         <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 bg-muted/30">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/70 mb-2" />
            <p className="text-muted-foreground text-center text-[0.6rem] sm:text-xs line-clamp-4">{post.content}</p>
         </div>
      ) : (
        // Fallback for posts with no media and no content, or if media fails to load
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
        </div>
      )}
      
      {post.media && post.media.length > 1 && (
        <Copy className="absolute top-2 right-2 h-4 w-4 text-white drop-shadow-lg" strokeWidth={2.5}/>
      )}

      <figcaption className="card-title-3d text-white absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 font-semibold text-xs sm:text-sm font-mono z-10 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-md flex flex-col items-end gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{post.likes.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{post.comments.length}</span>
        </div>
      </figcaption>
    </Link>
  );
};
