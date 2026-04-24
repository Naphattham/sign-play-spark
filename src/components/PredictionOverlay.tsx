import { X, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Phrase, checkPhraseMatch, isPhraseCompletedCheck } from "@/lib/categories";
import { VideoCard } from "@/components/VideoCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { WebcamView } from "@/components/WebcamView";

// ── Asset imports ──
import arrowLeftImg from "@/asset/image/arrow_left.webp";
import arrowRightImg from "@/asset/image/arrow_right.webp";
import collectPointsImg from "@/asset/image/CollectPoints.webp";
import hintImg from "@/asset/image/Hint.webp";
import guideHumanImg from "@/asset/image/guide_human.webp";
import tipsImg from "@/asset/image/tips.webp";
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

// ─────────────────────────────────────────────
// Helper types
// ─────────────────────────────────────────────

interface Top3Prediction {
  class: string;
  confidence: number;
}

export interface SignRecognitionState {
  isMatched: boolean;
  top3Predictions: Top3Prediction[] | null;
  error: string | null;
  /** จำนวน keypoint frames ที่ buffer ไว้แล้ว (max 40) — เหมือน SignDefenderPage */
  bufferLength?: number;
}

type ButtonState = "start" | "stop" | "collect" | "tryagain";
type TutorialStep = "initial" | "scanning" | "too_close" | "success";

// ─────────────────────────────────────────────
// phraseIconMap (duplicated here so component is self-contained)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Score helper (keep consistent with Index.tsx)
// ─────────────────────────────────────────────

