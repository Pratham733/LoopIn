import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ size = 'default', iconOnly = false }: { size?: 'small' | 'default' | 'large', iconOnly?: boolean }) {
  const textSizeClass = size === 'small' ? 'text-xl' : size === 'large' ? 'text-3xl' : 'text-2xl';
  const iconSize = size === 'small' ? 28 : size === 'large' ? 32 : 28;

  return (
    <Link href="/chat" className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
      <Image 
        src="/logo.png" 
        alt="LoopIn Logo" 
        width={iconSize} 
        height={iconSize}
        className="group-hover:animate-pulse shrink-0"
      />
      {!iconOnly && (
        <span className={cn(
            "font-headline font-bold text-primary group-hover:text-primary/90 transition-colors",
            textSizeClass
          )}
        >
          LoopIn
        </span>
      )}
    </Link>
  );
}
