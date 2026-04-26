import { useState, useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { addUserPoints, incrementUserLevel, addCompletedPhrase, updatePhrasePoints } from "@/lib/auth";
import { Category, Phrase, getPhrasesByCategory, isPhraseCompletedCheck, resolveTargetClass } from "@/lib/categories";
import { ButtonState, getScoreFromConfidence, phraseHintMap } from "@/lib/gameConstants";

interface UseGameStateParams {
  category: Category;
  completedPhrases: Set<string>;
  setCompletedPhrases: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface UseGameStateReturn {
  activePhrase: Phrase;
  setActivePhrase: React.Dispatch<React.SetStateAction<Phrase>>;
  selectedVariant: "adult" | "friend";
  setSelectedVariant: React.Dispatch<React.SetStateAction<"adult" | "friend">>;
  byeStep: 1 | 2;
  setByeStep: React.Dispatch<React.SetStateAction<1 | 2>>;
  eatStep: 1 | 2 | 3;
  setEatStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  bestConfidence: number;
  setBestConfidence: React.Dispatch<React.SetStateAction<number>>;
  buttonState: ButtonState;
  setButtonState: React.Dispatch<React.SetStateAction<ButtonState>>;
  collectedPhrases: Set<string>;
  setCollectedPhrases: React.Dispatch<React.SetStateAction<Set<string>>>;
  phrasePoints: Record<string, number>;
  setPhrasePoints: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isPhraseCompleted: boolean;
  setIsPhraseCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  gameOpen: boolean;
  setGameOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isClosingModal: boolean;
  isCollectingRef: React.MutableRefObject<boolean>;
  effectivePhrase: Phrase | undefined;
  targetDisplayWord: string;
  handlePhraseSelect: (phrase: Phrase) => void;
  handlePhraseCompletion: (confidence?: number) => void;
  handleCollectPoints: () => Promise<void>;
  handleTryAgain: (setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>) => void;
  handleCloseModal: (cameraCallbacks: {
    setIsLive: React.Dispatch<React.SetStateAction<boolean>>;
    setIsDetecting: React.Dispatch<React.SetStateAction<boolean>>;
    setTutorialStep: React.Dispatch<React.SetStateAction<"initial" | "scanning" | "too_close" | "success">>;
    setWebcamVideo: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
    setWebcamCanvas: React.Dispatch<React.SetStateAction<HTMLCanvasElement | null>>;
    sessionStartedRef: React.MutableRefObject<boolean>;
    successTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    goodPositionTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  }) => void;
  handleVariantChange: (
    variant: "adult" | "friend",
    isLive: boolean,
    isDetecting: boolean,
    setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
  resetPhraseState: (
    sessionStartedRef: React.MutableRefObject<boolean>,
    setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
  getCurrentHintKey: () => string;
  getCurrentHintText: () => string;
  getCurrentHintVideos: () => { url: string; label: string; text: string }[];
  showHintContent: boolean;
  setShowHintContent: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGameState = ({
  category,
  completedPhrases,
  setCompletedPhrases,
}: UseGameStateParams): UseGameStateReturn => {
  const [activePhrase, setActivePhrase] = useState<Phrase>(getPhrasesByCategory("general")[0]);
  const [selectedVariant, setSelectedVariant] = useState<"adult" | "friend">("adult");
  const [byeStep, setByeStep] = useState<1 | 2>(1);
  const [eatStep, setEatStep] = useState<1 | 2 | 3>(1);
  const [bestConfidence, setBestConfidence] = useState(0);
  const [buttonState, setButtonState] = useState<ButtonState>("start");
  const [collectedPhrases, setCollectedPhrases] = useState<Set<string>>(new Set());
  const [phrasePoints, setPhrasePoints] = useState<Record<string, number>>({});
  const [isPhraseCompleted, setIsPhraseCompleted] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [showHintContent, setShowHintContent] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  const isCollectingRef = useRef(false);

  // Compute effective phrase
  const byeTargetClass = activePhrase?.id === "g2" ? (byeStep === 1 ? "bye_me" : "bye_go") : undefined;
  const eatTargetClass = activePhrase?.id === "g3" ? (eatStep === 1 ? "rice" : eatStep === 2 ? "eat" : "yet") : undefined;
  const g4TargetClass = activePhrase?.id === "g4"
    ? (selectedVariant === "adult" ? (eatStep === 1 ? "eat" : "already") : (eatStep === 1 ? "eat" : "yet"))
    : undefined;
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

  // Compute target display word
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

  // Hint helpers
  const getCurrentHintKey = (): string => {
    if (!activePhrase) return "";
    if (activePhrase.id === "g1" || activePhrase.id === "g4" || activePhrase.id === "g6") {
      return `${activePhrase.id}_${selectedVariant}`;
    }
    return activePhrase.id;
  };

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
    const mc = effectivePhrase?.modelClass;
    if (mc) return [{ url: `${base}${mc}-tip.mp4`, label: activePhrase.text, text: phraseHintMap[mc] || "" }];
    return [];
  };

  // ── Handlers ─────────────────────────────────────────

  const handlePhraseSelect = (phrase: Phrase) => {
    setActivePhrase(phrase);
    setGameOpen(true);
    setSelectedVariant("adult");
    setByeStep(1);
    setEatStep(1);
    localStorage.setItem('lastCategory', phrase.category);
    localStorage.setItem('lastPhraseId', phrase.id);
  };

  const handlePhraseCompletion = (confidence?: number) => {
    const finalConfidence = confidence ?? bestConfidence;
    const newBest = Math.max(bestConfidence, finalConfidence);
    setBestConfidence(newBest);
    setIsPhraseCompleted(true);
    setButtonState("collect");
  };

  const handleCollectPoints = async () => {
    const tierScore = getScoreFromConfidence(bestConfidence);
    if (tierScore <= 0) return;

    const user = auth.currentUser;
    if (!user) return;

    if (isCollectingRef.current) return;
    isCollectingRef.current = true;

    const phraseKey = (activePhrase.id === "g1" || activePhrase.id === "g4" || activePhrase.id === "g6")
      ? `${activePhrase.id}_${selectedVariant}`
      : activePhrase.id;

    const currentEarned = phrasePoints[phraseKey] || 0;
    const delta = tierScore - currentEarned;

    if (delta <= 0) {
      isCollectingRef.current = false;
      setButtonState("tryagain");
      return;
    }

    try {
      const result = await updatePhrasePoints(user.uid, phraseKey, tierScore);
      if (result.error) throw new Error(result.error);

      const newTotal = result.totalForPhrase;

      await addUserPoints(user.uid, result.delta);

      setPhrasePoints(prev => ({ ...prev, [phraseKey]: newTotal }));
      setCollectedPhrases(prev => new Set([...prev, phraseKey]));

      if (newTotal >= 100) {
        await addCompletedPhrase(user.uid, phraseKey);
        setCompletedPhrases(prev => new Set([...prev, phraseKey]));

        const categoryPhrases = getPhrasesByCategory(category);
        const newCompleted = new Set([...completedPhrases, phraseKey]);
        const allCategoryDone = categoryPhrases.every(p => isPhraseCompletedCheck(p.id, newCompleted));
        if (allCategoryDone) {
          await incrementUserLevel(user.uid);
        }
      }

      setButtonState("tryagain");
    } catch (error) {
      console.error("Error collecting points:", error);
    } finally {
      isCollectingRef.current = false;
    }
  };

  const handleCloseModal = (cameraCallbacks: {
    setIsLive: React.Dispatch<React.SetStateAction<boolean>>;
    setIsDetecting: React.Dispatch<React.SetStateAction<boolean>>;
    setTutorialStep: React.Dispatch<React.SetStateAction<"initial" | "scanning" | "too_close" | "success">>;
    setWebcamVideo: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
    setWebcamCanvas: React.Dispatch<React.SetStateAction<HTMLCanvasElement | null>>;
    sessionStartedRef: React.MutableRefObject<boolean>;
    successTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    goodPositionTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  }) => {
    setIsClosingModal(true);
    setTimeout(() => {
      setGameOpen(false);
      setIsClosingModal(false);
      cameraCallbacks.setIsLive(false);
      cameraCallbacks.setIsDetecting(false);
      cameraCallbacks.setTutorialStep("initial");
      setBestConfidence(0);
      setButtonState("start");
      setIsPhraseCompleted(false);
      isCollectingRef.current = false;
      cameraCallbacks.sessionStartedRef.current = false;
      cameraCallbacks.setWebcamVideo(null);
      cameraCallbacks.setWebcamCanvas(null);
      if (cameraCallbacks.successTimerRef.current) {
        clearTimeout(cameraCallbacks.successTimerRef.current);
        cameraCallbacks.successTimerRef.current = null;
      }
      if (cameraCallbacks.goodPositionTimerRef.current) {
        clearTimeout(cameraCallbacks.goodPositionTimerRef.current);
        cameraCallbacks.goodPositionTimerRef.current = null;
      }
    }, 240);
  };

  const handleTryAgain = (setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsPhraseCompleted(false);
    setBestConfidence(0);
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    setButtonState("stop");

    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleVariantChange = (
    variant: "adult" | "friend",
    isLive: boolean,
    isDetecting: boolean,
    setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setSelectedVariant(variant);
    setIsPhraseCompleted(false);
    setBestConfidence(0);
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    if (isLive || isDetecting) {
      setButtonState("stop");
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 150);
    }
  };

  const resetPhraseState = (
    sessionStartedRef: React.MutableRefObject<boolean>,
    setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setIsPhraseCompleted(false);
    setBestConfidence(0);
    isCollectingRef.current = false;
    setByeStep(1);
    setEatStep(1);
    setShowHintContent(false);
    setShowHintModal(false);
    if (sessionStartedRef.current) {
      setButtonState("stop");
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    } else {
      setButtonState("start");
    }
  };

  return {
    activePhrase,
    setActivePhrase,
    selectedVariant,
    setSelectedVariant,
    byeStep,
    setByeStep,
    eatStep,
    setEatStep,
    bestConfidence,
    setBestConfidence,
    buttonState,
    setButtonState,
    collectedPhrases,
    setCollectedPhrases,
    phrasePoints,
    setPhrasePoints,
    isPhraseCompleted,
    setIsPhraseCompleted,
    gameOpen,
    setGameOpen,
    isClosingModal,
    isCollectingRef,
    effectivePhrase,
    targetDisplayWord,
    handlePhraseSelect,
    handlePhraseCompletion,
    handleCollectPoints,
    handleTryAgain,
    handleCloseModal,
    handleVariantChange,
    resetPhraseState,
    getCurrentHintKey,
    getCurrentHintText,
    getCurrentHintVideos,
    showHintContent,
    setShowHintContent,
  };
};