const getScoreFromConfidence = (confidence: number): number => {
  if (confidence >= 0.80) return 100;
  if (confidence >= 0.65) return 70;
  if (confidence >= 0.50) return 40;
  return 0;
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface PredictionOverlayProps {
  // ── Game modal visibility ──
  gameOpen: boolean;
  isClosingModal: boolean;

  // ── Category / phrase navigation ──
  category: string;
  activePhrase: Phrase;
  currentCategoryPhrases: Phrase[];
  completedPhrases: Set<string>;
  isFirstPhrase: boolean;
  isLastPhrase: boolean;
  onPrevPhrase: () => void;
  onNextPhrase: () => void;
  onCloseModal: () => void;
  onPhraseSelect: (phrase: Phrase) => void;
  onResetPhraseState: () => void;

  // ── Variant & step state ──
  selectedVariant: "adult" | "friend";
  byeStep: 1 | 2;
  eatStep: 1 | 2 | 3;
  onVariantChange: (variant: "adult" | "friend") => void;

  // ── Live state ──
  isLive: boolean;
  isDetecting: boolean;
  tutorialStep: TutorialStep;

  // ── Camera ──
  cameraPermissionGranted: boolean;
  webcamVideo: HTMLVideoElement | null;
  onShowCameraPermission: () => void;
  onVideoReady: (video: HTMLVideoElement) => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onSetIsPhraseCompleted: (v: boolean) => void;

  // ── Score / button ──
  buttonState: ButtonState;
  bestConfidence: number;
  isPhraseCompleted: boolean;
  phrasePoints: Record<string, number>;
  onTryAgain: () => void;
  onCollectPoints: () => void;
  onStop: () => void;
  onStart: () => void;

  // ── Sign recognition ──
  signRecognition: SignRecognitionState;
  effectivePhrase: Phrase | undefined;
  targetDisplayWord: string;

  // ── Hint state ──
  showHintContent: boolean;
  onHintClick: () => void;
  onSetShowHintContent: (v: boolean) => void;
  getCurrentHintKey: () => string;
  getCurrentHintVideos: () => { url: string; label: string; text: string }[];
  getCurrentHintText: () => string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const PredictionOverlay = ({
  // Game modal
  gameOpen,
  isClosingModal,

  // Category / phrase
  category,
  activePhrase,
  currentCategoryPhrases,
  completedPhrases,
  isFirstPhrase,
  isLastPhrase,
  onPrevPhrase,
  onNextPhrase,
  onCloseModal,
  onPhraseSelect,
  onResetPhraseState,

  // Variant & step
  selectedVariant,
  byeStep,
  eatStep,
  onVariantChange,

  // Live state
  isLive,
  isDetecting,
  tutorialStep,

  // Camera
  cameraPermissionGranted,
  webcamVideo,
  onShowCameraPermission,
  onVideoReady,
  onCanvasReady,
  onSetIsPhraseCompleted,

  // Score / button
  buttonState,
  bestConfidence,
  isPhraseCompleted,
  phrasePoints,
  onTryAgain,
  onCollectPoints,
  onStop,
  onStart,

  // Sign recognition
  signRecognition,
  effectivePhrase,
  targetDisplayWord,

  // Hint
  showHintContent,
  onHintClick,
  onSetShowHintContent,
  getCurrentHintKey,
  getCurrentHintVideos,
  getCurrentHintText,
}: PredictionOverlayProps) => {
  // ⏳ Timeout fallback: ถ้า 8 วินาทียัง buffer ไม่ครบ ให้กด START ได้เลย
  // ป้องกัน Safari ค้างที่ 0% เมื่อ MediaPipe WASM โหลดช้าใน first visit
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);

  useEffect(() => {
    if (!gameOpen) {
      setLoadingTimeoutReached(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTimeoutReached(true), 8000);
    return () => clearTimeout(timer);
  }, [gameOpen]);

  return (
    <>
      {/* ══════════════════════════════════════
          1. Game Modal (gameOpen block)
          ══════════════════════════════════════ */}
      {gameOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm ${isClosingModal ? "animate-backdrop-out" : "animate-backdrop-in"
              }`}
            onClick={onCloseModal}
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className={`bg-white dark:bg-slate-900 border-[2px] sm:border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-w-7xl w-full h-[95vh] sm:h-[90vh] pointer-events-auto ${isClosingModal ? "animate-modal-out" : "animate-modal-in"
                }`}
            >
              {/* ── Modal Header ── */}
              <header className="flex items-center justify-end p-2 sm:p-3 md:p-4 lg:p-6 border-b-[3px] border-foreground bg-yellow-400">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="hidden md:flex items-center px-3 lg:px-4 py-1.5 lg:py-2 bg-pink-400 border-[3px] border-foreground rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-white font-black text-xs lg:text-sm">
                      UNIT{" "}
                      {category === "general"
                        ? "1"
                        : category === "emotions"
                          ? "2"
                          : category === "qa"
                            ? "3"
                            : "4"}
                      : {category.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={onCloseModal}
                    className="flex items-center justify-center w-10 h-10 bg-white border-[3px] border-foreground rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 transition-transform"
                  >
                    <X size={20} className="text-slate-900" />
                  </button>
                </div>
              </header>

              {/* ── Modal Body ── */}
              <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Prev arrow */}
                <button
                  onClick={onPrevPhrase}
                  disabled={isFirstPhrase}
                  className={`absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-50 w-10 sm:w-14 md:w-20 lg:w-24 hover:-translate-x-2 transition-transform cursor-pointer ${isFirstPhrase ? "opacity-30 pointer-events-none" : ""
                    }`}
                >
                  <img
                    src={arrowLeftImg}
                    alt="Previous"
                    className="w-full h-full object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                  />
                </button>

                {/* Next arrow */}
                <button
                  onClick={onNextPhrase}
                  disabled={isLastPhrase}
                  className={`absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-50 w-10 sm:w-14 md:w-20 lg:w-24 hover:translate-x-2 transition-transform cursor-pointer ${isLastPhrase ? "opacity-30 pointer-events-none" : ""
                    }`}
                >
                  <img
                    src={arrowRightImg}
                    alt="Next"
                    className="w-full h-full object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
                  />
                </button>

                <main className="flex-1 p-1 sm:p-2 lg:p-3 xl:p-4 px-8 sm:px-12 md:px-4 bg-[#f8f6f6] dark:bg-[#221610] overflow-y-auto flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-center">

                    {/* ── Phrase title ── */}
                    <div className="flex items-center justify-center mb-1.5 sm:mb-3 lg:mb-4 pt-1 sm:pt-0">
                      {activePhrase?.id === "g2" ? (
                        <h2 className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
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
                          <span className="hidden sm:block absolute left-full ml-1.5 sm:ml-3 text-slate-500 dark:text-slate-400 text-[9px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                            (ไวยากรณ์ภาษามือ)
                          </span>
                        </h2>
                      ) : activePhrase?.id === "g3" ? (
                        <h2 className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
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
                          <span className="hidden sm:block absolute left-full ml-1.5 sm:ml-3 text-slate-500 dark:text-slate-400 text-[9px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                            (ไวยากรณ์ภาษามือ)
                          </span>
                        </h2>
                      ) : activePhrase?.id === "g4" ? (
                        <h2 className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight flex items-center gap-1 sm:gap-2">
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
                          <span className="hidden sm:block absolute left-full ml-1.5 sm:ml-3 text-slate-500 dark:text-slate-400 text-[9px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                            (ไวยากรณ์ภาษามือ)
                          </span>
                        </h2>
                      ) : (
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {activePhrase?.id === "g1"
                            ? selectedVariant === "adult"
                              ? "สวัสดีผู้ใหญ่"
                              : "สวัสดีเพื่อน"
                            : activePhrase?.id === "g6"
                              ? selectedVariant === "adult"
                                ? "สบายดี"
                                : "ไม่สบายใจ"
                              : activePhrase?.text ?? "Hello"}
                        </h2>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3 items-start max-w-[740px] mx-auto w-full">

                      {/* ── Left column: Tutorial video + variant buttons ── */}
                      <div className="relative flex flex-col gap-1 sm:gap-1.5 lg:gap-2 w-full items-center lg:items-end">
                        <div className="relative aspect-square w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mr-0 bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <VideoCard
                            phrase={activePhrase?.text ?? "Hello"}
                            category={activePhrase?.category ?? "general"}
                            variant={
                              activePhrase?.id === "g1" ||
                                activePhrase?.id === "g4" ||
                                activePhrase?.id === "g6"
                                ? selectedVariant
                                : undefined
                            }
                            byeStep={activePhrase?.id === "g2" ? byeStep : undefined}
                            eatStep={
                              activePhrase?.id === "g3" || activePhrase?.id === "g4"
                                ? eatStep
                                : undefined
                            }
                            isLive={isLive || isDetecting}
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/90 px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs absolute top-3 left-3">
                              TUTORIAL
                            </div>
                            <img
                              src={hintImg}
                              alt="Hint"
                              onClick={onHintClick}
                              className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 object-contain opacity-90 drop-shadow-md pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                            />
                          </div>
                        </div>

                        {/* g1 variant buttons */}
                        {activePhrase?.id === "g1" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => onVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีผู้ใหญ่
                            </button>
                            <button
                              onClick={() => onVariantChange("friend")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สวัสดีเพื่อน
                            </button>
                          </div>
                        )}

                        {/* g4 variant buttons */}
                        {activePhrase?.id === "g4" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => onVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              กินแล้ว
                            </button>
                            <button
                              onClick={() => onVariantChange("friend")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "friend"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              ยังไม่ได้กิน
                            </button>
                          </div>
                        )}

                        {/* g6 variant buttons */}
                        {activePhrase?.id === "g6" && (
                          <div className="flex gap-1.5 lg:gap-2 max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 w-full">
                            <button
                              onClick={() => onVariantChange("adult")}
                              className={`flex-1 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors font-black text-xs lg:text-sm hover:translate-y-0.5 ${selectedVariant === "adult"
                                ? "bg-yellow-400 text-slate-900"
                                : "bg-white text-slate-900 hover:bg-slate-50"
                                }`}
                            >
                              สบายดี
                            </button>
                            <button
                              onClick={() => onVariantChange("friend")}
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

                      {/* ── Right column: Webcam + action button ── */}
                      <div className="flex flex-col gap-1 sm:gap-1.5 lg:gap-2 w-full items-center lg:items-start">
                        <div className="relative aspect-square w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 bg-slate-200 dark:bg-slate-700 border-[3px] border-foreground rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <WebcamView
                            onNextLevel={() => onSetIsPhraseCompleted(true)}
                            cameraEnabled={cameraPermissionGranted}
                            onVideoReady={onVideoReady}
                            onCanvasReady={onCanvasReady}
                          />

                          {/* Dashed border guide */}
                          <div className="absolute inset-0 border-4 border-dashed border-[#ec5b13]/50 m-3 rounded-lg pointer-events-none" />
                          {/* PTS badge */}
                          <div className="absolute top-3 right-3 animate-bounce z-10">
                            <div className="bg-pink-500 text-white border-[3px] border-foreground rounded-xl px-2 lg:px-3 py-1 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 text-xs">
                              {(() => {
                                const score = getScoreFromConfidence(bestConfidence);
                                return score > 0 ? `+ ${score} PTS` : "+ ? PTS";
                              })()}
                            </div>
                          </div>

                          {/* LIVE indicator */}
                          <div className="absolute bottom-3 left-3 z-10">
                            <div
                              className={`px-2 py-1 border-[3px] border-foreground rounded-full font-black text-xs flex items-center gap-1.5 ${isLive
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-gray-400 text-white"
                                }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${isLive ? "bg-white animate-pulse" : "bg-white/50"
                                  }`}
                              />
                              LIVE
                            </div>
                          </div>

                          {/* Prediction box (isLive) */}
                          {isLive && (
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                              <div
                                className={`bg-white/95 backdrop-blur-sm border-[2px] ${signRecognition.isMatched
                                  ? "border-green-500 bg-green-50/95"
                                  : "border-foreground"
                                  } rounded-md px-2 py-1 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[110px] transition-colors duration-300`}
                              >
                                <div className="flex items-end justify-between gap-2">
                                  <span
                                    className={`text-sm leading-none ${signRecognition.isMatched
                                      ? "text-green-700"
                                      : "text-slate-800"
                                      } truncate max-w-[90px]`}
                                  >
                                    {targetDisplayWord}
                                  </span>
                                  <span
                                    className={`text-xs leading-none ${signRecognition.isMatched
                                      ? "text-green-600"
                                      : "text-primary"
                                      }`}
                                  >
                                    {(() => {
                                      const top3 = signRecognition.top3Predictions || [];
                                      const found = effectivePhrase
                                        ? top3.find((p) =>
                                          checkPhraseMatch(
                                            effectivePhrase,
                                            p.class,
                                            selectedVariant
                                          )
                                        )
                                        : null;
                                      return found
                                        ? (found.confidence * 100).toFixed(0)
                                        : "0";
                                    })()}
                                    %
                                  </span>
                                </div>
                              </div>

                              {signRecognition.error && (
                                <div className="bg-red-500/95 backdrop-blur-sm border-[2px] border-foreground rounded-lg px-3 py-2 font-bold text-xs text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-[180px]">
                                  <div className="flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>ไม่พบกล้อง / เกิดข้อผิดพลาด</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── Multi-state action button ── */}
                        {(() => {
                          // Camera permission
                          if (!cameraPermissionGranted) {
                            return (
                              <button
                                onClick={onShowCameraPermission}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                📹 อนุญาตการเข้าถึงกล้อง
                              </button>
                            );
                          }

                          const currentScore = getScoreFromConfidence(bestConfidence);
                          const isLocked = bestConfidence < 0.5;
                          const phraseKey =
                            activePhrase?.id === "g1" ||
                              activePhrase?.id === "g4" ||
                              activePhrase?.id === "g6"
                              ? `${activePhrase.id}_${selectedVariant}`
                              : activePhrase?.id;
                          const earnedForPhrase = phraseKey
                            ? phrasePoints[phraseKey] || 0
                            : 0;
                          const deltaPoints = Math.max(0, currentScore - earnedForPhrase);

                          if (buttonState === "tryagain") {
                            return (
                              <button
                                onClick={onTryAgain}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-2 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-purple-500 hover:bg-purple-600 text-white"
                              >
                                <RotateCcw size={14} className="shrink-0" /> TRY AGAIN
                              </button>
                            );
                          }

                          if (buttonState === "collect" && isPhraseCompleted) {
                            return (
                              <div className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 flex flex-col gap-1.5">
                                <button
                                  onClick={() => {
                                    if (isLocked) return;
                                    if (deltaPoints <= 0) {
                                      onTryAgain();
                                    } else {
                                      onCollectPoints();
                                    }
                                  }}
                                  disabled={isLocked}
                                  className={`w-full h-12 lg:h-14 flex items-center justify-center gap-2 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm ${isLocked
                                    ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-70"
                                    : deltaPoints <= 0
                                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                                      : "bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:translate-y-0.5"
                                    }`}
                                >
                                  {isLocked
                                    ? `🔒 ต้องถึง 50% (ตอนนี้ ${(bestConfidence * 100).toFixed(0)}%)`
                                    : deltaPoints <= 0
                                      ? <><RotateCcw size={14} className="shrink-0" /> TRY AGAIN</>

                                      : (
                                        <>
                                          <img
                                            src={collectPointsImg}
                                            alt="Collect points"
                                            className="w-14 h-14 object-contain"
                                          />
                                          <span className="text-white">
                                            COLLECT +{deltaPoints} PTS
                                          </span>
                                        </>
                                      )}
                                </button>
                              </div>
                            );
                          }

                          if (buttonState === "stop" || isDetecting || isLive) {
                            return (
                              <button
                                onClick={onStop}
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-red-500 hover:bg-red-600 text-white"
                              >
                                ⏹ STOP
                              </button>
                            );
                          }

                          // 🚨 3 states เหมือน SignDefenderPage + Safari fallback
                          const bufLen = signRecognition.bufferLength ?? 0;
                          const bufferPct = Math.min(100, Math.round((bufLen / 40) * 100));
                          // Camera ready = webcamVideo ถูก set โดย onVideoReady (แปลว่าสตรีมพร้อมแล้ว)
                          const isCameraReady = !!webcamVideo;
                          // Model ready = buffer ครบ 40 frames OR timeout 8 วิ
                          const isModelReady = bufLen >= 40 || loadingTimeoutReached;

                          // State 1: กล้องยังไม่พร้อม
                          if (!isCameraReady) {
                            return (
                              <button
                                disabled
                                className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1.5 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-sky-400 text-white opacity-75 cursor-wait"
                              >
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                กำลังเปิดกล้อง...
                              </button>
                            );
                          }

                          // State 2 & 3: โมเดลกำลังโหลด vs พร้อม
                          return (
                            <button
                              onClick={onStart}
                              className="w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[360px] mx-auto lg:mx-0 h-12 lg:h-14 flex items-center justify-center gap-1 border-[3px] border-foreground rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-xs lg:text-sm bg-green-500 hover:bg-green-600 text-white hover:translate-y-0.5"
                            >
                              ▶ START
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* ── Footer phrase strip ── */}
                  <footer className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t-[2px] border-slate-200 dark:border-slate-800 w-full">
                    <div className="flex justify-start lg:justify-center gap-2 sm:gap-4 pb-2 pt-3 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {currentCategoryPhrases.map((phrase) => {
                        const isActive = phrase.id === activePhrase?.id;
                        const isCompleted = isPhraseCompletedCheck(phrase.id, completedPhrases);
                        return (
                          <div
                            key={phrase.id}
                            onClick={() => {
                              onPhraseSelect(phrase);
                              onResetPhraseState();
                            }}
                            className={`relative border-[2px] border-foreground rounded-lg flex items-center py-1 px-2 sm:py-2 sm:px-3 cursor-pointer flex-none w-[120px] sm:w-[140px] md:w-[160px] min-h-[48px] sm:min-h-[56px] transition-all ${isActive
                              ? "shadow-[0px_0px_0px_3px_rgba(253,224,71,1)] scale-[1.02] z-10"
                              : "opacity-70 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:opacity-100 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                              } ${isCompleted ? "bg-green-50" : "bg-white"}`}
                          >
                            {isCompleted ? (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded-full border-[1.5px] border-foreground z-10 flex items-center gap-1">
                                <Check size={10} className="shrink-0" strokeWidth={4} />{" "}
                                <span className="hidden sm:inline">
                                  {phrase.id === "g1" ||
                                    phrase.id === "g4" ||
                                    phrase.id === "g6"
                                    ? "200"
                                    : "100"}{" "}
                                  pts
                                </span>
                              </div>
                            ) : (
                              <div className="absolute -top-2 -right-2 bg-[#f94fa4] text-white font-black text-[7px] sm:text-[9px] px-1.5 py-0.5 rounded-full border-[1.5px] border-foreground z-10">
                                +
                                {phrase.id === "g1" ||
                                  phrase.id === "g4" ||
                                  phrase.id === "g6"
                                  ? "200"
                                  : "100"}{" "}
                                pts
                              </div>
                            )}

                            {/* Icon */}
                            <div className="w-7 h-7 sm:w-9 sm:h-9 border-[1.5px] border-foreground rounded-md flex items-center justify-center text-sm sm:text-base shrink-0 mr-2 sm:mr-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-pink-300 p-0.5">
                              {phraseIconMap[phrase.id] ? (
                                <img
                                  src={phraseIconMap[phrase.id]}
                                  alt={phrase.text}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                phrase.emoji || "✋"
                              )}
                            </div>

                            {/* Text */}
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

      {/* ══════════════════════════════════════
          2. Hint Content Modal (Pro Tips)
          ══════════════════════════════════════ */}
      {showHintContent &&
        (() => {
          const hintVideos = getCurrentHintVideos();
          const activeVideo = hintVideos[0];
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onSetShowHintContent(false)}
              />
              <div className="relative bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full max-w-[340px] sm:max-w-[400px] overflow-hidden animate-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-primary p-4 border-b-4 border-black flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-white p-1.5 border-2 border-black rounded-lg flex items-center justify-center">
                      <img src={tipsImg} alt="Tips" className="w-5 h-5 object-contain" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider italic">
                      Pro Tips!
                    </h2>
                  </div>
                  <button
                    onClick={() => onSetShowHintContent(false)}
                    className="w-8 h-8 bg-white border-2 border-black rounded-lg flex items-center justify-center hover:translate-y-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>

                {/* Video */}
                {activeVideo && (
                  <div className="p-4 pb-0">
                    <div className="relative aspect-square w-full bg-slate-100 border-4 border-black rounded-2xl overflow-hidden">
                      <VideoPlayer
                        key={activeVideo.url}
                        src={activeVideo.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      />
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-4">
                  <div className="bg-slate-100 border-4 border-black rounded-2xl p-4">
                    <p className="font-bold leading-relaxed text-sm text-center whitespace-pre-line">
                      {activeVideo?.text || getCurrentHintText()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};