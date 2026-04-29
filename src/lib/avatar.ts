/**
 * Utility functions for handling user avatars
 */

const PRESET_SEEDS = ["Felix", "Aneka", "Milo", "Luna", "Sophie"];

/**
 * Get a consistent preset avatar seed based on username
 */
function getPresetSeed(username: string): string {
  const index =
    [...username].reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    PRESET_SEEDS.length;
  return PRESET_SEEDS[index];
}

/**
 * Generate an avatar URL using DiceBear big-smile style
 * @param seed - Unique identifier (username, email, or uid)
 * @returns Avatar URL
 */
export function generateAvatarUrl(seed: string): string {
  const presetSeed = getPresetSeed(seed);
  return `https://api.dicebear.com/9.x/big-smile/svg?seed=${presetSeed}`;
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
  if (photoURL) {
    return photoURL;
  }
  return generateAvatarUrl(fallbackSeed);
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