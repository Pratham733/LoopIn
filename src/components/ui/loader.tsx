import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16", 
  lg: "w-20 h-20",
  xl: "w-24 h-24"
};

const innerSizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16", 
  xl: "w-20 h-20"
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl"
};

export function Loader({ 
  size = "md", 
  className = "",
  text = "Loading...",
  showText = false 
}: LoaderProps) {
  return (
    <div className={cn("flex-col gap-4 w-full flex items-center justify-center", className)}>
      <div
        className={cn(
          "border-4 border-transparent text-blue-400 animate-spin flex items-center justify-center border-t-blue-400 rounded-full",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "border-4 border-transparent text-red-400 animate-spin flex items-center justify-center border-t-red-400 rounded-full",
            innerSizeClasses[size]
          )}
        />
      </div>
      {showText && (
        <p className={cn("text-muted-foreground animate-pulse", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

// Full screen loader variant
export function FullScreenLoader({ 
  size = "lg",
  text = "Loading...",
  showText = true 
}: Omit<LoaderProps, 'className'>) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loader size={size} text={text} showText={showText} />
    </div>
  );
}

// Inline loader variant
export function InlineLoader({ 
  size = "sm",
  className = "" 
}: Omit<LoaderProps, 'text' | 'showText'>) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "border-4 border-transparent text-blue-400 animate-spin flex items-center justify-center border-t-blue-400 rounded-full",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "border-4 border-transparent text-red-400 animate-spin flex items-center justify-center border-t-red-400 rounded-full",
            innerSizeClasses[size]
          )}
        />
      </div>
    </div>
  );
} 