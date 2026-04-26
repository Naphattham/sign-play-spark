import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signOutUser, updateStreakOnLogin, getUserData } from "@/lib/auth";
import { warmUpModel } from "@/lib/signLanguageAPI";
import { preloadAllAvatars } from "@/lib/gameConstants";
import { Category, getPhrasesByCategory } from "@/lib/categories";

interface UseAuthStateReturn {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isAuthTransitioning: boolean;
  showInitialLoading: boolean;
  isLoggingOut: boolean;
  userStreak: number;
  userLevel: number;
  completedPhrases: Set<string>;
  collectedPhrases: Set<string>;
  phrasePoints: Record<string, number>;
  hintUnlocked: Set<string>;
  setCompletedPhrases: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCollectedPhrases: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPhrasePoints: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setHintUnlocked: React.Dispatch<React.SetStateAction<Set<string>>>;
  setUserStreak: React.Dispatch<React.SetStateAction<number>>;
  setUserLevel: React.Dispatch<React.SetStateAction<number>>;
  handleLogout: (callbacks: {
    onBeforeLogout: () => void;
    onAfterLogout: () => void;
  }) => Promise<void>;
}

export const useAuthState = (
  onShowCameraPermission: () => void,
  onShowHowToPlay: () => void
): UseAuthStateReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(() => {
    const hasLoaded = sessionStorage.getItem('hasInitialLoaded');
    return !hasLoaded;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const [collectedPhrases, setCollectedPhrases] = useState<Set<string>>(new Set());
  const [phrasePoints, setPhrasePoints] = useState<Record<string, number>>({});
  const [hintUnlocked, setHintUnlocked] = useState<Set<string>>(new Set());

  // Initial loading timer
  useEffect(() => {
    if (showInitialLoading) {
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
        sessionStorage.setItem('hasInitialLoaded', 'true');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showInitialLoading]);

  // Auth state listener
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (isCheckingAuth) {
        setIsCheckingAuth(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      const wasAuthenticated = isAuthenticated;
      const nowAuthenticated = !!user;

      if (nowAuthenticated && user) {
        warmUpModel();
        preloadAllAvatars();

        if (user.photoURL) {
          localStorage.setItem("cached_avatar", user.photoURL);
        }

        setCompletedPhrases(new Set());
        setCollectedPhrases(new Set());
        setPhrasePoints({});
        setUserStreak(0);
        setUserLevel(1);
        setHintUnlocked(new Set());

        try {
          const streakResult = await updateStreakOnLogin(user.uid);
          if (streakResult.streak !== undefined) {
            setUserStreak(streakResult.streak);
          }

          const userData = await getUserData(user.uid);
          if (userData.data?.completedPhrases && Array.isArray(userData.data.completedPhrases)) {
            setCompletedPhrases(new Set(userData.data.completedPhrases));
            setCollectedPhrases(new Set(userData.data.completedPhrases));
          }
          if (userData.data?.level) {
            setUserLevel(userData.data.level);
          }
          if (userData.data?.phrasePoints && typeof userData.data.phrasePoints === "object") {
            setPhrasePoints(userData.data.phrasePoints as Record<string, number>);
          }
          if (userData.data?.unlockedHints && Array.isArray(userData.data.unlockedHints)) {
            setHintUnlocked(new Set(userData.data.unlockedHints as string[]));
          }
        } catch (error) {
          console.error("Error updating streak:", error);
        }
      }

      if (wasAuthenticated !== nowAuthenticated && !isCheckingAuth) {
        setIsAuthTransitioning(true);
        setTimeout(() => {
          setIsAuthenticated(nowAuthenticated);
          setIsAuthTransitioning(false);
          if (nowAuthenticated) {
            if (!sessionStorage.getItem('hasShownCameraModal')) {
              onShowCameraPermission();
              sessionStorage.setItem('hasShownCameraModal', 'true');
            }
            if (!sessionStorage.getItem('howToPlayShown')) {
              onShowHowToPlay();
              sessionStorage.setItem('howToPlayShown', 'true');
            }
          }
        }, 3500);
      } else {
        setIsAuthenticated(nowAuthenticated);
        setIsCheckingAuth(false);
        if (nowAuthenticated) {
          if (!sessionStorage.getItem('hasShownCameraModal')) {
            onShowCameraPermission();
            sessionStorage.setItem('hasShownCameraModal', 'true');
          }
          if (!sessionStorage.getItem('howToPlayShown')) {
            onShowHowToPlay();
            sessionStorage.setItem('howToPlayShown', 'true');
          }
        }
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [isAuthenticated, isCheckingAuth]);

  // Daily practice timer
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const user = auth.currentUser;
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const dateKey = `dailyPracticeDate_${user.uid}`;
      const secKey = `dailyPracticeSeconds_${user.uid}`;
      const storedDate = localStorage.getItem(dateKey);
      let seconds = parseInt(localStorage.getItem(secKey) || '0', 10);
      if (storedDate !== today) {
        seconds = 0;
        localStorage.setItem(dateKey, today);
      }
      seconds += 1;
      localStorage.setItem(secKey, seconds.toString());
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async (callbacks: {
    onBeforeLogout: () => void;
    onAfterLogout: () => void;
  }) => {
    setIsLoggingOut(true);
    try {
      await signOutUser();

      setCompletedPhrases(new Set());
      setCollectedPhrases(new Set());
      setPhrasePoints({});
      setUserStreak(0);
      setUserLevel(1);
      setHintUnlocked(new Set());

      callbacks.onBeforeLogout();

      localStorage.removeItem("cached_avatar");
      localStorage.removeItem("lastCategory");
      localStorage.removeItem("lastPhraseId");
      localStorage.removeItem("cameraPermissionGranted");
      sessionStorage.removeItem('hasShownCameraModal');
      sessionStorage.removeItem('cameraPermissionGranted');
      sessionStorage.removeItem('howToPlayShown');

      await new Promise(resolve => setTimeout(resolve, 3500));
      callbacks.onAfterLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    isAuthenticated,
    isCheckingAuth,
    isAuthTransitioning,
    showInitialLoading,
    isLoggingOut,
    userStreak,
    userLevel,
    completedPhrases,
    collectedPhrases,
    phrasePoints,
    hintUnlocked,
    setCompletedPhrases,
    setCollectedPhrases,
    setPhrasePoints,
    setHintUnlocked,
    setUserStreak,
    setUserLevel,
    handleLogout,
  };
};
