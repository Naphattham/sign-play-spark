import { useState, useEffect, useCallback, useRef } from "react";
import { GameSidebar } from "@/components/GameSidebar";
import { VideoCard } from "@/components/VideoCard";
import { WebcamView } from "@/components/WebcamView";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { HomePage } from "@/components/HomePage";
import { LessonsPage } from "@/components/LessonsPage";
import { QuestView } from "@/components/QuestView";
import { GameSetupPage } from "@/components/GameSetupPage";
import { Category, Phrase, getPhrasesByCategory, categories, isPhraseCompletedCheck } from "@/lib/categories";
import { LogOut, X, Camera, Home, User, ArrowLeft } from "lucide-react";
import { useDistanceDetection, DistanceStatus } from "@/hooks/useDistanceDetection";
import { useMediaPipeHolistic } from "@/hooks/useMediaPipeHolistic";
import { auth, database } from "@/lib/firebase";
import { ref as dbRef, get, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { signOutUser, updateStreakOnLogin, getUserData, addUserPoints, incrementUserLevel, addCompletedPhrase, updatePhrasePoints } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { warmUpModel } from "@/lib/signLanguageAPI";

// Helper: calculate score from confidence percentage
const getScoreFromConfidence = (confidence: number): number => {
  if (confidence >= 0.80) return 100;
  if (confidence >= 0.65) return 70;
  if (confidence >= 0.50) return 40;
  return 0;
};

type ButtonState = "start" | "stop" | "collect" | "tryagain";

import generalImg from "@/asset/image/general.png";
import emotionalImg from "@/asset/image/emotional.png";
import qaImg from "@/asset/image/qa.png";
import illnessImg from "@/asset/image/illness.png";
import trophyImg from "@/asset/image/Trophy.png";
import guideHumanImg from "@/asset/image/guide_human.png";
import questImg from "@/asset/image/quest.png";
import challengeImg from "@/asset/image/challenge.png";
import lessonImg from "@/asset/image/lesson.png";
import arrowLeftImg from "@/asset/image/arrow_left.png";
import arrowRightImg from "@/asset/image/arrow_right.png";
import collectPointsImg from "@/asset/image/CollectPoints.png";
import hintImg from "@/asset/image/Hint.png";

type View = "home" | "lessons" | "game" | "leaderboard" | "quest" | "profile" | "playing" | "gamesetup";

const categoryIconMap: Record<string, string> = {
  general: generalImg,
  emotions: emotionalImg,
  qa: qaImg,
  illness: illnessImg,
};

const preloadAllAvatars = async () => {
  try {
    console.log("🖼️ แอบโหลดรูปภาพโปรไฟล์ล่วงหน้า...");
    const usersRef = dbRef(database, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.values(users).forEach((user: any) => {
        if (user.photoURL) {
          const img = new Image();
          img.src = user.photoURL;
        }
      });
      console.log("✅ โหลดรูปล่วงหน้าเสร็จสิ้น พร้อมโชว์ทันที!");
    }
  } catch (error) {
    console.error("Error preloading avatars:", error);
  }
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(() => {
    const hasLoaded = sessionStorage.getItem('hasInitialLoaded');
    return !hasLoaded;
  });
  const [category, setCategory] = useState<Category>("general");
  const [activePhrase, setActivePhrase] = useState<Phrase>(getPhrasesByCategory("general")[0]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(() => {
    return localStorage.getItem('cameraPermissionGranted') === 'true';
  });
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [isLive, setIsLive] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [isPhraseCompleted, setIsPhraseCompleted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<"adult" | "friend">("adult");
  const [byeStep, setByeStep] = useState<1 | 2>(1);
  const [eatStep, setEatStep] = useState<1 | 2 | 3>(1);
  const [tutorialStep, setTutorialStep] = useState<"initial" | "scanning" | "too_close" | "success">("initial");
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [webcamCanvas, setWebcamCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanningLocked, setScanningLocked] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard: ป้องกัน Auto-Collect double-fire
  const isCollectingRef = useRef(false);
  // Track ว่า Session เริ่มไปแล้วหรือยัง (One-Time Start)
  const sessionStartedRef = useRef(false);

  const { toast } = useToast();
  const [showHintModal, setShowHintModal] = useState(false);
  const [isHintActive, setIsHintActive] = useState(false);

  // New states for confidence scoring & button flow
  const [bestConfidence, setBestConfidence] = useState(0);
  const [buttonState, setButtonState] = useState<ButtonState>("start");
  const [collectedPhrases, setCollectedPhrases] = useState<Set<string>>(new Set());
  // คะแนนสะสมต่อคำ (0-100) key = phraseKey
  const [phrasePoints, setPhrasePoints] = useState<Record<string, number>>({});

  // 🚨 1. ปรับลดเวลาที่บังคับสแกนจาก 3 วิ เหลือ 1.5 วินาที
  const MIN_SCANNING_DURATION = 1500;

  // Real distance detection using MediaPipe Face Detection
  const distanceStatus = useDistanceDetection({
    enabled: isDetecting,
    videoElement: webcamVideo,
    // 🚨 2. ปรับให้ไม่ต้องถอยไกลเกินไป (ลดค่าลงจาก 0.45)
    tooCloseThreshold: 0.40,
  });

  const byeTargetClass = activePhrase?.id === "g2" ? (byeStep === 1 ? "bye_me" : "bye_go") : undefined;
  const eatTargetClass = activePhrase?.id === "g3" ? (eatStep === 1 ? "rice" : eatStep === 2 ? "eat" : "yet") : undefined;
  const g4TargetClass = activePhrase?.id === "g4"
    ? (selectedVariant === "adult" ? (eatStep === 1 ? "eat" : "already") : (eatStep === 1 ? "eat" : "yet"))
    : undefined;

  let targetDisplayWord = activePhrase?.text ?? "Hello";
  if (activePhrase?.id === "g1") {
    targetDisplayWord = selectedVariant === "adult" ? "สวัสดีผู้ใหญ่" : "สวัสดีเพื่อน";
  } else if (activePhrase?.id === "g2") {
    targetDisplayWord = byeStep === 1 ? "ฉัน" : "ไป";
  } else if (activePhrase?.id === "g3") {
    targetDisplayWord = eatStep === 1 ? "ข้าว" : eatStep === 2 ? "กิน" : "หรือยัง?";
  } else if (activePhrase?.id === "g4") {
    if (selectedVariant === "adult") {
      targetDisplayWord = eatStep === 1 ? "กิน" : "แล้ว";
    } else {
      targetDisplayWord = eatStep === 1 ? "กิน" : "ยัง";
    }
  } else if (activePhrase?.id === "g6") {
    targetDisplayWord = selectedVariant === "adult" ? "สบายดี" : "ไม่สบายใจ";
  }

  const g6TargetClass = activePhrase?.id === "g6"
    ? (selectedVariant === "adult" ? "fine" : "unhappy")
    : undefined;

  const effectivePhrase: Phrase | undefined = activePhrase?.id === "g2"
    ? { ...activePhrase, modelClass: byeTargetClass, modelClasses: undefined }
    : activePhrase?.id === "g3"
      ? { ...activePhrase, modelClass: eatTargetClass, modelClasses: undefined }
      : activePhrase?.id === "g4"
        ? { ...activePhrase, modelClass: g4TargetClass, modelClasses: undefined }
        : activePhrase?.id === "g6"
          ? { ...activePhrase, modelClass: g6TargetClass, modelClasses: undefined }
          : activePhrase;

  const currentCategoryPhrases = getPhrasesByCategory(category);
  const currentPhraseIndex = currentCategoryPhrases.findIndex(p => p.id === activePhrase?.id);
  const isFirstPhrase = currentPhraseIndex <= 0;
  const isLastPhrase = currentPhraseIndex >= currentCategoryPhrases.length - 1;

  const signRecognition = useMediaPipeHolistic({
    videoElement: webcamVideo,
    canvasElement: webcamCanvas,
    enabled: isLive && gameOpen,
    targetPhrase: effectivePhrase,
    variant: (activePhrase?.id === "g1" || activePhrase?.id === "g4" || activePhrase?.id === "g6") ? selectedVariant : undefined,
    onPhraseMatch: (prediction, confidence) => {
      console.log(`✅ Phrase matched! ${prediction} (${(confidence * 100).toFixed(1)}%)`);
      // Track best confidence
      setBestConfidence(prev => Math.max(prev, confidence));
      if (activePhrase?.id === "g2") {
        if (byeStep === 1 && prediction === "bye_me" && confidence >= 0.5) {
          setByeStep(2);
        } else if (byeStep === 2 && prediction === "bye_go" && confidence >= 0.5) {
          handlePhraseCompletion(confidence);
        }
      } else if (activePhrase?.id === "g3") {
        if (eatStep === 1 && prediction === "rice" && confidence >= 0.5) {
          setEatStep(2);
        } else if (eatStep === 2 && prediction === "eat" && confidence >= 0.5) {
          setEatStep(3);
        } else if (eatStep === 3 && prediction === "yet" && confidence >= 0.5) {
          handlePhraseCompletion(confidence);
        }
      } else if (activePhrase?.id === "g4") {
        if (selectedVariant === "adult") {
          if (eatStep === 1 && prediction === "eat" && confidence >= 0.5) {
            setEatStep(2);
          } else if (eatStep === 2 && prediction === "already" && confidence >= 0.5) {
            handlePhraseCompletion(confidence);
          }
        } else {
          if (eatStep === 1 && prediction === "eat" && confidence >= 0.5) {
            setEatStep(2);
          } else if (eatStep === 2 && prediction === "yet" && confidence >= 0.5) {
            handlePhraseCompletion(confidence);
          }
        }
      } else {
        handlePhraseCompletion(confidence);
      }
    },
    onPrediction: (prediction) => {
      console.log(`🔍 Prediction: ${prediction.prediction} (${(prediction.confidence * 100).toFixed(1)}%)`);
      // Update best confidence if it matches target
      if (signRecognition.isMatched) {
        setBestConfidence(prev => Math.max(prev, prediction.confidence));
      }
    },
  });

  // 🚨 ตรวจจับการเปลี่ยนแปลงสิทธิ์กล้อง (เช่น ผู้ใช้กด Reset หรือ Block บน Browser ระหว่างใช้งาน)
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        const updatePermissionState = () => {
          if (permissionStatus?.state === 'denied' || permissionStatus?.state === 'prompt') {
            setCameraPermissionGranted(false);
            localStorage.removeItem('cameraPermissionGranted');
            setIsLive(false);
            setIsDetecting(false);
            setButtonState("start");
            setTutorialStep("initial");
            sessionStartedRef.current = false;
          } else if (permissionStatus?.state === 'granted') {
            setCameraPermissionGranted(true);
            localStorage.setItem('cameraPermissionGranted', 'true');
          }
        };

        // ตรวจสอบทันทีตอนโหลด
        updatePermissionState();

        // ตั้ง listener รับการเปลี่ยนแปลงสิทธิ์
        permissionStatus.onchange = updatePermissionState;
      } catch (error) {
        console.warn("Permission API not supported", error);
      }
    };
    
    checkPermission();
    
    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isDetecting) {
      setScanningLocked(true);
      const timer = setTimeout(() => {
        setScanningLocked(false);
      }, MIN_SCANNING_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isDetecting]);

  // 🚨 3. โค้ดพระเอก: ปรับ Logic การแสดงหน้า Success ให้เสถียร ไม่เคลียร์ทิ้งมั่วซั่ว
  useEffect(() => {
    if (!isDetecting) return;

    if (distanceStatus === "too_close") {
      setTutorialStep("too_close");
      // ถ้าเข้ามาใกล้เกินไป ค่อยยกเลิกเวลา Success
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    } else if (distanceStatus === "good") {
      if (scanningLocked) {
        setTutorialStep("scanning");
      } else {
        setTutorialStep("success");
        // ถ้าเวลายังไม่เดิน ค่อยให้เริ่มเดิน (ป้องกันมันทับซ้อนกัน)
        if (!successTimerRef.current) {
          successTimerRef.current = setTimeout(() => {
            setIsLive(true);
            setTutorialStep("initial");
            setIsDetecting(false);
            successTimerRef.current = null;
          }, 3000); // แสดงหน้า Success แค่ 3 วิพอแล้วเริ่มเกมเลย
        }
      }
    } else {
      // กรณี "no_face"
      // ถ้าเรากำลังขึ้นจอ Success อยู่ แล้วหน้าหลุดไปแว๊บเดียว ไม่ต้องเปลี่ยนกลับไปสแกน (ปล่อยเนียนไป)
      if (!successTimerRef.current) {
        setTutorialStep("scanning");
      }
    }
  }, [isDetecting, distanceStatus, scanningLocked]);

  useEffect(() => {
    if (showInitialLoading) {
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
        sessionStorage.setItem('hasInitialLoaded', 'true');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showInitialLoading]);

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

        try {
          const streakResult = await updateStreakOnLogin(user.uid);
          if (streakResult.streak !== undefined) {
            setUserStreak(streakResult.streak);
          }

          // Load completed phrases from Firebase
          const userData = await getUserData(user.uid);
          if (userData.data?.completedPhrases && Array.isArray(userData.data.completedPhrases)) {
            setCompletedPhrases(new Set(userData.data.completedPhrases));
            setCollectedPhrases(new Set(userData.data.completedPhrases));
          }
          // Load user level
          if (userData.data?.level) {
            setUserLevel(userData.data.level);
          }
          // Load per-phrase cumulative points
          if (userData.data?.phrasePoints && typeof userData.data.phrasePoints === "object") {
            setPhrasePoints(userData.data.phrasePoints as Record<string, number>);
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
          if (nowAuthenticated && !cameraPermissionGranted && !localStorage.getItem('hasShownCameraModal')) {
            setShowCameraPermission(true);
            localStorage.setItem('hasShownCameraModal', 'true');
          }
        }, 3500);
      } else {
        setIsAuthenticated(nowAuthenticated);
        setIsCheckingAuth(false);
        if (nowAuthenticated && !cameraPermissionGranted && !localStorage.getItem('hasShownCameraModal')) {
          setShowCameraPermission(true);
          localStorage.setItem('hasShownCameraModal', 'true');
        }
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [isAuthenticated, isCheckingAuth, cameraPermissionGranted]);

  useEffect(() => {
    if (!isLive && !isDetecting && webcamCanvas) {
      const ctx = webcamCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, webcamCanvas.width, webcamCanvas.height);
      }
    }
  }, [isLive, isDetecting, webcamCanvas]);

  // 🚨 Track daily practice time (Quest: Practice 30 mins)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('dailyPracticeDate');
      let seconds = parseInt(localStorage.getItem('dailyPracticeSeconds') || '0', 10);
      if (storedDate !== today) {
        seconds = 0;
        localStorage.setItem('dailyPracticeDate', today);
      }
      seconds += 1;
      localStorage.setItem('dailyPracticeSeconds', seconds.toString());
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setActivePhrase(getPhrasesByCategory(cat)[0]);
    setSelectedVariant("adult");
    setView("game");
    setSidebarOpen(false);
    localStorage.setItem('lastCategory', cat);
  };

  const handlePhraseSelect = (phrase: Phrase) => {
    setActivePhrase(phrase);
    setGameOpen(true);
    setSelectedVariant("adult");
    setByeStep(1);
    setEatStep(1);
    localStorage.setItem('lastCategory', phrase.category);
    localStorage.setItem('lastPhraseId', phrase.id);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          frameRate: { ideal: 30 }
        }
      });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionGranted(true);
      localStorage.setItem('cameraPermissionGranted', 'true');
      setShowCameraPermission(false);
      setTutorialStep("initial");
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermissionGranted(false);
      localStorage.removeItem('cameraPermissionGranted');
      setShowCameraPermission(false);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์");
    }
  };

  const handleVariantChange = (variant: "adult" | "friend") => {
    setSelectedVariant(variant);
    // 🔑 One-Time Start: ไม่ปิดกล้อง — รีเซ็ตแค่ confidence และ phrase state
    setIsPhraseCompleted(false);
    setBestConfidence(0);  // รีเซ็ต confidence เป็น 0% เสมอเมื่อเปลี่ยน variant
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    // ถ้ากล้อง live อยู่แล้ว ให้ยังคง live อยู่ต่อ (เปลี่ยนแค่ variant)
    if (isLive || isDetecting) {
      setButtonState("stop");
    }
    // ถ้ายังไม่เริ่ม ก็ยังคงเป็น start
  };

  const handlePhraseCompletion = (confidence?: number) => {
    const finalConfidence = confidence ?? bestConfidence;
    const newBest = Math.max(bestConfidence, finalConfidence);
    setBestConfidence(newBest);
    setIsPhraseCompleted(true);

    console.log(`🎉 Phrase matched! Best confidence: ${(newBest * 100).toFixed(1)}%`);

    // ไม่ Auto-Collect — ให้ผู้ใช้กดเองทุกครั้ง
    setButtonState("collect");
  };

  const handleCollectPoints = async () => {
    const tierScore = getScoreFromConfidence(bestConfidence); // 40 / 70 / 100
    if (tierScore <= 0) return;

    const user = auth.currentUser;
    if (!user) return;

    if (isCollectingRef.current) return; // ป้องกัน double-click
    isCollectingRef.current = true;

    const phraseKey = (activePhrase.id === "g1" || activePhrase.id === "g4" || activePhrase.id === "g6")
      ? `${activePhrase.id}_${selectedVariant}`
      : activePhrase.id;

    const currentEarned = phrasePoints[phraseKey] || 0;
    const delta = tierScore - currentEarned; // คะแนนที่จะได้เพิ่ม (0 ถ้าไม่มีเพิ่ม)

    if (delta <= 0) {
      // ไม่มีคะแนนใหม่ให้เพิ่ม — แสดง Try Again
      isCollectingRef.current = false;
      setButtonState("tryagain");
      return;
    }

    try {
      // บันทึก delta เข้า phrasePoints ใน Firebase
      const result = await updatePhrasePoints(user.uid, phraseKey, tierScore);
      if (result.error) throw new Error(result.error);

      const newTotal = result.totalForPhrase; // 0-100

      // เพิ่ม delta เข้า total points ของ user
      await addUserPoints(user.uid, result.delta);

      // อัปเดต local state
      setPhrasePoints(prev => ({ ...prev, [phraseKey]: newTotal }));
      setCollectedPhrases(prev => new Set([...prev, phraseKey])); // mark ว่าเคย collect แล้ว

      // ถ้าถึง 100 คะแนน → ถือว่าทำเสร็จเต็ม
      if (newTotal >= 100) {
        await addCompletedPhrase(user.uid, phraseKey);
        setCompletedPhrases(prev => new Set([...prev, phraseKey]));

        // ตรวจว่าท้าย category สำเร็จทั้งหมด → Level Up
        const categoryPhrases = getPhrasesByCategory(category);
        const newCompleted = new Set([...completedPhrases, phraseKey]);
        const allCategoryDone = categoryPhrases.every(p => isPhraseCompletedCheck(p.id, newCompleted));
        if (allCategoryDone) {
          console.log(`🏆 Category "${category}" completed! Level up!`);
          await incrementUserLevel(user.uid);
        }
      }

      console.log(`💰 +${result.delta} pts (tier ${tierScore}) for "${phraseKey}" → total ${newTotal}/100`);
      // แสดง Try Again เสมอ (ทำซ้ำได้จนแตะ 100 คะแนน)
      setButtonState("tryagain");
    } catch (error) {
      console.error("Error collecting points:", error);
    } finally {
      isCollectingRef.current = false;
    }
  };

  const handleTryAgain = () => {
    // 🔑 One-Time Start: ไม่ปิดกล้อง — รีเซ็ตแค่ state ของ phrase เท่านั้น
    setIsPhraseCompleted(false);
    setBestConfidence(0);  // รีเซ็ต confidence เป็น 0%
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    // กล้องยังคงทำงานอยู่ (isLive = true, isDetecting = true stay)
    // แค่เปลี่ยนปุ่มให้กลับไปเป็น "stop" (กำลัง live อยู่)
    setButtonState("stop");
  };

  const handleConfirmHint = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = dbRef(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const currentPoints = snapshot.val().points || 0;

        if (currentPoints >= 25) {
          await update(userRef, { points: currentPoints - 25 });

          toast({
            title: "Success",
            description: "ใช้ Hint สำเร็จ!",
            variant: "success",
          });
          setIsHintActive(true);
          setShowHintModal(false);
        } else {
          toast({
            title: "Error",
            description: "คะแนนไม่พอ! คุณต้องมีอย่างน้อย 25 pts",
            variant: "destructive",
          });
          setShowHintModal(false);
        }
      }
    } catch (error) {
      console.error("Error using hint:", error);
      toast({
        title: "Error",
        description: "เกิดข้อผิดพลาดในการใช้ Hint",
        variant: "destructive",
      });
    }
  };



  // Helper: รีเซ็ต phrase state โดยไม่ปิดกล้อง
  const resetPhraseState = () => {
    setIsPhraseCompleted(false);
    setBestConfidence(0);  // รีเซ็ต confidence เป็น 0% เสมอเมื่อเปลี่ยนคำ
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    // ถ้าเคย start กล้องแล้ว ให้ยังคง detect ต่อ (One-Time Start)
    if (sessionStartedRef.current) {
      setButtonState("stop"); // แสดง Stop เพราะกำลัง live
    } else {
      setButtonState("start");
    }
  };

  const handlePrevPhrase = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isFirstPhrase) {
      handlePhraseSelect(currentCategoryPhrases[currentPhraseIndex - 1]);
      resetPhraseState();
    }
  };

  const handleNextPhrase = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLastPhrase) {
      handlePhraseSelect(currentCategoryPhrases[currentPhraseIndex + 1]);
      resetPhraseState();
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      localStorage.removeItem("cached_avatar");
      await new Promise(resolve => setTimeout(resolve, 3500));
      setView("home");
      setSidebarOpen(false);
      setGameOpen(false);
      setCameraPermissionGranted(false);
      localStorage.removeItem('hasShownCameraModal');
      localStorage.removeItem('cameraPermissionGranted');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (showInitialLoading || isCheckingAuth) {
    return <LoadingScreen message="กำลังตรวจสอบ..." />;
  }

  if (isAuthTransitioning) {
    return <LoadingScreen message={isAuthenticated ? "กำลังออกจากระบบ..." : "กำลังเข้าสู่ระบบ..."} />;
  }

  if (isLoggingOut) {
    return <LoadingScreen message="กำลังออกจากระบบ..." />;
  }

  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={() => { }} />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <GameSidebar
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        onPlayGame={() => { setView("gamesetup"); setSidebarOpen(false); }}
        onLessons={() => { setView("lessons"); setSidebarOpen(false); }}
        onQuest={() => { setView("quest"); setSidebarOpen(false); }}
        onLeaderboard={() => { setView("leaderboard"); setSidebarOpen(false); }}
        onProfile={() => { setView("profile"); setSidebarOpen(false); }}
        onHome={() => { setView("home"); setSidebarOpen(false); }}
        showPlayGame={view === "gamesetup"}
        showLessons={view === "lessons" || view === "game"}
        showQuest={view === "quest"}
        showLeaderboard={view === "leaderboard"}
        showHome={view === "home"}
        showProfile={view === "profile"}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-h-screen">
        <header className="border-b-[3px] border-foreground bg-card px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 pl-12 lg:pl-0">
            {view === "home" && (
              <>
                <Home size={20} className="text-foreground" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground">Home</h2>
              </>
            )}
            {view === "lessons" && (
              <>
                <img src={lessonImg} alt="Lessons" className="w-[20px] h-[20px] object-contain" />
                <h2 className="font-display text-xl text-foreground">Lessons</h2>
              </>
            )}
            {view === "leaderboard" && (
              <>
                <img src={trophyImg} alt="Leaderboard" className="w-5 h-5 object-contain" />
                <h2 className="font-display text-xl text-foreground">Leaderboard</h2>
              </>
            )}
            {view === "quest" && (
              <>
                <img src={questImg} alt="Quest" className="w-[20px] h-[20px] object-contain" />
                <h2 className="font-display text-xl text-foreground">Quest</h2>
              </>
            )}
            {view === "profile" && (
              <>
                <User size={20} className="text-foreground" />
                <h2 className="font-display text-xl text-foreground">Profile</h2>
              </>
            )}
            {view === "gamesetup" && (
              <>
                <img src={challengeImg} alt="Play Game" className="w-[20px] h-[20px] object-contain" />
                <h2 className="font-display text-xl text-foreground">Challenge</h2>
              </>
            )}
            {view === "game" && (
              <>
                <img src={categoryIconMap[category]} alt={category} className="w-5 h-5 object-contain" />
                <h2 className="font-display text-xl text-foreground">
                  {categories.find(c => c.id === category)?.label || category}
                </h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="brutal-btn-secondary flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-body">
              <LogOut size={14} className="sm:hidden" />
              <LogOut size={16} className="hidden sm:block" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </header>

        <div className="h-[calc(100vh-3rem)] sm:h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4.5rem)] flex flex-col">
          {view === "home" && (
            <div className="p-4 lg:p-6 h-full">
              <HomePage
                onCategorySelect={(cat) => {
                  setCategory(cat);
                  setActivePhrase(getPhrasesByCategory(cat)[0]);
                  setSelectedVariant("adult");
                  setView("game");
                  localStorage.setItem('lastCategory', cat);
                }}
                onResumeLesson={() => {
                  const lastPhraseId = localStorage.getItem('lastPhraseId');
                  const lastCat = (localStorage.getItem('lastCategory') as Category) || 'general';
                  const phrases = getPhrasesByCategory(lastCat);
                  const lastPhrase = phrases.find(p => p.id === lastPhraseId) || phrases[0];

                  setCategory(lastCat);
                  setActivePhrase(lastPhrase);
                  setSelectedVariant("adult");
                  setView("game");
                  setGameOpen(true);
                }}
                onLeaderboard={() => setView("leaderboard")}
                onLessons={() => setView("lessons")}
                completedPhrases={completedPhrases}
                streak={userStreak}
                level={userLevel}
              />
            </div>
          )}
          {view === "lessons" && (
            <div className="p-4 lg:p-6 h-full">
              <LessonsPage
                onCategorySelect={(cat) => {
                  setCategory(cat);
                  setActivePhrase(getPhrasesByCategory(cat)[0]);
                  setSelectedVariant("adult");
                  setView("game");
                  localStorage.setItem('lastCategory', cat);
                }}
                completedPhrases={completedPhrases}
                streak={userStreak}
              />
            </div>
          )}
          {view === "leaderboard" && (
            <div className="p-4 lg:p-6 h-full">
              <LeaderboardView />
            </div>
          )}
          {view === "quest" && (
            <div className="h-full overflow-y-auto">
              <QuestView streak={userStreak} />
            </div>
          )}
          {view === "gamesetup" && (
            <div className="h-full flex flex-col w-full">
              <GameSetupPage />
            </div>
          )}
          {view === "profile" && (
            <div className="p-4 lg:p-6 h-full">
              <ProfileEdit onBack={() => setView("home")} />
            </div>
          )}
          {view === "game" && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-12 relative pb-20 sm:pb-32">
              <div className="relative flex items-center justify-center mb-6 sm:mb-8 md:mb-10 mt-1 sm:mt-2">
                <button
                  onClick={() => setView("lessons")}
                  className="absolute left-0 flex items-center gap-1.5 sm:gap-2 text-foreground font-black brutal-btn-secondary w-fit px-2.5 py-1.5 sm:px-4 sm:py-2 hover:-translate-x-1 transition-transform z-10 text-xs sm:text-sm"
                >
                  <ArrowLeft size={16} className="sm:hidden" />
                  <ArrowLeft size={20} className="hidden sm:block" />
                  กลับ
                </button>
                <p className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-base sm:text-xl md:text-2xl lg:text-3xl text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] pl-16 sm:pl-0">
                  UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4 md:gap-x-8 md:gap-y-6">
                {getPhrasesByCategory(category).map((phrase) => {
                  const isCompleted = isPhraseCompletedCheck(phrase.id, completedPhrases);
                  return (
                    <div
                      key={phrase.id}
                      onClick={() => handlePhraseSelect(phrase)}
                      className={`relative brutal-card flex items-center p-2.5 pr-8 sm:p-3 sm:pr-10 md:p-4 md:pr-12 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${isCompleted ? 'bg-green-50' : 'bg-white'}`}
                    >
                      {isCompleted ? (
                        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-green-500 text-white font-black text-[10px] sm:text-xs md:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border-[2px] sm:border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 flex items-center gap-1">
                          <span>✅</span> <span className="hidden sm:inline">ผ่านแล้ว</span>
                        </div>
                      ) : (
                        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-[#f94fa4] text-white font-black text-[10px] sm:text-xs md:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border-[2px] sm:border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                          +{phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} pts
                        </div>
                      )}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-accent/20 brutal-card flex items-center justify-center text-xl sm:text-2xl md:text-3xl mr-3 sm:mr-4 md:mr-6 shrink-0">
                        {phrase.emoji || "✋"}
                      </div>
                      <div>
                        <h3 className="font-black text-base sm:text-lg md:text-2xl mb-0.5 sm:mb-1">{phrase.text}</h3>
                        <p className="text-gray-500 font-bold text-[11px] sm:text-xs md:text-sm">{phrase.english || phrase.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {gameOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm animate-backdrop-in"
              onClick={() => {
                // 🔑 ปิด Modal = Reset ทุกอย่าง (รวมถึง session)
                setGameOpen(false);
                setIsLive(false);
                setIsDetecting(false);
                setTutorialStep("initial");
                setBestConfidence(0);
                setButtonState("start");
                setIsPhraseCompleted(false);
                isCollectingRef.current = false;
                sessionStartedRef.current = false;
                if (successTimerRef.current) {
                  clearTimeout(successTimerRef.current);
                  successTimerRef.current = null;
                }
              }}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-slate-900 border-[2px] sm:border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-w-7xl w-full h-[95vh] sm:h-[90vh] pointer-events-auto animate-modal-in">
                <header className="flex items-center justify-end p-2 sm:p-3 md:p-4 lg:p-6 border-b-[3px] border-foreground bg-yellow-400">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="hidden md:flex items-center px-3 lg:px-4 py-1.5 lg:py-2 bg-pink-400 border-[3px] border-foreground rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-white font-black text-xs lg:text-sm">
                        UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // 🔑 ปิด Modal = Reset ทุกอย่าง (รวมถึง session)
                        setGameOpen(false);
                        setIsLive(false);
                        setIsDetecting(false);
                        setTutorialStep("initial");
                        setBestConfidence(0);
                        setButtonState("start");
                        setIsPhraseCompleted(false);
                        isCollectingRef.current = false;
                        sessionStartedRef.current = false;
                        if (successTimerRef.current) {
                          clearTimeout(successTimerRef.current);
                          successTimerRef.current = null;
                        }
                      }}
                      className="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-foreground rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-transform"
                    >
                      <X size={20} className="text-slate-900" />
                    </button>
                  </div>
                </header>

                <div className="flex flex-1 flex-col overflow-hidden relative">
                  <button
                    onClick={handlePrevPhrase}
                    disabled={isFirstPhrase}
                    className={`absolute left-0 sm:left-2 md:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 w-14 sm:w-16 md:w-20 lg:w-24 hover:-translate-x-2 transition-transform cursor-pointer ${isFirstPhrase ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    <img src={arrowLeftImg} alt="Previous" className="w-full h-full object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" />
                  </button>

                  <button
                    onClick={handleNextPhrase}
                    disabled={isLastPhrase}
                    className={`absolute right-0 sm:right-2 md:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 w-14 sm:w-16 md:w-20 lg:w-24 hover:translate-x-2 transition-transform cursor-pointer ${isLastPhrase ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    <img src={arrowRightImg} alt="Next" className="w-full h-full object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" />
                  </button>

                  <main className="flex-1 p-1 sm:p-2 lg:p-3 xl:p-4 px-10 sm:px-12 md:px-4 bg-[#f8f6f6] dark:bg-[#221610] overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-center pb-1">
                      {activePhrase?.id === "g2" ? (
                        <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
                          <span className="text-slate-900 dark:text-white">ลาก่อน</span>
                          <span className="text-slate-900 dark:text-white mx-1">|</span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && byeStep === 1
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            ฉัน
                          </span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && byeStep === 2
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            ไป
                          </span>
                        </h2>
                      ) : activePhrase?.id === "g3" ? (
                        <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
                          <span className="text-slate-900 dark:text-white">กินข้าวหรือยัง?</span>
                          <span className="text-slate-900 dark:text-white mx-1">|</span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && eatStep === 1
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            ข้าว
                          </span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && eatStep === 2
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            กิน
                          </span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && eatStep === 3
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            หรือยัง?
                          </span>
                        </h2>
                      ) : activePhrase?.id === "g4" ? (
                        <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
                          <span className="text-slate-900 dark:text-white">
                            {selectedVariant === "adult" ? "กินแล้ว" : "ยังไม่ได้กิน"}
                          </span>
                          <span className="text-slate-900 dark:text-white mx-1">|</span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && eatStep === 1
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            กิน
                          </span>
                          <span
                            className={`transition-colors duration-300 ${(isLive || isDetecting) && eatStep === 2
                              ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                              : "text-slate-400"
                              }`}
                          >
                            {selectedVariant === "adult" ? "แล้ว" : "ยัง"}
                          </span>
                        </h2>
                      ) : (
                        <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {activePhrase?.id === "g1"
                            ? (selectedVariant === "adult" ? "สวัสดีผู้ใหญ่" : "สวัสดีเพื่อน")
                            : activePhrase?.id === "g6"
                              ? (selectedVariant === "adult" ? "สบายดี" : "ไม่สบายใจ")
                              : (activePhrase?.text ?? "Hello")
                          }
                        </h2>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3 items-start max-w-[740px] mx-auto w-full">
                      <div className="relative flex flex-col gap-1 sm:gap-1.5 lg:gap-2 w-full items-center lg:items-end">
                        <div className="relative aspect-square w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mr-0 bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <VideoCard
                            phrase={activePhrase?.text ?? "Hello"}
                            category={activePhrase?.category ?? "general"}
                            variant={(activePhrase?.id === "g1" || activePhrase?.id === "g4" || activePhrase?.id === "g6") ? selectedVariant : undefined}
                            byeStep={activePhrase?.id === "g2" ? byeStep : undefined}
                            eatStep={(activePhrase?.id === "g3" || activePhrase?.id === "g4") ? eatStep : undefined}
                            isLive={isLive || isDetecting}
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/90 px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs absolute top-3 left-3">
                              TUTORIAL
                            </div>
                            <img
                              src={hintImg}
                              alt="Hint"
                              // 🚨 ปรับลดขนาด w- และ h- ลงในทุก breakpoint
                              onClick={() => setShowHintModal(true)}
                              className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 object-contain opacity-90 drop-shadow-md pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                            />
                          </div>
                        </div>

                        {activePhrase?.id === "g1" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => handleVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีผู้ใหญ่
                            </button>
                            <button
                              onClick={() => handleVariantChange("friend")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีเพื่อน
                            </button>
                          </div>
                        )}
                        {activePhrase?.id === "g4" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => handleVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              กินแล้ว
                            </button>
                            <button
                              onClick={() => handleVariantChange("friend")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              ยังไม่ได้กิน
                            </button>
                          </div>
                        )}
                        {activePhrase?.id === "g6" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => handleVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สบายดี
                            </button>
                            <button
                              onClick={() => handleVariantChange("friend")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              ไม่สบายใจ
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 sm:gap-1.5 lg:gap-2 w-full items-center lg:items-start">
                        <div className="relative aspect-square w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <WebcamView
                            onNextLevel={() => setIsPhraseCompleted(true)}
                            cameraEnabled={cameraPermissionGranted}
                            onVideoReady={(video) => setWebcamVideo(video)}
                            onCanvasReady={(canvas) => setWebcamCanvas(canvas)}
                          />

                          {(tutorialStep === "scanning" || tutorialStep === "too_close") && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20 transition-all">
                              <img src={guideHumanImg} alt="Guide" className="w-full h-full object-cover opacity-80" />
                              <div className={`absolute bottom-6 bg-white/95 border-[3px] border-foreground rounded-full px-4 py-2 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${tutorialStep === "too_close" ? "text-red-500 animate-pulse border-red-500 scale-105 transition-transform" : "animate-bounce"}`}>
                                {tutorialStep === "too_close" ? "ขยับถอยห่างไปอีกหน่อย" : "ถอยหลังออกไปให้มีระยะห่างจากกล้อง"}
                              </div>
                            </div>
                          )}

                          {tutorialStep === "success" && (
                            <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-300">
                              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border-[4px] border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-4xl flex items-center justify-center w-full h-full pt-1">✓</span>
                              </div>
                              <h3 className="text-white font-black text-2xl drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">Success!</h3>
                              <p className="text-white font-bold drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mt-2">คุณอยู่ในตำแหน่งที่เหมาะสมแล้ว</p>
                            </div>
                          )}

                          <div className="absolute inset-0 border-4 border-dashed border-[#ec5b13]/50 m-3 rounded-lg pointer-events-none"></div>

                          <div className="absolute top-3 right-3 animate-bounce z-10">
                            <div className="bg-pink-500 text-white border-[3px] border-foreground rounded-xl px-2 lg:px-3 py-1 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 text-xs">
                              {(() => {
                                const score = getScoreFromConfidence(bestConfidence);
                                return score > 0 ? `+ ${score} PTS` : '+ ? PTS';
                              })()}
                            </div>
                          </div>

                          <div className="absolute bottom-3 left-3 z-10">
                            <div className={`px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs flex items-center gap-1.5 ${isLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-gray-400 text-white'
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-white/50'
                                }`}></span>
                              LIVE
                            </div>
                          </div>

                          {isLive && (
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">

                              {/* กล่องแสดงคำทำนาย (ค้างไว้ตลอดตราบใดที่มีข้อมูล) - ปรับขนาดให้เล็กลง */}
                              <div className={`bg-white/95 backdrop-blur-sm border-[2px] ${signRecognition.isMatched ? 'border-green-500 bg-green-50/95' : 'border-foreground'} rounded-md px-2 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[110px] transition-colors duration-300`}>

                                {/* คำที่ทาย + เปอร์เซ็นต์ */}
                                <div className="flex items-end justify-between gap-2">
                                  <span className={`text-sm leading-none ${signRecognition.isMatched ? 'text-green-700' : 'text-slate-800'} truncate max-w-[90px]`}>
                                    {targetDisplayWord}
                                  </span>
                                  <span className={`text-xs leading-none ${signRecognition.isMatched ? 'text-green-600' : 'text-primary'}`}>
                                    {signRecognition.isMatched ? (signRecognition.currentConfidence * 100).toFixed(0) : "0"}%
                                  </span>
                                </div>
                              </div>

                              {/* กล่องแจ้งเตือน Error */}
                              {signRecognition.error && (
                                <div className="bg-red-500/95 backdrop-blur-sm border-[2px] border-foreground rounded-lg px-3 py-2 font-bold text-xs text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-[180px]">
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                    <span>ไม่พบกล้อง / เกิดข้อผิดพลาด</span>
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>

                        {/* Multi-state button: Start → Stop → Collect Point → Try Again */}
                        {(() => {
                          // Camera permission button
                          if (!cameraPermissionGranted) {
                            return (
                              <button
                                onClick={() => setShowCameraPermission(true)}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                📹 อนุญาตการเข้าถึงกล้อง
                              </button>
                            );
                          }

                          const currentScore = getScoreFromConfidence(bestConfidence); // tier: 40, 70, 100
                          const isLocked = bestConfidence < 0.5;
                          const phraseKey = (activePhrase?.id === "g1" || activePhrase?.id === "g4" || activePhrase?.id === "g6")
                            ? `${activePhrase.id}_${selectedVariant}`
                            : activePhrase?.id;
                          // คะแนนที่สะสมไว้แล้วสำหรับคำนี้
                          const earnedForPhrase = phraseKey ? (phrasePoints[phraseKey] || 0) : 0;
                          // delta = คะแนนที่จะได้เพิ่มถ้ากด Collect ตอนนี้
                          const deltaPoints = Math.max(0, currentScore - earnedForPhrase);

                          // Try Again state
                          if (buttonState === "tryagain") {
                            return (
                              <button
                                onClick={handleTryAgain}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-2 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-purple-500 hover:bg-purple-600 text-white"
                              >
                                🔄 TRY AGAIN
                              </button>
                            );
                          }

                          // Collect Point state
                          if (buttonState === "collect" && isPhraseCompleted) {
                            return (
                              <div className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 flex flex-col gap-1.5">
                                <button
                                  onClick={() => {
                                    if (isLocked) return;
                                    if (deltaPoints <= 0) {
                                      handleTryAgain();
                                    } else {
                                      handleCollectPoints();
                                    }
                                  }}
                                  disabled={isLocked}
                                  className={`w-full h-12 lg:h-14 flex items-center justify-center gap-2 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm ${isLocked
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-70'
                                    : deltaPoints <= 0
                                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                      : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:translate-y-0.5'
                                    }`}
                                >
                                  {isLocked
                                    ? `🔒 ต้องถึง 50% (ตอนนี้ ${(bestConfidence * 100).toFixed(0)}%)`
                                    : deltaPoints <= 0
                                      ? `🔄 TRY AGAIN`
                                      : (
                                        <>
                                          <img src={collectPointsImg} alt="Collect points" className="w-14 h-14 object-contain" />
                                          <span className="text-white">COLLECT +{deltaPoints} PTS</span>
                                        </>
                                      )
                                  }
                                </button>
                              </div>
                            );
                          }

                          // Stop state (กล้องกำลัง live หรือ detecting)
                          if (buttonState === "stop" || isDetecting || isLive) {
                            return (
                              <button
                                onClick={() => {
                                  // กด Stop = หยุด session ทั้งหมด รีเซ็ตกล้อง
                                  setIsLive(false);
                                  setIsDetecting(false);
                                  setTutorialStep("initial");
                                  setIsPhraseCompleted(false);
                                  setBestConfidence(0);
                                  setButtonState("start");
                                  setByeStep(1);
                                  setEatStep(1);
                                  isCollectingRef.current = false;
                                  sessionStartedRef.current = false; // Reset session
                                  if (successTimerRef.current) {
                                    clearTimeout(successTimerRef.current);
                                    successTimerRef.current = null;
                                  }
                                }}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-red-500 hover:bg-red-600 text-white"
                              >
                                ⏹ STOP
                              </button>
                            );
                          }

                          // Default: Start state
                          return (
                            <button
                              onClick={() => {
                                // 🔑 One-Time Start — set sessionStartedRef
                                sessionStartedRef.current = true;
                                setTutorialStep("scanning");
                                setIsDetecting(true);
                                setBestConfidence(0);
                                setButtonState("stop");
                              }}
                              className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-green-500 hover:bg-green-600 text-white"
                            >
                              ▶ START
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    <footer className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t-[2px] border-slate-200 dark:border-slate-800 w-full">
                      <div className="flex justify-center gap-2 sm:gap-4 pb-2 pt-3 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {currentCategoryPhrases.map((phrase) => {
                          const isActive = phrase.id === activePhrase?.id;
                          const isCompleted = isPhraseCompletedCheck(phrase.id, completedPhrases);
                          return (
                            <div
                              key={phrase.id}
                              onClick={() => {
                                handlePhraseSelect(phrase);
                                // 🔑 One-Time Start: ไม่ปิดกล้อง — แค่รีเซ็ต state ของ phrase
                                resetPhraseState();
                              }}
                              className={`relative border-[2px] border-foreground rounded-lg flex items-center py-1 px-2 sm:py-2 sm:px-3 cursor-pointer flex-none w-[120px] sm:w-[140px] md:w-[160px] min-h-[48px] sm:min-h-[56px] transition-all ${isActive
                                ? 'shadow-[0px_0px_0px_3px_rgba(253,224,71,1)] scale-[1.02] z-10'
                                : 'opacity-70 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:opacity-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                } ${isCompleted ? 'bg-green-50' : 'bg-white'}`}
                            >
                              {isCompleted ? (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded-full border-[1.5px] border-foreground z-10 flex items-center gap-1">
                                  <span>✅</span> <span className="hidden sm:inline">ผ่านแล้ว</span>
                                </div>
                              ) : (
                                <div className="absolute -top-2 -right-2 bg-[#f94fa4] text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded-full border-[1.5px] border-foreground z-10">
                                  +{phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} pts
                                </div>
                              )}

                              {/* ไอคอน */}
                              <div className={`w-7 h-7 sm:w-9 sm:h-9 border-[1.5px] border-foreground rounded-md flex items-center justify-center text-sm sm:text-base shrink-0 mr-2 sm:mr-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-pink-300`}>
                                {phrase.emoji || '✋'}
                              </div>

                              {/* ข้อความ */}
                              <div className="flex flex-col flex-1 overflow-hidden justify-center">
                                <h3 className="font-black text-[9px] sm:text-[11px] md:text-[12px] text-slate-800 truncate leading-tight mb-0.5">
                                  {phrase.text}
                                </h3>
                                <p className="text-gray-500 font-bold text-[7px] sm:text-[8px] md:text-[9px] truncate">
                                  {phrase.english || phrase.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </footer>
                  </main>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowHintModal(false)}
          />
          <div className="relative bg-slate-100 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-[200px] sm:max-w-[240px] p-4 animate-in zoom-in duration-200">
            <h2 className="text-lg sm:text-xl font-black text-center text-foreground uppercase tracking-wider mb-1">Hint!</h2>
            <p className="text-center font-bold text-red-500 text-sm sm:text-base mb-4">-25 pts</p>
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <button
                onClick={handleConfirmHint}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-[2px] sm:border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-lg sm:rounded-xl py-1.5 sm:py-2 font-black text-xs sm:text-sm transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowHintModal(false)}
                className="w-full bg-white hover:bg-slate-50 border-[2px] sm:border-[3px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-lg sm:rounded-xl py-1.5 sm:py-2 font-black text-slate-900 text-xs sm:text-sm transition-all"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {showCameraPermission && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm"
            onClick={() => { }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="brutal-card-lg max-w-md w-full bg-background">
              <div className="border-b-[3px] border-foreground bg-secondary px-6 py-4">
                <h2 className="font-display text-xl text-secondary-foreground text-center">
                  📹 อนุญาตการเข้าถึงกล้อง
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-[3px] border-foreground">
                    <Camera size={48} className="text-accent" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-body text-foreground font-bold text-lg">
                    SignMate ต้องการใช้กล้องของคุณ
                  </p>
                  <p className="font-body text-muted-foreground text-sm">
                    เราใช้กล้องเพื่อตรวจจับท่าทางภาษามือของคุณแบบเรียลไทม์
                    ข้อมูลวิดีโอจะไม่ถูกบันทึกหรือส่งออกไปจากอุปกรณ์ของคุณ
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={requestCameraPermission}
                    className="w-full brutal-btn-primary font-bold"
                  >
                    อนุญาตการเข้าถึงกล้อง
                  </button>
                  <button
                    onClick={() => {
                      setShowCameraPermission(false);
                      setCameraPermissionGranted(false);
                    }}
                    className="w-full brutal-btn-secondary text-sm"
                  >
                    ข้าม (เล่นโดยไม่มีกล้อง)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;