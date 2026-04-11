import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GameSidebar } from "@/components/GameSidebar";
import { VideoCard } from "@/components/VideoCard";
import { WebcamView } from "@/components/WebcamView";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PredictionOverlay } from "@/components/PredictionOverlay";
import { HomePage } from "@/components/HomePage";
import { LessonsPage } from "@/components/LessonsPage";
import { QuestView } from "@/components/QuestView";
import { GameSetupPage } from "@/components/GameSetupPage";
import { CameraPermission } from "@/components/CameraPermission";
import { TutorialModal } from "@/components/TutorialModal";
import { Category, Phrase, getPhrasesByCategory, categories, isPhraseCompletedCheck, resolveTargetClass } from "@/lib/categories";
import { LogOut, X, Camera, Home, User, ArrowLeft, Check, Menu } from "lucide-react";
import { useSignAndDistance, DistanceStatus } from "@/hooks/useSignAndDistance";
import { auth, database } from "@/lib/firebase";
import { ref as dbRef, get, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { signOutUser, updateStreakOnLogin, getUserData, addUserPoints, incrementUserLevel, addCompletedPhrase, updatePhrasePoints, saveUnlockedHint } from "@/lib/auth";
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

import generalImg from "@/asset/image/general.webp";
import emotionalImg from "@/asset/image/emotional.webp";
import qaImg from "@/asset/image/qa.webp";
import illnessImg from "@/asset/image/illness.webp";
import trophyImg from "@/asset/image/Trophy.webp";
import questImg from "@/asset/image/quest.webp";
import challengeImg from "@/asset/image/challenge.webp";
import lessonImg from "@/asset/image/lesson.webp";
import alreadyAteImg from "@/asset/image/Already ate | Not yet.webp";
import feverImg from "@/asset/image/fever.webp";
import goodbyeImg from "@/asset/image/Goodbye.webp";
import haveYouEatenImg from "@/asset/image/Have you eaten.webp";
import helloImg from "@/asset/image/Hello.webp";
import howMuchImg from "@/asset/image/How much.webp";
import loveImg from "@/asset/image/Love.webp";
import scaredImg from "@/asset/image/Scared.webp";
import soreThroatImg from "@/asset/image/Sore throat.webp";
import stomachacheImg from "@/asset/image/Stomachache.webp";
import tiredImg from "@/asset/image/Tired.webp";
import whatImg from "@/asset/image/What.webp";
import whyImg from "@/asset/image/Why.webp";
import angryImg from "@/asset/image/angry.webp";
import yesImg from "@/asset/image/yes.webp";
import noImg from "@/asset/image/no.webp";
import headacheImg from "@/asset/image/headache.webp";
import coldImg from "@/asset/image/cold.webp";
import fineUnhappyImg from "@/asset/image/I'm fine | Unhappy.webp";
import howAreYouImg from "@/asset/image/how_are_you.webp";

type View = "home" | "lessons" | "game" | "leaderboard" | "quest" | "profile" | "playing" | "gamesetup";

const phraseIconMap: Record<string, string> = {
  g1: helloImg,
  g2: goodbyeImg,
  g3: haveYouEatenImg,
  g4: alreadyAteImg,
  g5: howAreYouImg,
  g6: fineUnhappyImg,
  e1: angryImg,
  e2: scaredImg,
  e3: loveImg,
  e5: tiredImg,
  q1: whatImg,
  q2: whyImg,
  q3: howMuchImg,
  q4: yesImg,
  q5: noImg,
  i1: coldImg,
  i2: soreThroatImg,
  i3: stomachacheImg,
  i4: headacheImg,
  i5: feverImg,
};

const categoryIconMap: Record<string, string> = {
  general: generalImg,
  emotions: emotionalImg,
  qa: qaImg,
  illness: illnessImg,
};

const preloadAllAvatars = async () => {
  try {

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
  const location = useLocation();
  const navigate = useNavigate();
  const [view, setView] = useState<View>(((location.state as any)?.view as View) || "home");

  useEffect(() => {
    // Clear the router state on mount so that a hard refresh defaults back to "home" instead of persisting "gamesetup"
    if ((location.state as any)?.view) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(() => {
    return sessionStorage.getItem('cameraPermissionGranted') === 'true';
  });
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [skipCameraCalibration, setSkipCameraCalibration] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [isLive, setIsLive] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isPhraseCompleted, setIsPhraseCompleted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<"adult" | "friend">("adult");
  const [byeStep, setByeStep] = useState<1 | 2>(1);
  const [eatStep, setEatStep] = useState<1 | 2 | 3>(1);
  const [tutorialStep, setTutorialStep] = useState<"initial" | "scanning" | "too_close" | "success">("initial");
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [webcamCanvas, setWebcamCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [scanningLocked, setScanningLocked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goodPositionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard: ป้องกัน Auto-Collect double-fire
  const isCollectingRef = useRef(false);
  // Track ว่า Session เริ่มไปแล้วหรือยัง (One-Time Start)
  const sessionStartedRef = useRef(false);

  const { toast } = useToast();
  const [showHintModal, setShowHintModal] = useState(false);
  // hintUnlocked tracks which phrase+variant keys have been paid for (e.g. "g1_adult", "g1_friend", "e1")
  const [hintUnlocked, setHintUnlocked] = useState<Set<string>>(new Set());
  const [showHintContent, setShowHintContent] = useState(false);

  // Hint text per modelClass — two sentences separated by \n for line-breaking
  const phraseHintMap: Record<string, string> = {
    already: "ค่อยๆแบมือ -> สะบัดออกจากตัวช้าๆ -> ค้างไว้บริเวณเอว",
    angry: "ค่อยๆงอนิ้วมือ -> ดึงออกจากหน้าผาก -> ค้างไว้",
    bye_go: "ค่อยๆแบมือชิดกัน -> ตวัดมือออกจากตัวขึ้นไปด้านบน -> ค้างไว้",
    bye_me: "ค่อยๆนำมือแนบหน้าอก -> นิ้วเรียงชิดกัน -> ตบหน้าอกเบาๆ -> ค้างไว้",
    cold: "ค่อยๆเอียงหน้า -> ชูสองนิ้วขึ้นลง -> ตรงปลายจมูก -> ค้างไว้",
    eat: "ค่อยๆทำนิ้วทั้งหมดเป็นรูปจีบ -> ไว้บริเวณปาก -> ค้างไว้",
    fear: "ค่อยๆกำมือสองข้าง -> เขย่ามือ บริเวณหน้าอก -> ค้างไว้",
    fever: "ค่อยๆแบมือ -> นิ้วชิดติดกัน -> ไว้บริเวณหน้าผาก -> มือมาพัดขึ้นลงที่ท้อง -> ค้างไว้",
    fine: "ค่อยๆรูดมือจากกลางหน้าอก -> กำมือชูนิ้วโป้ง -> ยิ้ม -> ค้างไว้",
    headache: "ค่อยๆงอนิ้วมือ -> มือมาไว้ที่หัว -> ทำท่าทางขยุมๆ -> เอียงหัวไปหามือ -> ค้างไว้",
    hello_adult: "ค่อยๆพนมมือเป็นรูปดอกบัวแล้วก้มหัวลง -> ค้างไว้",
    hello_friend: "ค่อยๆแบนิ้วชิดกัน -> ไว้บริเวณหน้าผาก -> เคลื่อนมือมาข้างหน้า -> ค้างไว้",
    how_are_you: "ค่อยๆรูดมือจากกลางหน้าอก -> กำมือชูนิ้วโป้ง -> ก้มสงสัย -> ค้างไว้",
    how_much: "ค่อยๆนำแค่นิ้วโป้งถูนิ้วชี้ไปมา (นิ้วที่เหลือชิดกัน) -> ค้างไว้",
    love: "ค่อยๆแบมือมาซ้อนกัน -> วางไว้บริเวณหัวใจ -> เอียงคอ -> ค้างไว้",
    no: "ค่อยๆแบหลังมือ -> ส่ายไปมา (ขนานกับไหล่) -> ค้างไว้",
    rice: "ค่อยๆนำนิ้วโป้ง และนิ้วก้อยมาแตะๆกัน -> ค้างไว้",
    sore_throat: "ค่อยๆนำนิ้วโป้ง และนิ้วก้อย รูดลงที่คอเบาๆ -> ค้างไว้",
    stomachache: "ค่อยๆงอนิ้วมือทั้งห้า -> ขยำๆมือที่บริเวณหน้าท้อง (สะดือ) -> ค้างไว้",
    tired: "ค่อยๆนำนิ้วทั้งหมด ชี้เข้าที่ตัวเอง -> ห่อไหล่ -> หุบแขนเข้า -> ก้มลงเล็กน้อย -> ค้างไว้",
    unhappy: "ค่อยๆเอียงคอ -> รูดมือจากท้องถึงอก -> ค้างไว้บริเวณไหล่ -> ค่อยๆสะบัด -> ค้างไว้",
    what: "ค่อยๆนิ้วชี้ส่ายไปมา -> ขนานกับหน้าอกหรือหัวไหล่ -> ค้างไว้",
    why: "ค่อยๆแบนิ้วชิดกัน -> นาบมือไว้หน้าผาก -> ลากลงมาข้างหน้า -> กางนิ้วชี้และโป้งออก -> ค้างไว้",
    yes: "ค่อยๆกำมือ -> วางไว้หน้าอก -> กวักมือ -> ค้างไว้",
    yet: "ค่อยๆกางนิ้วก้อยและนิ้วโป้งออก -> ขยับส่ายไปมา -> ระยะเดียวกันกับหน้าอก -> ค้างไว้",
  };

  // New states for confidence scoring & button flow
  const [bestConfidence, setBestConfidence] = useState(0);
  const [buttonState, setButtonState] = useState<ButtonState>("start");
  const [collectedPhrases, setCollectedPhrases] = useState<Set<string>>(new Set());
  // คะแนนสะสมต่อคำ (0-100) key = phraseKey
  const [phrasePoints, setPhrasePoints] = useState<Record<string, number>>({});

  // 🚨 1. ปรับลดเวลาที่บังคับสแกนจาก 3 วิ เหลือ 1.5 วินาที
  const MIN_SCANNING_DURATION = 1500;



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

  // Helper: unique key per phrase+variant for tracking which hints are unlocked
  const getCurrentHintKey = (): string => {
    if (!activePhrase) return "";
    // These phrases have two separately-paid variants
    if (activePhrase.id === "g1" || activePhrase.id === "g4" || activePhrase.id === "g6") {
      return `${activePhrase.id}_${selectedVariant}`;
    }
    return activePhrase.id;
  };

  // Helper: get hint text for the active phrase/step/variant as a single string
  const getCurrentHintText = (): string => {
    if (!activePhrase) return "";
    if (activePhrase.id === "g1") return phraseHintMap[selectedVariant === "adult" ? "hello_adult" : "hello_friend"] || "";
    if (activePhrase.id === "g2") return phraseHintMap[byeStep === 1 ? "bye_me" : "bye_go"] || "";
    if (activePhrase.id === "g3") return phraseHintMap[eatStep === 1 ? "rice" : eatStep === 2 ? "eat" : "yet"] || "";
    if (activePhrase.id === "g4") return selectedVariant === "adult"
      ? phraseHintMap[eatStep === 1 ? "eat" : "already"] || ""
      : phraseHintMap[eatStep === 1 ? "eat" : "yet"] || "";
    if (activePhrase.id === "g5") return phraseHintMap["how_are_you"] || "";
    if (activePhrase.id === "g6") return phraseHintMap[selectedVariant === "adult" ? "fine" : "unhappy"] || "";
    const mc = effectivePhrase?.modelClass;
    if (mc && phraseHintMap[mc]) return phraseHintMap[mc];
    return "";
  };

  // Helper: get video URLs for current phrase/variant (for tip modal)
  const getCurrentHintVideos = (): { url: string; label: string; text: string }[] => {
    if (!activePhrase) return [];
    const base = "/videos/Tips_video/";
    if (activePhrase.id === "g1") {
      const key = selectedVariant === "adult" ? "hello_adult" : "hello_friend";
      return [{ url: `${base}${key}-tip.mp4`, label: selectedVariant === "adult" ? "สวัสดีผู้ใหญ่" : "สวัสดีเพื่อน", text: phraseHintMap[key] || "" }];
    }
    if (activePhrase.id === "g2") {
      const stepKey = byeStep === 1 ? "bye_me" : "bye_go";
      const stepLabel = byeStep === 1 ? "ฉัน" : "ไป";
      return [{ url: `${base}${stepKey}-tip.mp4`, label: stepLabel, text: phraseHintMap[stepKey] || "" }];
    }
    if (activePhrase.id === "g3") {
      const stepKey = eatStep === 1 ? "rice" : eatStep === 2 ? "eat" : "yet";
      const stepLabel = eatStep === 1 ? "ข้าว" : "กิน";
      const stepLabelFinal = eatStep === 3 ? "หรือยัง?" : stepLabel;
      return [{ url: `${base}${stepKey}-tip.mp4`, label: stepLabelFinal, text: phraseHintMap[stepKey] || "" }];
    }
    if (activePhrase.id === "g4") {
      if (selectedVariant === "adult") {
        const stepKey = eatStep === 1 ? "eat" : "already";
        const stepLabel = eatStep === 1 ? "กิน" : "แล้ว";
        return [{ url: `${base}${stepKey}-tip.mp4`, label: stepLabel, text: phraseHintMap[stepKey] || "" }];
      } else {
        const stepKey = eatStep === 1 ? "eat" : "yet";
        const stepLabel = eatStep === 1 ? "กิน" : "ยัง";
        return [{ url: `${base}${stepKey}-tip.mp4`, label: stepLabel, text: phraseHintMap[stepKey] || "" }];
      }
    }
    if (activePhrase.id === "g5") return [{ url: `${base}how_are_you-tip.mp4`, label: "สบายดีไหม?", text: phraseHintMap["how_are_you"] || "" }];
    if (activePhrase.id === "g6") {
      const key = selectedVariant === "adult" ? "fine" : "unhappy";
      return [{ url: `${base}${key}-tip.mp4`, label: selectedVariant === "adult" ? "สบายดี" : "ไม่สบายใจ", text: phraseHintMap[key] || "" }];
    }
    // Other phrases — map from modelClass
    const mc = effectivePhrase?.modelClass;
    if (mc) return [{ url: `${base}${mc}-tip.mp4`, label: activePhrase.text, text: phraseHintMap[mc] || "" }];
    return [];
  };


  const currentCategoryPhrases = getPhrasesByCategory(category);
  const currentPhraseIndex = currentCategoryPhrases.findIndex(p => p.id === activePhrase?.id);
  const isFirstPhrase = currentPhraseIndex <= 0;
  const isLastPhrase = currentPhraseIndex >= currentCategoryPhrases.length - 1;

  const signRecognition = useSignAndDistance({
    videoElement: webcamVideo,
    canvasElement: webcamCanvas,
    // 🚨 เหมือน SignDefenderPage: enabled ตลอดทันทีที่กล้องพร้อมและ modal เปิด
    // ทำให้โมเดล buffer keypoints ไว้ล่วงหน้า พร้อมใช้ทันทีเมื่อ user กด START
    enabled: cameraPermissionGranted && gameOpen && !isTransitioning,
    predictEnabled: isLive || isDetecting,
    targetPhrase: (isLive || isDetecting) && !isPhraseCompleted ? effectivePhrase : undefined,
    userId: auth.currentUser?.uid,
    logTargetWord: effectivePhrase ? resolveTargetClass(effectivePhrase, selectedVariant) : undefined,
    tooCloseThreshold: 0.15,
    distanceThreshold: 0.05,
    variant: (activePhrase?.id === "g1" || activePhrase?.id === "g4" || activePhrase?.id === "g6") ? selectedVariant : undefined,
    onPhraseMatch: (prediction, confidence) => {
      // ยิง onPhraseMatch เฉพาะตอนที่ผู้ใช้กด START แล้วเท่านั้น
      if (!isLive && !isDetecting) return;
      if (isPhraseCompleted) return;
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
      // Update best confidence if it matches target
      if ((isLive || isDetecting) && signRecognition.isMatched) {
        setBestConfidence(prev => Math.max(prev, prediction.confidence));
      }
    },
  });

  // Proxy the distanceStatus state for the original Index logic
  const distanceStatus = signRecognition.distanceStatus;

  // 🧹 Clear stale keypoints จาก CalibrationModal ทุกครั้งที่เปิด modal ใหม่
  // ป้องกัน keypoints จาก calibration webcam ปนใน buffer ของ lesson
  useEffect(() => {
    if (gameOpen) {
      signRecognition.clearBuffer();
    }
  }, [gameOpen, signRecognition.clearBuffer]);

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

  // 🚨 3. โค้ดพระเอก: ปรับ Logic แตะปุ๊บล็อกปั๊บ (ไม่รีเซ็ตเวลาเมื่อหน้าหลุด)
  useEffect(() => {
    if (!isDetecting) return;

    // 🔑 ล็อกคิว: ถ้าเวลาหน่วง 1 วิเริ่มเดินแล้ว หรือกำลังโชว์ Success อยู่
    // ให้ "เพิกเฉย" ต่อการเปลี่ยนแปลงระยะห่างไปเลย (หน้าหลุดก็ไม่ต้องสน)
    if (goodPositionTimerRef.current || successTimerRef.current) return;

    if (distanceStatus === "too_close") {
      setTutorialStep("too_close");
    } else if (distanceStatus === "good") {
      if (scanningLocked) {
        setTutorialStep("scanning");
      } else {
        // ✅ พอเข้าระยะ Good ปุ๊บ ล็อกคิวทันที!
        setTutorialStep("scanning"); // ค้างหน้าสแกนไว้แป๊บนึงให้ดูเนียน

        goodPositionTimerRef.current = setTimeout(() => {
          // โชว์หน้า Success หลังผ่านไป 1 วิ
          setTutorialStep("success");

          // นับต่ออีก 2.5 วิ ค่อยเข้าเกม
          successTimerRef.current = setTimeout(() => {
            setIsLive(true);
            setTutorialStep("initial");
            setIsDetecting(false);

            // เคลียร์คิวทั้งหมดเมื่อจบ Process
            successTimerRef.current = null;
            goodPositionTimerRef.current = null;
          }, 2500);
        }, 1000); // ⏳ หน่วงเวลา 1 วินาที (1000ms)
      }
    } else {
      // กรณี "no_face" หรือกำลังหามุม (ถ้ายังไม่ถูกล็อกคิว)
      setTutorialStep("scanning");
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
          // Load unlocked hints from Firebase
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
          if (nowAuthenticated && !sessionStorage.getItem('hasShownCameraModal')) {
            setShowCameraPermission(true);
            sessionStorage.setItem('hasShownCameraModal', 'true');
          }
        }, 3500);
      } else {
        setIsAuthenticated(nowAuthenticated);
        setIsCheckingAuth(false);
        if (nowAuthenticated && !sessionStorage.getItem('hasShownCameraModal')) {
          setShowCameraPermission(true);
          sessionStorage.setItem('hasShownCameraModal', 'true');
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

  const requestCameraPermission = async (fromCalibration = false) => {
    try {
      if (!fromCalibration) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30 }
          }
        });
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraPermissionGranted(true);
      sessionStorage.setItem('cameraPermissionGranted', 'true');
      setShowCameraPermission(false);
      setSkipCameraCalibration(false);
      setTutorialStep("initial");
      // 🎓 แสดง How-to-Play modal หลังจาก Calibration เสร็จ
      setShowHowToPlay(true);
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermissionGranted(false);
      sessionStorage.removeItem('cameraPermissionGranted');
      setShowCameraPermission(false);
      setSkipCameraCalibration(false);
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
      // 🚨 เพิ่ม: สับสวิตช์ปิด-เปิด API เพื่อล้าง Cache ทิ้งตอนเปลี่ยน Variant
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 150);
    }
  };

  const handlePhraseCompletion = (confidence?: number) => {
    const finalConfidence = confidence ?? bestConfidence;
    const newBest = Math.max(bestConfidence, finalConfidence);
    setBestConfidence(newBest);
    setIsPhraseCompleted(true);



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

          await incrementUserLevel(user.uid);
        }
      }


      // แสดง Try Again เสมอ (ทำซ้ำได้จนแตะ 100 คะแนน)
      setButtonState("tryagain");
    } catch (error) {
      console.error("Error collecting points:", error);
    } finally {
      isCollectingRef.current = false;
    }
  };

  // 🔑 ปิด Modal พร้อม smooth animation
  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setGameOpen(false);
      setIsClosingModal(false);
      setIsLive(false);
      setIsDetecting(false);
      setTutorialStep("initial");
      setBestConfidence(0);
      setButtonState("start");
      setIsPhraseCompleted(false);
      isCollectingRef.current = false;
      sessionStartedRef.current = false;
      // 🚨 Reset webcam refs เหมือน SignDefenderPage ตอนเปลี่ยน phase
      // ป้องกัน stale video element ถูกส่งให้ MediaPipe เมื่อเปิด modal ใหม่
      setWebcamVideo(null);
      setWebcamCanvas(null);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      if (goodPositionTimerRef.current) {
        clearTimeout(goodPositionTimerRef.current);
        goodPositionTimerRef.current = null;
      }
    }, 240);
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

    // 🚨 เพิ่ม: สับสวิตช์ปิด-เปิด API เพื่อล้าง Cache ทิ้งตอนกด Try Again
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleConfirmHint = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 🚨 ปิดการเช็คและตัดคะแนนชั่วคราว (คอมเมนต์ไว้)
      /*
      const userRef = dbRef(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const currentPoints = snapshot.val().points || 0;

        if (currentPoints >= 25) {
          await update(userRef, { points: currentPoints - 25 });
      */

      // ปล่อยให้ทำงานส่วนนี้ทันที (ปลดล็อก Hint ฟรี)
      const hintKey = getCurrentHintKey();

      // Save unlocked hint to Firebase so it persists across refreshes
      await saveUnlockedHint(user.uid, hintKey);

      setHintUnlocked(prev => new Set([...prev, hintKey]));
      setShowHintModal(false);
      setShowHintContent(true); // show hintbox right after confirming

      /*
        } else {
          toast({
            title: "Error",
            description: "คะแนนไม่พอ! คุณต้องมีอย่างน้อย 25 pts",
            variant: "destructive",
          });
          setShowHintModal(false);
        }
      }
      */
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
    // Close hint modals when switching phrases (hintUnlocked persists — key differs per phrase)
    setShowHintContent(false);
    setShowHintModal(false);
    // ถ้าเคย start กล้องแล้ว ให้ยังคง detect ต่อ (One-Time Start)
    if (sessionStartedRef.current) {
      setButtonState("stop");
      // 🚨 3. สับสวิตช์ปิด-เปิด API (150ms) เพื่อล้าง Cache ทิ้ง
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
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
      sessionStorage.removeItem('hasShownCameraModal');
      sessionStorage.removeItem('cameraPermissionGranted');
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

      <main className="flex-1 min-h-screen overflow-x-hidden">
        <header className="border-b-[3px] border-foreground bg-card px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden shrink-0 p-1.5 -ml-1 rounded-md touch-manipulation active:bg-foreground/10 hover:bg-foreground/10 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {view === "home" && (
              <>
                <Home size={18} className="text-foreground shrink-0 sm:w-5 sm:h-5" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Home</h2>
              </>
            )}
            {view === "lessons" && (
              <>
                <img src={lessonImg} alt="Lessons" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Lessons</h2>
              </>
            )}
            {view === "leaderboard" && (
              <>
                <img src={trophyImg} alt="Leaderboard" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Leaderboard</h2>
              </>
            )}
            {view === "quest" && (
              <>
                <img src={questImg} alt="Quest" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Quest</h2>
              </>
            )}
            {view === "profile" && (
              <>
                <User size={18} className="text-foreground shrink-0 sm:w-5 sm:h-5" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Profile</h2>
              </>
            )}
            {view === "gamesetup" && (
              <>
                <img src={challengeImg} alt="Play Game" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Challenge</h2>
              </>
            )}
            {view === "game" && (
              <>
                <img src={categoryIconMap[category]} alt={category} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
                <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">
                  {categories.find(c => c.id === category)?.label || category}
                </h2>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="brutal-btn-secondary flex items-center gap-1.5 text-xs sm:text-sm font-body touch-manipulation min-h-[36px] px-2.5 sm:px-4"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="h-[calc(100vh-2.75rem)] sm:h-[calc(100vh-3.25rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
          {view === "home" && (
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
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
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
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
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
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
            <div className="p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
              <ProfileEdit onBack={() => setView("home")} />
            </div>
          )}
          {view === "game" && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-10 pb-24 sm:pb-32">
              {/* Title row */}
              <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 md:mb-10 mt-1">
                <button
                  onClick={() => setView("lessons")}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 font-black brutal-btn-secondary px-2.5 py-1.5 sm:px-3 sm:py-2 touch-manipulation active:translate-x-0 hover:-translate-x-0.5 transition-transform text-xs sm:text-sm"
                >
                  <ArrowLeft size={15} className="sm:w-4 sm:h-4 shrink-0" />
                  <span>กลับ</span>
                </button>
                <p className="flex-1 text-slate-800 dark:text-white font-black uppercase tracking-wide sm:tracking-widest text-sm sm:text-lg md:text-2xl lg:text-3xl text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] truncate">
                  UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
                </p>
                {/* Spacer mirrors button width so title stays centered */}
                <div className="shrink-0 w-[60px] sm:w-[72px]" aria-hidden />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                {getPhrasesByCategory(category).map((phrase) => {
                  const isCompleted = isPhraseCompletedCheck(phrase.id, completedPhrases);
                  return (
                    <div
                      key={phrase.id}
                      onClick={() => handlePhraseSelect(phrase)}
                      className={`relative brutal-card flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 md:p-4 pr-8 sm:pr-10 cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all touch-manipulation ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-800'}`}
                    >
                      {isCompleted ? (
                        <div className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 bg-green-500 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 rounded-full border-[2px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 flex items-center gap-1">
                          <Check size={11} strokeWidth={4} className="shrink-0" />
                          <span>{phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} pts</span>
                        </div>
                      ) : (
                        <div className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 bg-[#f94fa4] text-white font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 rounded-full border-[2px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                          +{phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} pts
                        </div>
                      )}
                      <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-accent/20 brutal-card flex items-center justify-center shrink-0 p-1">
                        {phraseIconMap[phrase.id] ? (
                          <img src={phraseIconMap[phrase.id]} alt={phrase.text} className="w-full h-full object-contain drop-shadow-sm" />
                        ) : (
                          <span className="text-2xl">{phrase.emoji || "✋"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm sm:text-base md:text-lg lg:text-xl leading-tight truncate">{phrase.text}</h3>
                        <p className="text-gray-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs md:text-sm mt-0.5 truncate">{phrase.english || phrase.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Game Modal + Hint Modals */}
      <PredictionOverlay
        gameOpen={gameOpen}
        isClosingModal={isClosingModal}
        category={category}
        activePhrase={activePhrase}
        currentCategoryPhrases={currentCategoryPhrases}
        completedPhrases={completedPhrases}
        isFirstPhrase={isFirstPhrase}
        isLastPhrase={isLastPhrase}
        onPrevPhrase={handlePrevPhrase}
        onNextPhrase={handleNextPhrase}
        onCloseModal={handleCloseModal}
        onPhraseSelect={handlePhraseSelect}
        onResetPhraseState={resetPhraseState}
        selectedVariant={selectedVariant}
        byeStep={byeStep}
        eatStep={eatStep}
        onVariantChange={handleVariantChange}
        isLive={isLive}
        isDetecting={isDetecting}
        tutorialStep={tutorialStep}
        cameraPermissionGranted={cameraPermissionGranted}
        webcamVideo={webcamVideo}
        onShowCameraPermission={() => {
          setSkipCameraCalibration(true);
          setShowCameraPermission(true);
        }}
        onVideoReady={(video) => setWebcamVideo(video)}
        onCanvasReady={(canvas) => setWebcamCanvas(canvas)}
        onSetIsPhraseCompleted={setIsPhraseCompleted}
        buttonState={buttonState}
        bestConfidence={bestConfidence}
        isPhraseCompleted={isPhraseCompleted}
        phrasePoints={phrasePoints}
        onTryAgain={handleTryAgain}
        onCollectPoints={handleCollectPoints}
        onStop={() => {
          setIsLive(false);
          setIsDetecting(false);
          setTutorialStep("initial");
          setIsPhraseCompleted(false);
          setBestConfidence(0);
          setButtonState("start");
          setByeStep(1);
          setEatStep(1);
          isCollectingRef.current = false;
          sessionStartedRef.current = false;
          if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
          }
        }}
        onStart={() => {
          if (!webcamVideo || webcamVideo.readyState < 2) {
            toast({
              title: "รอสักครู่",
              description: "กำลังเปิดกล้อง กรุณารอสักครู่...",
              variant: "default",
            });
            return;
          }
          sessionStartedRef.current = true;
          setTutorialStep("initial");
          // 🚨 เหมือน SignDefenderPage: set isLive=true โดยตรงเลย ไม่ต้องผ่าน isDetecting
          // เนื่องจาก hook รันและ buffer ข้อมูลไว้แล้ว พร้อมทันที
          setIsLive(true);
          setIsDetecting(false);
          setBestConfidence(0);
          setButtonState("stop");
        }}
        signRecognition={signRecognition}
        effectivePhrase={effectivePhrase}
        targetDisplayWord={targetDisplayWord}
        showHintContent={showHintContent}
        onHintClick={handleConfirmHint}
        onSetShowHintContent={setShowHintContent}
        getCurrentHintKey={getCurrentHintKey}
        getCurrentHintVideos={getCurrentHintVideos}
        getCurrentHintText={getCurrentHintText}
      />


      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* 🎓 How-to-Play Tutorial Modal */}
      {showHowToPlay && (
        <TutorialModal onClose={() => setShowHowToPlay(false)} />
      )}

      {showCameraPermission && (
        <CameraPermission
          onAllow={requestCameraPermission}
          skipCalibration={skipCameraCalibration}
          onSkip={() => {
            setShowCameraPermission(false);
            setSkipCameraCalibration(false);
            setCameraPermissionGranted(false);
          }}
        />
      )}
    </div>
  );
};

export default Index;