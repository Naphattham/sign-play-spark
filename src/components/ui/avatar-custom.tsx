import { useState } from "react";
import { getAvatarUrl, getInitials } from "@/lib/avatar";

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

/**
 * Avatar component that displays user profile photo or generated avatar
 * Supports Google profile photos and fallback avatar generation
 */
export function Avatar({ 
  photoURL, 
  displayName, 
  email,
  size = "md", 
  className = "" 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get fallback seed for avatar generation
  const seed = displayName || email || "user";
  const avatarUrl = getAvatarUrl(photoURL, seed);
  const initials = getInitials(displayName);
  
  // If image fails to load or no photo URL, show generated avatar or initials
  const shouldShowGeneratedAvatar = !photoURL || imageError;

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full border-[3px] border-foreground bg-secondary flex items-center justify-center font-display text-secondary-foreground overflow-hidden ${className}`}
      style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}
    >
      {shouldShowGeneratedAvatar ? (
        // Use DiceBear generated avatar as background
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${generateAvatarUrl(seed)})` }}
          title={displayName || email || "User"}
        >
          {/* Fallback to initials if image doesn't load */}
          <div className="w-full h-full flex items-center justify-center bg-secondary/0 hover:bg-secondary/80 transition-colors">
            <span className="opacity-0 hover:opacity-100 transition-opacity">
              {initials}
            </span>
          </div>
        </div>
      ) : (
        <img 
          src={avatarUrl} 
          alt={displayName || "User avatar"} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

// Helper function for generating avatar URL (re-exported for convenience)
function generateAvatarUrl(seed: string): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}`;
}
