/**
 * Utility functions for handling user avatars
 */

/**
 * Generate an avatar URL for a user using DiceBear Avatars API
 * @param seed - Unique identifier (username, email, or uid)
 * @param style - Avatar style (adventurer, avataaars, bottts, etc.)
 * @returns Avatar URL
 */
export function generateAvatarUrl(
  seed: string,
  style: "adventurer" | "avataaars" | "bottts" | "identicon" | "initials" = "avataaars"
): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}`;
}

/**
 * Get the appropriate avatar URL for a user
 * Priority: photoURL > generated avatar
 * 
 * @param photoURL - User's photo URL (from Google or uploaded)
 * @param fallbackSeed - Seed for generating avatar (username or email)
 * @returns Avatar URL to display
 */
export function getAvatarUrl(
  photoURL: string | null | undefined,
  fallbackSeed: string
): string {
  // If user has a photo URL (from Google or uploaded), use it
  if (photoURL) {
    return photoURL;
  }
  
  // Otherwise, generate an avatar
  return generateAvatarUrl(fallbackSeed, "avataaars");
}

/**
 * Get initials from a name for fallback display
 * @param name - User's display name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
