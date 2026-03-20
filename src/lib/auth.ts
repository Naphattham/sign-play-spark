import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { auth, database } from "./firebase";

// Add points to a user's total points
export const addUserPoints = async (uid: string, pointsToAdd: number) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return { error: "User not found" };
    const userData = snapshot.val();
    const newPoints = (userData.points || 0) + pointsToAdd;
    await update(userRef, { points: newPoints });
    console.log(`💰 Added ${pointsToAdd} points. Total: ${newPoints}`);
    return { points: newPoints, error: null };
  } catch (error: any) {
    console.error("Error adding points:", error);
    return { points: 0, error: error.message };
  }
};

// Increment user level by 1
export const incrementUserLevel = async (uid: string) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return { error: "User not found" };
    const userData = snapshot.val();
    const newLevel = (userData.level || 1) + 1;
    await update(userRef, { level: newLevel });
    console.log(`⬆️ Level up! Now level ${newLevel}`);
    return { level: newLevel, error: null };
  } catch (error: any) {
    console.error("Error incrementing level:", error);
    return { level: 0, error: error.message };
  }
};

// Add a completed phrase to user's record in DB
export const addCompletedPhrase = async (uid: string, phraseId: string) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return { error: "User not found" };
    const userData = snapshot.val();
    const completedPhrases: string[] = userData.completedPhrases || [];
    if (!completedPhrases.includes(phraseId)) {
      completedPhrases.push(phraseId);
      await update(userRef, { completedPhrases });
    }
    return { completedPhrases, error: null };
  } catch (error: any) {
    console.error("Error adding completed phrase:", error);
    return { completedPhrases: [], error: error.message };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update user profile with username
    await updateProfile(user, {
      displayName: username,
    });

    // Save user data to Realtime Database
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await set(ref(database, `users/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      username: username,
      displayName: username,
      createdAt: new Date().toISOString(),
      points: 0,
      level: 1,
      streak: 1,
      lastLoginDate: today.toISOString(),
      completedPhrases: [],
    });

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Fix Google photo URL - remove size restriction and use higher quality
    let photoURL = user.photoURL;
    if (photoURL && photoURL.includes('googleusercontent.com')) {
      // Remove =s96-c or similar size parameters and use default
      photoURL = photoURL.split('=')[0];
    }

    console.log("Google sign-in user data:", {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: photoURL,
      originalPhotoURL: user.photoURL,
      email: user.email
    });

    // Ensure Firebase Auth profile has the photo
    if (photoURL) {
      await updateProfile(user, {
        displayName: user.displayName,
        photoURL: photoURL,
      });
    }

    // Check if user exists in database
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    // If new user, create profile in database
    if (!snapshot.exists()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split("@")[0] || "User",
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: photoURL || null,
        createdAt: new Date().toISOString(),
        points: 0,
        level: 1,
        streak: 1,
        lastLoginDate: today.toISOString(),
        completedPhrases: [],
      };
      console.log("Creating new user in database:", userData);
      await set(userRef, userData);
    } else {
      // Existing user - update photoURL from Google if it has changed
      const existingData = snapshot.val();
      if (photoURL && existingData.photoURL !== photoURL) {
        const updatedData = {
          ...existingData,
          photoURL: photoURL,
          displayName: user.displayName || existingData.displayName,
          username: user.displayName || existingData.username,
        };
        console.log("Updating existing user with Google photo:", updatedData);
        await set(userRef, updatedData);
      }
    }

    // Reload user to ensure latest data
    await user.reload();

    return { user, error: null };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return { user: null, error: getErrorMessage(error.code) };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

// Get user data from database
export const getUserData = async (uid: string) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return { data: snapshot.val(), error: null };
    }
    return { data: null, error: "User not found" };
  } catch (error: any) {
    return { data: null, error: getErrorMessage(error.code) };
  }
};

// Update user data
export const updateUserData = async (uid: string, data: any) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, data);
    return { error: null };
  } catch (error: any) {
    return { error: getErrorMessage(error.code) };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Update streak when user logs in
export const updateStreakOnLogin = async (uid: string) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return { error: "User not found" };
    }

    const userData = snapshot.val();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const lastLoginDate = userData.lastLoginDate ? new Date(userData.lastLoginDate) : null;
    
    let newStreak = userData.streak || 0;
    
    if (lastLoginDate) {
      lastLoginDate.setHours(0, 0, 0, 0); // Reset to start of day
      
      // Calculate day difference
      const dayDifference = Math.floor((today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDifference === 0) {
        // Case 2: Same day - do nothing
        return { streak: newStreak, error: null };
      } else if (dayDifference === 1) {
        // Case 1: Consecutive day - increment streak
        newStreak = newStreak + 1;
      } else if (dayDifference > 1) {
        // Case 3: Missed days - reset to 1
        newStreak = 1;
      }
    } else {
      // First time login or no lastLoginDate - set streak to 1
      newStreak = 1;
    }
    
    // Update user data with new streak and lastLoginDate
    await set(userRef, {
      ...userData,
      streak: newStreak,
      lastLoginDate: today.toISOString(),
    });
    
    return { streak: newStreak, error: null };
  } catch (error: any) {
    return { streak: 0, error: getErrorMessage(error.code) };
  }
};

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/operation-not-allowed":
      return "การดำเนินการนี้ไม่ได้รับอนุญาต";
    case "auth/weak-password":
      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/user-disabled":
      return "บัญชีนี้ถูกปิดการใช้งาน";
    case "auth/user-not-found":
      return "ไม่พบผู้ใช้นี้";
    case "auth/wrong-password":
      return "รหัสผ่านไม่ถูกต้อง";
    case "auth/invalid-credential":
      return "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง";
    case "auth/popup-closed-by-user":
      return "หน้าต่างเข้าสู่ระบบถูกปิด";
    case "auth/cancelled-popup-request":
      return "การเข้าสู่ระบบถูกยกเลิก";
    default:
      return "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
  }
}
