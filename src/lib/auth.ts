import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "./firebase";

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
    await set(ref(database, `users/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      username: username,
      displayName: username,
      createdAt: new Date().toISOString(),
      points: 0,
      level: 1,
      streak: 0,
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
      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split("@")[0] || "User",
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: photoURL || null,
        createdAt: new Date().toISOString(),
        points: 0,
        level: 1,
        streak: 0,
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
