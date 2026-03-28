import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSignAndDistance } from "@/hooks/useSignAndDistance";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";

import m1 from "@/asset/image/monster/my_monster-1.webp";
import m2 from "@/asset/image/monster/my_monster-2.webp";
import m3 from "@/asset/image/monster/my_monster-3.webp";
import m4 from "@/asset/image/monster/my_monster-4.webp";
import m5 from "@/asset/image/monster/my_monster-5.webp";
import m6 from "@/asset/image/monster/my_monster-6.webp";
import m7 from "@/asset/image/monster/my_monster-7.webp";
import m8 from "@/asset/image/monster/my_monster-8.webp";
import m9 from "@/asset/image/monster/my_monster-9.webp";
import powImg from "@/asset/image/monster/pow.webp";
import shieldImg from "@/asset/image/monster/shield.webp";
import heartImg from "@/asset/image/monster/heart.webp";

const MONSTER_IMAGES = [m1, m2, m3, m4, m5, m6, m7, m8, m9];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Monster {
  id: number;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

// ─── Palette (matches site index.css) ────────────────────────────────────────
const MONSTER_COLORS = [
  "hsl(342 100% 64%)",
  "hsl(44  100% 70%)",
  "hsl(350  85% 60%)",
  "hsl(180  80% 55%)",
  "hsl(270  80% 70%)",
];

// Words must match cloud-function modelClass names exactly
const GAME_WORDS = [
  "hello_adult", "hello_friend", "bye_me", "bye_go",
  "love", "fear", "angry", "tired",
  "what", "why", "how_much", "yes", "no",
  "cold", "fever", "headache", "stomachache", "sore_throat",
  "fine", "unhappy", "how_are_you",
  "eat", "rice", "already", "yet",
];

const WORD_LABELS: Record<string, string> = {
  hello_adult: "สวัสดี (ผู้ใหญ่)",
  hello_friend: "สวัสดี (เพื่อน)",
  bye_me: "ฉัน",
  bye_go: "ไป",
  love: "รัก",
  fear: "กลัว",
  angry: "โกรธ",
  tired: "เหนื่อย",
  what: "อะไร",
  why: "ทำไม",
  how_much: "เท่าไหร่",
  yes: "ใช่",
  no: "ไม่",
  cold: "เป็นหวัด",
  fever: "เป็นไข้",
  headache: "ปวดหัว",
  stomachache: "ปวดท้อง",
  sore_throat: "เจ็บคอ",
  fine: "สบายดี",
  unhappy: "ไม่สบายใจ",
  how_are_you: "สบายดีไหม",
  eat: "กิน",
  rice: "ข้าว",
  already: "แล้ว",
  yet: "ยัง",
};

const ARENA_CENTER = { x: 50, y: 50 };
const CONFIDENCE_THRESHOLD = 0.2;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function spawnMonster(id: number, mode: "easy" | "medium" | "hard"): Monster {
  // Exclude bottom edge (y=100) to prevent overlapping with bottom UI/Webcam
  const edge = Math.floor(Math.random() * 3);
  let x = 50, y = 50;
  if (edge === 0) { x = randBetween(5, 95); y = 0; }
  else if (edge === 1) { x = 100; y = randBetween(5, 95); }
  else { x = 0; y = randBetween(5, 95); }

  const dx = ARENA_CENTER.x - x;
  const dy = ARENA_CENTER.y - y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  let speedMin = 0.03, speedMax = 0.08;
  if (mode === "easy") { speedMin = 0.01; speedMax = 0.04; }
  else if (mode === "hard") { speedMin = 0.06; speedMax = 0.12; }

  const speed = randBetween(speedMin, speedMax);
  const word = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];

  return {
    id, label: word, x, y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    color: MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)],
    size: Math.floor(randBetween(80, 112)),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SignDefenderPage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [mode, setMode] = useState<"easy" | "medium" | "hard">("medium");
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [powPos, setPowPos] = useState<{ x: number; y: number; word: string } | null>(null);
  const [isReturningHome, setIsReturningHome] = useState(false);
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean>(false);
  const [cameraSkipped, setCameraSkipped] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const isPausedRef = useRef(false);

  const openExitModal = useCallback(() => {
    isPausedRef.current = true;
    setShowExitModal(true);
  }, []);

  const closeExitModal = useCallback(() => {
    isPausedRef.current = false;
    setShowExitModal(false);
  }, []);

  useEffect(() => {
    if (powPos) {
      const audio = new Audio("/sounds/pow_sound.mp3");
      audio.play().catch((err) => console.warn("Audio play failed:", err));
    }
  }, [powPos]);


  // Auto-check if permission was already granted previously
  useEffect(() => {
    let mounted = true;
    const checkCamera = async () => {
      try {
        const res = await navigator.permissions.query({ name: "camera" as any });
        if (res.state === "granted" && mounted) setCameraPermissionGranted(true);
        res.onchange = () => {
          if (mounted) {
            setCameraPermissionGranted(res.state === "granted");
          }
        };
      } catch (err) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (devices.some(d => d.kind === "videoinput" && d.label !== "") && mounted) {
            setCameraPermissionGranted(true);
          }
        } catch (e) { }
      }
    };
    checkCamera();
    return () => { mounted = false; };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermissionGranted(true);
      setShowCameraPermission(false);
    } catch (err) {
      console.error("Camera permission denied", err);
      alert("ไม่สามารถเข้าถึงกล้องได้ โปรดตรวจสอบการตั้งค่าเบราว์เซอร์");
    }
  };

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    console.warn("Camera failed to start / not found:", err);
    setCameraPermissionGranted(false);
  }, []);

  // ── Webcam / MediaPipe refs ──────────────────────────────────────────────
  // 🔑 Webcam is always mounted (hidden when not playing) so refs are stable
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [webcamCanvas, setWebcamCanvas] = useState<HTMLCanvasElement | null>(null);

  // Poll for the video element and synchronize refs when phase changes
  useEffect(() => {
    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      // Wait for HAVE_ENOUGH_DATA (4) before locking in the refs
      if (video && video.readyState === 4 && canvas) {
        setWebcamVideo(video);
        setWebcamCanvas(canvas);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [phase]);

  // ── Game state refs ──────────────────────────────────────────────────────
  const phaseRef = useRef<"idle" | "playing" | "gameover">("idle");
  const nextIdRef = useRef(1);
  const frameRef = useRef<number | null>(null);
  const pointsAddedRef = useRef(false);
  const lastKilledRef = useRef({ pred: "", time: 0 });

  useEffect(() => { phaseRef.current = phase; }, [phase]);



  // ── onPrediction (stable ref to avoid recreating hook deps) ─────────────
  const onPredictionRef = useRef<(p: any) => void>(() => { });
  // Stable ref so onPredictionRef can call clearBuffer without a stale closure
  const clearBufferRef = useRef<() => void>(() => { });
  onPredictionRef.current = (prediction: any) => {
    if (phaseRef.current !== "playing" || isPausedRef.current) return;
    if (!prediction.success) return;
    if (prediction.confidence < CONFIDENCE_THRESHOLD) return;

    const pred: string = prediction.prediction ? prediction.prediction.trim().toLowerCase() : "";
    const now = Date.now();

    // Debounce — same sign within 1 s won't re-fire
    if (pred === lastKilledRef.current.pred && now - lastKilledRef.current.time < 1000) return;

    setMonsters(prev => {
      const idx = prev.findIndex(m => m.label === pred);
      if (idx === -1) return prev;
      const hit = prev[idx];
      lastKilledRef.current = { pred, time: now };
      setPowPos({ x: hit.x, y: hit.y, word: WORD_LABELS[pred] ?? pred });
      setScore(s => s + 10);
      setTimeout(() => setPowPos(null), 700);
      // 🔑 Flush stale buffer so AI starts fresh for the next gesture
      clearBufferRef.current();
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Stable wrapper so the hook never gets a new function reference
  const stableOnPrediction = useCallback((p: any) => onPredictionRef.current(p), []);

  // ── MediaPipe Holistic ───────────────────────────────────────────────────
  // enabled = true only while playing; MediaPipe runs background buffering always
  const signRecognition = useSignAndDistance({
    videoElement: webcamVideo,
    canvasElement: webcamCanvas,
    enabled: phase === "playing" && cameraPermissionGranted,
    onPrediction: stableOnPrediction,
  });
  // Keep clearBufferRef in sync with the latest hook reference
  clearBufferRef.current = signRecognition.clearBuffer;

  // ── Game Loop ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (isPausedRef.current) {
      frameRef.current = requestAnimationFrame(tick);
      return;
    }

    setMonsters(prev => {
      let dmg = 0;
      const next = prev.reduce<Monster[]>((acc, m) => {
        const nx = m.x + m.vx;
        const ny = m.y + m.vy;
        const dx = nx - ARENA_CENTER.x;
        const dy = ny - ARENA_CENTER.y;
        if (Math.sqrt(dx * dx + dy * dy) < 8) { dmg++; return acc; }
        acc.push({ ...m, x: nx, y: ny });
        return acc;
      }, []);

      if (dmg > 0) {
        setHp(h => {
          const newHp = Math.max(0, h - dmg);
          if (newHp <= 0) { phaseRef.current = "gameover"; setPhase("gameover"); }
          return newHp;
        });
      }
      return next;
    });

    frameRef.current = requestAnimationFrame(tick);
  }, []);



  // ── Spawner ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = Math.max(2500, 4000 - (wave - 1) * 150);
    const maxOnScreen = Math.min(1 + wave, 4);
    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      setMonsters(prev => {
        if (prev.length >= maxOnScreen) return prev;
        return [...prev, spawnMonster(nextIdRef.current++, mode)];
      });
    }, interval);
    return () => clearInterval(timer);
  }, [phase, wave, mode]);

  // ── Wave ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      if (!isPausedRef.current) setWave(w => w + 1);
    }, 20000);
    return () => clearInterval(timer);
  }, [phase]);

  // ── Start / Restart ───────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setMonsters([]); setHp(3); setScore(0); setWave(1);
    nextIdRef.current = 1;
    pointsAddedRef.current = false;
    setPowPos(null);
    lastKilledRef.current = { pred: "", time: 0 };
    setPhase("playing");
    phaseRef.current = "playing";
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  // ── Save score ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "gameover") {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (!pointsAddedRef.current) {
        pointsAddedRef.current = true;
        if (auth.currentUser && score > 0)
          addUserPoints(auth.currentUser.uid, score).catch(console.error);
      }
    }
  }, [phase, score]);

  const handleBackToHome = () => {
    setIsReturningHome(true);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setTimeout(() => navigate("/", { state: { view: "gamesetup" } }), 3000);
  };

  const handleEndGame = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    phaseRef.current = "gameover";
    setPhase("gameover");
  };

  const renderHearts = () =>
    Array.from({ length: 3 }, (_, i) => (
      <img key={i} src={heartImg} alt="Heart" className={`w-6 h-6 object-contain ${i < hp ? "opacity-100" : "opacity-20 grayscale"}`} draggable={false} />
    ));

  const currentPred = signRecognition.currentPrediction;
  const currentConf = signRecognition.currentConfidence;
  const bufferPct = Math.round((signRecognition.bufferLength / 40) * 100);
  const isReady = signRecognition.bufferLength >= 40;

  // ─── Shared Webcam Strip (always mounted) ─────────────────────────────────
  // 🔑 Always in DOM so refs are available immediately after mount
  // Hidden webcam elements – always mounted, out of visual flow
  const HiddenWebcam = cameraPermissionGranted ? (
    <div className="fixed" style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        onUserMediaError={handleUserMediaError}
        videoConstraints={{
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        }}
        style={{ width: 1, height: 1 }}
      />
      <canvas ref={canvasRef} style={{ width: 1, height: 1 }} />
    </div>
  ) : null;

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  if (phase === "gameover") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-[2rem] p-10 text-center w-full max-w-md">
              <p className="text-xs font-black uppercase tracking-widest mb-1 text-muted-foreground">WAVE {wave}</p>
              <h2 className="text-6xl font-black uppercase tracking-tighter mb-6 text-foreground whitespace-nowrap">
                GAME <span className="text-primary">OVER</span>
              </h2>              <div className="neo-brutalism bg-secondary rounded-2xl px-8 py-4 mb-8 inline-block">
                <p className="text-xs font-black uppercase tracking-wider text-foreground opacity-70">Final Score</p>
                <p className="text-5xl font-black text-foreground">{score}</p>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  disabled={isReturningHome}
                  onClick={() => setPhase("idle")}
                  className="neo-brutalism bg-primary text-white font-black uppercase text-xl py-4 rounded-2xl
                    transition-all duration-200 hover:-translate-y-1 hover:brightness-110 disabled:opacity-50"
                >
                  PLAY AGAIN
                </button>
                <button
                  disabled={isReturningHome}
                  onClick={handleBackToHome}
                  className="neo-brutalism bg-white dark:bg-slate-700 text-foreground font-black uppercase text-base py-3 rounded-2xl
                    transition-all duration-200 hover:-translate-y-1 disabled:opacity-50"
                >
                  ← BACK TO CHALLENGE
                </button>
              </div>
            </div>
          </div>
          {/* 🔑 Keep webcam mounted even on game-over so MediaPipe stays warm */}
          {HiddenWebcam}
        </main>
      </>
    );
  }

  // ─── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen bg-background text-foreground relative p-4 md:p-8 flex flex-col items-center">
          {/* Top-left Back Button */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
            <button
              onClick={handleBackToHome}
              className="neo-brutalism bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2 px-4 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center justify-center gap-2"
            >
              ← Back to Challenge
            </button>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col items-center w-full">
            {/* Centered Title */}
            <div className="text-center mb-8 mt-12 md:mt-0">
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2">Sign</h1>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-primary">Defender</h1>
              <div className="h-2 bg-foreground w-20 mx-auto mt-4 rounded-full neo-brutalism-sm"></div>
              <p className="mt-4 font-bold text-base text-muted-foreground">ทำท่ามือให้ตรงกับมอนสเตอร์เพื่อทำลายพวกมัน!</p>
            </div>

            {/* Main Content Area: Side-by-side */}
            <div className="flex flex-col md:flex-row gap-6 w-full items-stretch justify-center">

              {/* Left Column */}
              <div className="w-full max-w-[400px] flex flex-col gap-4">
                {/* How to Play Card (Left) */}
                <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-5 w-full flex flex-col text-sm h-full">
                  <h2 className="text-xl font-black uppercase mb-3 border-b-[3px] border-foreground pb-2">How to Play</h2>
                  <ul className="space-y-4 flex-grow flex flex-col justify-center font-bold">
                    <li className="flex items-start">
                      <span className="neo-brutalism bg-primary text-white font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0 mr-3 text-xs">01</span>
                      <p className="pt-1">มอนสเตอร์เคลื่อนเข้าหาศูนย์กลาง</p>
                    </li>
                    <li className="flex items-start">
                      <span className="neo-brutalism bg-primary text-white font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0 mr-3 text-xs">02</span>
                      <p className="pt-1">ทำท่าภาษามือไทยให้ตรงกับคำบนมอนสเตอร์</p>
                    </li>
                    <li className="flex items-start">
                      <span className="neo-brutalism bg-primary text-white font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0 mr-3 text-xs">03</span>
                      <div className="pt-1">
                        <p>มอนสเตอร์ถึงศูนย์ = เสีย HP · หมด HP =</p>
                        <p className="font-black">Game Over</p>
                      </div>
                    </li>
                    <li className="flex items-start pt-4 border-t-[3px] border-foreground">
                      <span className="neo-brutalism bg-secondary text-foreground font-black rounded-full w-7 h-7 flex items-center justify-center shrink-0 mr-3 text-sm">
                        ★
                      </span>
                      <p className="pt-1">+10 คะแนนต่อมอนสเตอร์ที่ทำลายได้</p>
                    </li>
                  </ul>
                </div>

                {/* Mode Selection */}
                <div className="relative flex bg-white dark:bg-slate-800 rounded-xl p-2 neo-brutalism w-full border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                  {/* Sliding Background */}
                  <div
                    className="absolute top-2 bottom-2 left-2 rounded-lg bg-primary border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-out"
                    style={{
                      width: 'calc((100% - 16px) / 3)',
                      transform: `translateX(calc(${mode === 'easy' ? 0 : mode === 'medium' ? 1 : 2} * 100%))`
                    }}
                  />
                  {(["easy", "medium", "hard"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`relative z-10 flex-1 flex items-center justify-center py-2 sm:py-2.5 rounded-lg font-black uppercase text-sm transition-colors duration-300 ${mode === m
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera & Start Section (Right) */}
              <div className="w-full max-w-[360px] flex flex-col gap-4">

                {/* Camera Feed */}
                <div className="w-full aspect-square neo-brutalism bg-black rounded-xl relative overflow-hidden flex-shrink-0 border-[3px] border-foreground">
                  <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 z-10 border-[2px] border-foreground shadow-[2px_2px_0_0_#000]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    LIVE
                  </div>
                  {cameraPermissionGranted ? (
                    <>
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored
                        onUserMediaError={handleUserMediaError}
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover opacity-80"
                        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {/* Distance Status Overlay inside Webcam */}
                      {(signRecognition.distanceStatus === "too_close" || signRecognition.distanceStatus === "too_far" || signRecognition.distanceStatus === "no_face") && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 flex-col p-2 text-center">
                          <span className="text-2xl mb-1">⚠️</span>
                          <span className="text-xs font-black text-white uppercase leading-tight">
                            {signRecognition.distanceStatus === "too_close" ? "ถอยออกหน่อย" :
                              signRecognition.distanceStatus === "too_far" ? "เข้ามาใกล้หน่อย" : "ไม่พบใบหน้า"}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 p-4 text-center">
                      <Camera size={48} className="opacity-50 mb-2 mt-4" />
                      <p className="font-bold text-sm">ยังไม่ได้เปิดกล้อง</p>
                    </div>
                  )}
                </div>

                {/* Start Button */}
                {!cameraPermissionGranted ? (
                  <button
                    onClick={() => setShowCameraPermission(true)}
                    className="neo-brutalism bg-secondary text-foreground text-xl font-black py-3 px-6 rounded-xl transition-all uppercase w-full border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 active:translate-y-1"
                  >
                    📹 ขออนุญาตใช้งานกล้อง
                  </button>
                ) : (
                  <button
                    onClick={startGame}
                    disabled={!isReady}
                    className={`neo-brutalism bg-primary text-white text-xl font-black py-3 px-6 rounded-xl transition-all uppercase w-full ${isReady ? 'hover:-translate-y-1 hover:brightness-110 active:translate-y-1' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    {isReady ? "START GAME" : `LOADING… ${bufferPct}%`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Camera Permission Modal */}
          {showCameraPermission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="brutal-card-lg max-w-md w-full bg-background neo-brutalism rounded-xl border-[4px] border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
                <div className="border-b-[4px] border-black bg-secondary px-6 py-4">
                  <h2 className="font-display font-black text-xl text-secondary-foreground text-center">
                    📹 อนุญาตการเข้าถึงกล้อง
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-[4px] border-black shadow-[4px_4px_0_0_#000]">
                      <Camera size={48} className="text-accent" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-body text-foreground font-black text-lg">
                      SignQuest ต้องการใช้กล้องของคุณ
                    </p>
                    <p className="font-body text-muted-foreground font-bold text-sm">
                      เราใช้กล้องเพื่อตรวจจับท่าทางภาษามือของคุณแบบเรียลไทม์
                      ข้อมูลวิดีโอจะไม่ถูกบันทึกหรือส่งออกไปจากอุปกรณ์ของคุณ
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={requestCameraPermission}
                      className="w-full neo-brutalism brutal-btn-primary bg-primary text-white font-black py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all"
                    >
                      อนุญาตการเข้าถึงกล้อง
                    </button>
                    <button
                      onClick={() => {
                        setShowCameraPermission(false);
                        setCameraSkipped(true);
                        setCameraPermissionGranted(false);
                      }}
                      className="w-full neo-brutalism brutal-btn-secondary bg-white dark:bg-slate-700 text-foreground font-black py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all text-sm"
                    >
                      ข้าม (เล่นโดยไม่มีกล้อง)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </>
    );
  }


  // ─── PLAYING SCREEN ───────────────────────────────────────────────────────
  return (
    <>
      {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
      {HiddenWebcam}

      {/* ── Exit Modal ── */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="brutal-card-lg max-w-sm w-full bg-white dark:bg-slate-800 neo-brutalism rounded-2xl border-[4px] border-black shadow-[8px_8px_0_0_#000] p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-foreground">Exit Game?</h2>
            <p className="font-bold text-muted-foreground mb-6">
              คุณต้องการออกจากเกมใช่หรือไม่?<br />ความคืบหน้าจะหายไป
            </p>
            <div className="flex gap-4">
              <button
                onClick={closeExitModal}
                className="flex-1 neo-brutalism bg-white dark:bg-slate-700 text-foreground font-black uppercase py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  closeExitModal();
                  handleEndGame();
                }}
                className="flex-1 neo-brutalism bg-rose-500 text-white font-black uppercase py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:brightness-110 transition-all"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className="fixed inset-0 select-none overflow-hidden"
        style={{ background: "hsl(44 95% 96%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* ── Fixed Top HUD ────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-start pointer-events-none">
          {/* Exit Button */}
          <button
            onClick={openExitModal}
            className="pointer-events-auto bg-white border-[3px] border-black px-5 py-2 rounded-xl flex items-center gap-2 transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            style={{ boxShadow: "4px 4px 0px 0px #000", transition: "box-shadow 0.1s, transform 0.1s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0px 0px 0px 0px #000"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px 0px #000"; }}
          >
            <span style={{ fontSize: 20 }}>←</span>
            <span className="font-black uppercase tracking-tight text-sm text-black">EXIT</span>
          </button>

          {/* Right HUD Cluster */}
          <div className="pointer-events-auto flex gap-3">
            {/* Mode */}
            <div
              className={`border-[3px] border-black px-6 py-2 rounded-2xl flex items-center justify-center
                ${mode === 'easy' ? 'bg-green-400' : mode === 'medium' ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <p className="font-black uppercase text-lg text-black tracking-tighter italic">
                {mode === 'easy' ? 'EASY' : mode === 'medium' ? 'NORMAL' : 'HARD'}
              </p>
            </div>

            {/* Wave */}
            <div
              className="bg-yellow-300 border-[3px] border-black px-6 py-2 rounded-2xl"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <p className="font-black uppercase text-lg text-black tracking-tighter italic">WAVE {wave}</p>
            </div>

            {/* Score */}
            <div
              className="bg-white border-[3px] border-black px-6 py-2 rounded-2xl min-w-[160px]"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <p className="font-black uppercase text-lg text-black tracking-tighter">SCORE: {score} PTS</p>
            </div>

            {/* Hearts */}
            <div
              className="bg-white border-[3px] border-black px-5 py-2 rounded-2xl flex gap-1.5 items-center"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <img key={i} src={heartImg} alt="Heart" className={`w-7 h-7 object-contain ${i < hp ? "opacity-100" : "opacity-20 grayscale"}`} draggable={false} />
              ))}
            </div>
          </div>
        </header>

        {/* ── Arena (full screen) ──────────────────────────────────────── */}
        <div className="absolute inset-0">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.5) 1.5px, transparent 1.5px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Decorative concentric rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full border-[16px] absolute" style={{ width: 700, height: 700, borderColor: "rgba(0,0,0,0.04)" }} />
            <div className="rounded-full border-[10px] absolute" style={{ width: 440, height: 440, borderColor: "rgba(0,0,0,0.04)" }} />
          </div>

          {/* Center Shield */}
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          >
            <div
              className="rounded-full border-[6px] border-black flex items-center justify-center relative"
              style={{
                width: 96, height: 96,
                background: "hsl(342 100% 50%)",
                boxShadow: "0 0 40px hsl(342 100% 64% / 0.3), 6px 6px 0 0 #000",
              }}
            >
              <img src={shieldImg} alt="Shield" className="w-[52px] h-[52px] object-contain drop-shadow-md select-none" draggable={false} />
            </div>
          </div>

          {/* POW! */}
          {powPos && (
            <div
              className="absolute z-30 pointer-events-none flex flex-col items-center justify-center animate-bounce drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
              style={{ left: `${powPos.x}%`, top: `${powPos.y}%`, transform: "translate(-50%,-50%)" }}
            >
              <img src={powImg} alt="POW" className="w-32 h-32 object-contain" draggable={false} />
            </div>
          )}

          {/* Monsters */}
          {monsters.map(m => (
            <div
              key={m.id}
              className="absolute z-20 flex flex-col items-center gap-1"
              style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%,-50%)", width: m.size + 32 }}
            >
              {/* Word overhead */}
              <div
                className="bg-black text-white font-black text-center px-3 py-1 rounded-xl whitespace-nowrap tracking-tight z-10"
                style={{
                  fontSize: Math.max(12, m.size * 0.18),
                  boxShadow: `3px 3px 0px 0px ${m.color}`,
                  border: "2px solid white"
                }}
              >
                {WORD_LABELS[m.label] ?? m.label}
              </div>

              {/* Monster Image */}
              <img
                src={MONSTER_IMAGES[m.id % MONSTER_IMAGES.length]}
                alt="Monster"
                className="select-none"
                style={{
                  width: m.size * 0.5,
                  height: m.size * 0.5,
                  objectFit: "contain",
                  filter: "drop-shadow(3px 3px 0px rgba(0,0,0,0.5))"
                }}
                draggable={false}
              />
            </div>
          ))}

          {/* Decorative bolt */}
          <div className="absolute top-1/4 right-16 opacity-10 pointer-events-none rotate-12">
            <span style={{ fontSize: 120, lineHeight: 1 }}>⚡</span>
          </div>
        </div>

        {/* ── Fixed Bottom-Right: Webcam Feed ──────────────────────────── */}
        {cameraPermissionGranted && (
          <section className="fixed bottom-8 right-8 z-50">
            <div className="relative group">
              <div
                className="w-56 h-56 bg-black border-[4px] border-black rounded-2xl overflow-hidden transition-transform group-hover:-translate-y-2"
                style={{ boxShadow: "6px 6px 0px 0px #000" }}
              >
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored
                  onUserMediaError={handleUserMediaError}
                  videoConstraints={{
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                  }}
                  className="w-full h-full object-cover opacity-90"
                  style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: "scaleX(-1)" }}
                />

                {/* LIVE badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 border-[2px] border-black px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-black text-[10px] uppercase tracking-widest">LIVE</span>
                </div>

                {/* Distance warning overlay */}
                {(signRecognition.distanceStatus === "too_close" || signRecognition.distanceStatus === "too_far") && (
                  <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center z-10 p-2 text-center">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-[11px] font-black text-white uppercase leading-tight mt-1">
                      {signRecognition.distanceStatus === "too_close" ? "ถอยออกหน่อย" : "เข้ามาใกล้หน่อย"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Fixed Bottom-Center: Feedback Bar ────────────────────────── */}
        <footer className="fixed bottom-8 left-1/2 z-50 w-full max-w-xl px-4" style={{ transform: "translateX(-50%)" }}>
          <div
            className="bg-white border-[3px] border-black rounded-3xl p-5 flex items-center gap-6"
            style={{ boxShadow: "6px 6px 0px 0px #000" }}
          >
            <div className="flex-shrink-0">
              <p className="font-black text-black/40 uppercase text-[10px] tracking-[0.2em]">DETECTED SIGN:</p>
              <h2
                className={`font-black text-4xl uppercase italic tracking-tighter ${currentConf >= CONFIDENCE_THRESHOLD && currentPred ? "text-rose-600" : "text-black/30"
                  }`}
              >
                {currentPred ? (WORD_LABELS[currentPred] ?? currentPred) : "WAITING…"}
              </h2>
            </div>

            <div className="flex-grow h-10 bg-gray-100 rounded-xl border-[2px] border-black flex items-center px-3 relative overflow-hidden">
              <div
                className="h-full absolute left-0 top-0 rounded-xl transition-all duration-200"
                style={{
                  width: `${Math.min(100, Math.round(currentConf * 100))}%`,
                  background: isReady ? "linear-gradient(90deg, hsl(342 100% 50%), hsl(342 100% 70%))" : "hsl(44 100% 60%)",
                }}
              />
              <p className={`relative z-10 text-black font-bold text-xs ${!isReady ? "animate-pulse" : ""}`}>
                {!isReady ? "⏳ กำลังเตรียมพร้อม..." : "✨ ระบบพร้อมแล้ว! ทำท่ามือได้เลย"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
