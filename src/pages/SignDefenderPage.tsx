import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, Pause, Shield, Zap, Skull, ArrowLeft, Swords, Heart, Trophy, Star, Volume2 } from "lucide-react";
import { CameraPermission } from "@/components/CameraPermission";
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
import videoCameraImg from "@/asset/image/video-camera.webp";
import hourglassImg from "@/asset/image/hourglass.webp";

const MONSTER_IMAGES = [m1, m2, m3, m4, m5, m6, m7, m8, m9];

// ─── Shared Camera Constraints ────────────────────────────────────────────────
const VIDEO_CONSTRAINTS = {
  facingMode: "user",
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 30 },
};

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
const CONFIDENCE_THRESHOLD = 0.4;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function spawnMonster(id: number, mode: "easy" | "medium" | "hard"): Monster {
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
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [webcamCanvas, setWebcamCanvas] = useState<HTMLCanvasElement | null>(null);

  // 🚨 1. แก้ไขระบบ Polling กล้องให้แม่นยำขึ้น
  useEffect(() => {
    // ล้างค่าเก่าทิ้งทุกครั้งที่สลับ Phase เพื่อป้องกันการถือ Ref ค้าง
    setWebcamVideo(null);
    setWebcamCanvas(null);

    if (!cameraPermissionGranted) return;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      // ต้องมั่นใจว่า readyState >= 2 (เบราว์เซอร์รับสตรีมและทราบขนาดวิดีโอแล้ว)
      if (video && video.readyState >= 2 && canvas) {
        setWebcamVideo(video);
        setWebcamCanvas(canvas);
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [phase, cameraPermissionGranted]);

  // ── Game state refs ──────────────────────────────────────────────────────
  const phaseRef = useRef<"idle" | "playing" | "gameover">("idle");
  const nextIdRef = useRef(1);
  const frameRef = useRef<number | null>(null);
  const pointsAddedRef = useRef(false);
  const lastKilledRef = useRef({ pred: "", time: 0 });

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── onPrediction (stable ref to avoid recreating hook deps) ─────────────
  const onPredictionRef = useRef<(p: any) => void>(() => { });
  const clearBufferRef = useRef<() => void>(() => { });

  onPredictionRef.current = (prediction: any) => {
    // ป้องกันไม่ให้ Game Logic ทำงานถ้ายังไม่เริ่มเล่น
    if (phaseRef.current !== "playing" || isPausedRef.current) return;

    if (!prediction.success) return;
    if (prediction.confidence < CONFIDENCE_THRESHOLD) return;

    const pred: string = prediction.prediction ? prediction.prediction.trim().toLowerCase() : "";
    const now = Date.now();

    // 🚨 1. ลดเวลา Cooldown (Debounce) จาก 1000ms เหลือ 400ms ให้เกมลื่นไหลขึ้น
    if (pred === lastKilledRef.current.pred && now - lastKilledRef.current.time < 400) return;

    setMonsters(prev => {
      // 🚨 ปรับเงื่อนไขการค้นหามอนสเตอร์ ให้รองรับคำที่ใช้แทนกันได้
      const idx = prev.findIndex(m => {
        // 1. ถ้าคำตรงกันเป๊ะๆ ให้ผ่าน
        if (m.label === pred) return true;

        // 2. กรณีพิเศษ: อนุโลมให้ "สบายดี" (fine) และ "สบายดีไหม" (how_are_you) ตีแทนกันได้
        if (m.label === "fine" && pred === "how_are_you") return true;
        if (m.label === "how_are_you" && pred === "fine") return true;

        return false;
      });

      if (idx === -1) return prev; // ท่าทางถูก แต่ไม่มีมอนสเตอร์เป้าหมายบนจอ

      const hit = prev[idx];
      lastKilledRef.current = { pred, time: now };

      // 💡 เปลี่ยนจาก pred เป็น hit.label เพื่อให้เอฟเฟกต์ระเบิดโชว์คำของมอนสเตอร์ที่ตายจริงๆ
      setPowPos({ x: hit.x, y: hit.y, word: WORD_LABELS[hit.label] ?? hit.label });

      const points = mode === "easy" ? 5 : mode === "hard" ? 15 : 10;
      setScore(s => s + points);
      setTimeout(() => setPowPos(null), 700);

      // 🚨 2. ปิดการ Clear Buffer เพื่อให้ AI ไม่ต้องรอเก็บเฟรมภาพ 1.3 วินาทีใหม่ทุกครั้งที่โจมตี
      // clearBufferRef.current(); 

      return prev.filter((_, i) => i !== idx);
    });
  };

  const stableOnPrediction = useCallback((p: any) => onPredictionRef.current(p), []);

  // ── MediaPipe Holistic ───────────────────────────────────────────────────
  const signRecognition = useSignAndDistance({
    videoElement: webcamVideo,
    canvasElement: webcamCanvas,
    // 🚨 2. เปิดใช้งานตลอดเวลาเพื่อให้โมเดล Buffer ไว้ล่วงหน้าตั้งแต่หน้า Idle!
    enabled: cameraPermissionGranted,
    predictEnabled: phase === "playing" && !isPausedRef.current,
    onPrediction: stableOnPrediction,
  });
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

  const currentPred = signRecognition.currentPrediction;
  const currentConf = signRecognition.currentConfidence;
  const bufferPct = Math.round((signRecognition.bufferLength / 40) * 100);
  const isReady = signRecognition.bufferLength >= 40;

  if (isReturningHome) {
    return <LoadingScreen message="Returning to Challenge..." />;
  }

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  if (phase === "gameover") {
    return (
      <>
        <main className="min-h-screen flex flex-col relative overflow-hidden sd-gradient-bg">
          {/* Dot grid background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.4) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }} />

          {/* Floating decorative monsters */}
          <div className="absolute top-[10%] left-[8%] opacity-10 pointer-events-none sd-float">
            <Skull size={80} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-[15%] right-[10%] opacity-10 pointer-events-none sd-float-delay">
            <Skull size={60} strokeWidth={1.5} />
          </div>
          <div className="absolute top-[20%] right-[15%] opacity-8 pointer-events-none sd-float">
            <Zap size={50} strokeWidth={1.5} />
          </div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="sd-slide-up bg-white dark:bg-slate-800 border-[3px] md:border-[4px] border-black rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center w-full max-w-md z-10 relative"
              style={{ boxShadow: "6px 6px 0px 0px #000" }}>

              {/* Wave badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-300 border-[3px] border-black px-5 py-1.5 rounded-full"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <p className="font-black uppercase text-xs tracking-widest text-black">WAVE {wave}</p>
              </div>

              {/* Skull icon */}
              <div className="mx-auto mb-3 md:mb-4 mt-2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-500 border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Skull className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>

              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-6 text-foreground whitespace-nowrap sd-title-glitch">
                GAME <span className="text-primary">OVER</span>
              </h2>

              {/* Score card */}
              <div className="bg-secondary border-[3px] border-black rounded-2xl px-6 md:px-8 py-4 md:py-5 mb-6 md:mb-8 inline-block relative"
                style={{ boxShadow: "4px 4px 0 0 #000" }}>
                <Trophy className="absolute -top-3 -right-3 w-7 h-7 md:w-8 md:h-8 text-yellow-600 bg-yellow-300 rounded-full p-1 border-2 border-black" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60 mb-1">FINAL SCORE</p>
                <p className="text-4xl md:text-6xl font-black text-foreground leading-none">{score}</p>
                <p className="text-[10px] md:text-xs font-bold text-foreground/50 mt-1 uppercase">Points Earned</p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  disabled={isReturningHome}
                  onClick={() => setPhase("idle")}
                  className="bg-primary text-white font-black uppercase text-lg md:text-xl py-4 rounded-2xl border-[3px] border-black
                    transition-all duration-200 hover:-translate-y-1 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "5px 5px 0px 0px #000" }}
                >
                  <Swords className="w-5 h-5" /> PLAY AGAIN
                </button>
                <button
                  disabled={isReturningHome}
                  onClick={handleBackToHome}
                  className="bg-white dark:bg-slate-700 text-foreground font-black uppercase text-sm md:text-base py-3 rounded-2xl border-[3px] border-black
                    transition-all duration-200 hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "4px 4px 0px 0px #000" }}
                >
                  <ArrowLeft className="w-4 h-4" /> BACK TO CHALLENGE
                </button>
              </div>
            </div>
          </div>

          {/* ซ่อนกล้องไว้เพื่อให้สตรีมไม่ถูกตัดตอนสลับ Phase */}
          {cameraPermissionGranted && (
            <div className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
              <Webcam ref={webcamRef} audio={false} videoConstraints={VIDEO_CONSTRAINTS} />
              <canvas ref={canvasRef} />
            </div>
          )}
        </main>
      </>
    );
  }

  // ─── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <>
        <main className="min-h-screen text-foreground relative p-3 sm:p-4 md:p-8 flex flex-col items-center overflow-hidden sd-gradient-bg">
          {/* Dot grid background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.35) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }} />

          {/* Floating decorative elements - hidden on very small screens */}
          <div className="absolute top-[8%] right-[12%] opacity-[0.07] pointer-events-none sd-float hidden sm:block">
            <Zap size={90} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-[12%] left-[6%] opacity-[0.07] pointer-events-none sd-float-delay hidden sm:block">
            <Shield size={70} strokeWidth={1.5} />
          </div>
          <div className="absolute top-[60%] right-[5%] opacity-[0.05] pointer-events-none sd-float hidden md:block">
            <Swords size={60} strokeWidth={1.5} />
          </div>

          {/* Top-left Back Button */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
            <button
              onClick={handleBackToHome}
              className="bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2.5 px-5 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center justify-center gap-2 border-[3px] border-black active:translate-y-0"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col items-center w-full relative z-10">
            {/* Centered Title */}
            <div className="text-center mb-4 sm:mb-6 md:mb-8 mt-14 md:mt-0 sd-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/30 rounded-full px-3 sm:px-4 py-1 mb-3 sm:mb-4">
                <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary">Defense Mode</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-1 sd-title-glitch">Sign</h1>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-primary sd-title-glitch">Defender</h1>
              <div className="h-1.5 bg-foreground w-16 mx-auto mt-4 rounded-full border-[2px] border-black" style={{ boxShadow: "2px 2px 0 0 #000" }} />
              <p className="mt-4 font-bold text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
                ทำท่ามือให้ตรงกับมอนสเตอร์เพื่อทำลายพวกมัน!
              </p>
            </div>

            {/* Main Content Area: Side-by-side */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-5 w-full items-stretch justify-center">

              {/* Left Column: How to Play */}
              <div className="w-full md:max-w-[400px] flex flex-col sd-slide-up" style={{ animationDelay: "0.1s" }}>
                {/* How to Play Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full flex flex-col text-sm h-full border-[3px] border-black relative"
                  style={{ boxShadow: "6px 6px 0px 0px #000" }}>
                  {/* Badge */}
                  {/* <div className="absolute -top-3 left-5 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-[2px] border-black"
                    style={{ boxShadow: "2px 2px 0 0 #000" }}>
                    📖 Tutorial
                  </div> */}
                  <h2 className="text-lg md:text-xl font-black uppercase mb-4 border-b-[3px] border-foreground pb-2 mt-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> How to Play
                  </h2>
                  <ul className="space-y-3 flex-grow flex flex-col justify-center font-bold">
                    <li className="flex items-start group">
                      <span className="bg-primary text-white font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-xs border-[2px] border-black transition-transform group-hover:scale-110"
                        style={{ boxShadow: "2px 2px 0 0 #000" }}>
                        <Swords className="w-4 h-4" />
                      </span>
                      <p className="pt-1.5 text-sm">มอนสเตอร์เคลื่อนเข้าหาศูนย์กลาง</p>
                    </li>
                    <li className="flex items-start group">
                      <span className="bg-primary text-white font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-xs border-[2px] border-black transition-transform group-hover:scale-110"
                        style={{ boxShadow: "2px 2px 0 0 #000" }}>
                        <Camera className="w-4 h-4" />
                      </span>
                      <p className="pt-1.5 text-sm">ทำท่าภาษามือไทยให้ตรงกับคำบนมอนสเตอร์</p>
                    </li>
                    <li className="flex items-start group">
                      <span className="bg-primary text-white font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-xs border-[2px] border-black transition-transform group-hover:scale-110"
                        style={{ boxShadow: "2px 2px 0 0 #000" }}>
                        <Heart className="w-4 h-4" />
                      </span>
                      <p className="pt-1.5 text-sm">โดนโจมตีจนหัวใจหมด = GAME OVER</p>
                    </li>
                    <li className="flex flex-col pt-3 border-t-[3px] border-foreground/20 gap-2 mt-1">
                      <div className="flex items-center">
                        <span className="bg-secondary text-foreground font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-sm border-[2px] border-black"
                          style={{ boxShadow: "2px 2px 0 0 #000" }}>
                          <Star className="w-4 h-4" />
                        </span>
                        <p className="font-bold text-sm">คะแนนต่อมอนสเตอร์ 1 ตัว:</p>
                      </div>
                      <div className="pl-11 space-y-1.5 text-xs font-black uppercase tracking-tight">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black" /> 
                          <span className="text-green-600">EASY : +5 PTS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black" /> 
                          <span className="text-amber-500">MEDIUM : +10 PTS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-black" /> 
                          <span className="text-rose-600">HARD : +15 PTS</span>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Camera Feed only */}
              <div className="w-full md:max-w-[360px] flex flex-col sd-slide-up" style={{ animationDelay: "0.2s" }}>
                {/* Camera Feed */}
                <div className="w-full aspect-[4/3] sm:aspect-square md:aspect-auto md:h-full bg-black rounded-xl sm:rounded-2xl relative overflow-hidden flex-shrink-0 md:flex-shrink md:min-h-0 border-[3px] sm:border-[4px] border-black"
                  style={{ boxShadow: "6px 6px 0px 0px #000" }}>
                  {/* Scan line effect */}
                  <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
                    style={{
                      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
                    }} />
                  <div className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 z-10 border-[2px] border-black"
                    style={{ boxShadow: "2px 2px 0 0 #000" }}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                  {/* Camera status badge */}
                  <div className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase z-10 border-[2px] border-black ${
                    signRecognition.distanceStatus === 'good' ? 'bg-green-400 text-black' : 'bg-yellow-300 text-black'
                  }`} style={{ boxShadow: "2px 2px 0 0 #000" }}>
                    {signRecognition.distanceStatus === 'good' ? '✓ Ready' : '⏳ Setup'}
                  </div>
                  {cameraPermissionGranted ? (
                    <>
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored
                        onUserMediaError={handleUserMediaError}
                        videoConstraints={VIDEO_CONSTRAINTS}
                        className="w-full h-full object-cover"
                        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {/* Distance Status Overlay */}
                      {(signRecognition.distanceStatus === "too_close" || signRecognition.distanceStatus === "too_far" || signRecognition.distanceStatus === "no_face") && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 flex-col p-4 text-center backdrop-blur-sm">
                          <div className="w-14 h-14 rounded-full bg-yellow-400 border-[3px] border-black flex items-center justify-center mb-3"
                            style={{ boxShadow: "3px 3px 0 0 #000" }}>
                            <span className="text-2xl">⚠️</span>
                          </div>
                          <span className="text-sm font-black text-white uppercase leading-tight bg-black/40 px-4 py-2 rounded-xl">
                            {signRecognition.distanceStatus === "too_close" ? "ถอยออกหน่อย" :
                              signRecognition.distanceStatus === "too_far" ? "เข้ามาใกล้หน่อย" : "ไม่พบใบหน้า"}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 p-4 text-center bg-gradient-to-b from-black/80 to-black/95">
                      <div className="w-16 h-16 rounded-full border-[3px] border-white/20 flex items-center justify-center mb-3">
                        <Camera size={32} className="opacity-40" />
                      </div>
                      <p className="font-black text-sm uppercase tracking-wider">ยังไม่ได้เปิดกล้อง</p>
                      <p className="font-bold text-xs opacity-50 mt-1">กดปุ่มด้านล่างเพื่อเริ่ม</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Mode Selection + Start Button (aligned side-by-side) */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-5 w-full items-stretch justify-center mt-4 sd-slide-up" style={{ animationDelay: "0.3s" }}>
              {/* Mode Selection */}
              <div className="relative flex bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 w-full md:max-w-[400px] border-[3px] border-black"
                style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                {/* Sliding Background */}
                <div
                  className="absolute top-2 bottom-2 left-2 rounded-xl transition-all duration-300 ease-out border-[2px] border-black"
                  style={{
                    width: 'calc((100% - 16px) / 3)',
                    transform: `translateX(calc(${mode === 'easy' ? 0 : mode === 'medium' ? 1 : 2} * 100%))`,
                    background: mode === 'easy' ? 'hsl(142 70% 49%)' : mode === 'medium' ? 'hsl(44 100% 60%)' : 'hsl(0 84% 60%)',
                    boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
                  }}
                />
                {(["easy", "medium", "hard"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`relative z-10 flex-1 flex items-center justify-center py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-black uppercase text-xs sm:text-sm tracking-tight transition-colors duration-300 ${mode === m
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {m === 'easy' && '🟢 '}{m === 'medium' && '🟡 '}{m === 'hard' && '🔴 '}
                    {m}
                  </button>
                ))}
              </div>

              {/* Start Button */}
              <div className="w-full md:max-w-[360px]">
                {!cameraPermissionGranted ? (
                  <button
                    onClick={() => setShowCameraPermission(true)}
                    className="bg-secondary text-foreground text-base sm:text-lg md:text-xl font-black py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all uppercase w-full border-[3px] border-black hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 h-full"
                    style={{ boxShadow: "5px 5px 0px 0px #000" }}
                  >
                    <img src={videoCameraImg} alt="Camera" className="w-5 h-5 object-contain" /> ขออนุญาตใช้งานกล้อง
                  </button>
                ) : (
                  <button
                    onClick={startGame}
                    disabled={!isReady}
                    className={`relative text-white text-base sm:text-lg md:text-xl font-black py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all uppercase w-full border-[3px] border-black overflow-hidden flex items-center justify-center gap-2 h-full ${isReady ? 'bg-primary hover:-translate-y-1 hover:brightness-110 active:translate-y-0' : 'bg-gray-400 cursor-not-allowed'}`}
                    style={{ boxShadow: isReady ? "5px 5px 0px 0px #000" : "3px 3px 0px 0px #000" }}
                  >
                    {!isReady && (
                      <div className="absolute left-0 top-0 h-full bg-primary/50 transition-all duration-300" style={{ width: `${bufferPct}%` }} />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {isReady ? <><Swords className="w-5 h-5" /> START GAME</> : <><img src={hourglassImg} alt="Loading" className="w-5 h-5 object-contain" /> LOADING… {bufferPct}%</>}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Camera Permission Modal */}
          {showCameraPermission && (
            <CameraPermission
              onAllow={requestCameraPermission}
              skipCalibration={true}
              onSkip={() => {
                setShowCameraPermission(false);
                setCameraSkipped(true);
                setCameraPermissionGranted(false);
              }}
            />
          )}
        </main>
      </>
    );
  }

  // ─── PLAYING SCREEN ───────────────────────────────────────────────────────
  return (
    <>
      {/* ── Exit Modal ── */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl border-[4px] border-black p-6 text-center sd-slide-up"
            style={{ boxShadow: "8px 8px 0px 0px #000" }}>
            {/* Pause icon */}
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-yellow-300 border-[3px] border-black flex items-center justify-center"
              style={{ boxShadow: "3px 3px 0 0 #000" }}>
              <Pause className="w-7 h-7 text-black" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-foreground">Game Paused</h2>
            <p className="font-bold text-muted-foreground mb-6 text-sm">
              คุณต้องการออกจากเกมใช่หรือไม่?<br />ความคืบหน้าจะหายไป
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  closeExitModal();
                  handleEndGame();
                }}
                className="flex-1 bg-white dark:bg-slate-700 text-rose-600 font-black uppercase py-3 rounded-xl border-[3px] border-black hover:-translate-y-1 transition-all flex items-center justify-center gap-1.5"
                style={{ boxShadow: "4px 4px 0px 0px #000" }}
              >
                <Skull className="w-4 h-4" /> ออกจากเกม
              </button>
              <button
                onClick={closeExitModal}
                className="flex-1 bg-primary text-white font-black uppercase py-3 rounded-xl border-[3px] border-black hover:-translate-y-1 hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                style={{ boxShadow: "4px 4px 0px 0px #000" }}
              >
                <Swords className="w-4 h-4" /> เล่นต่อ
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className="fixed inset-0 select-none overflow-hidden sd-gradient-bg"
      >
        {/* ── Fixed Top HUD ────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 w-full px-3 md:px-6 py-3 md:py-4 z-50 flex flex-row justify-between items-center pointer-events-none gap-2 md:gap-4">

          {/* Pause Button */}
          <button
            onClick={openExitModal}
            className="pointer-events-auto shrink-0 bg-white border-[3px] border-black px-3 md:px-5 py-2 rounded-2xl flex items-center justify-center gap-1.5 md:gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            style={{ boxShadow: "4px 4px 0px 0px #000" }}
          >
            <Pause className="w-5 h-5 text-black" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-sm md:text-base text-black hidden sm:inline">PAUSE</span>
          </button>

          {/* Right HUD Cluster */}
          <div className="pointer-events-auto flex flex-row flex-wrap justify-end items-center gap-2 md:gap-3">

            {/* Mode */}
            <div
              className={`border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center justify-center gap-1
        ${mode === 'easy' ? 'bg-green-400' : mode === 'medium' ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <span className="text-sm">{mode === 'easy' ? '🟢' : mode === 'medium' ? '🟡' : '🔴'}</span>
              <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter">
                {mode.toUpperCase()}
              </p>
            </div>

            {/* Wave */}
            <div
              className="bg-yellow-300 border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center gap-1.5"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter">W{wave}</p>
            </div>

            {/* Score */}
            <div
              className="bg-white border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center gap-1.5"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
              <p className="font-black text-sm md:text-base text-black tracking-tighter">{score}</p>
              <span className="text-[10px] md:text-xs font-black text-black/40 uppercase">PTS</span>
            </div>

            {/* Hearts */}
            <div
              className="bg-white border-[3px] border-black px-2.5 md:px-4 py-1.5 md:py-2 rounded-2xl flex gap-1 items-center"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}
            >
              {Array.from({ length: 3 }, (_, i) => (
                <img key={i} src={heartImg} alt="Heart"
                  className={`w-5 h-5 md:w-6 md:h-6 object-contain transition-all duration-300 ${i < hp ? "opacity-100 scale-100" : "opacity-20 grayscale scale-75"}`}
                  draggable={false} />
              ))}
            </div>

          </div>
        </header>

        {/* ── Arena (full screen) ──────────────────────────────────────── */}
        <div className="absolute inset-0">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.4) 1.5px, transparent 1.5px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Decorative concentric rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full border-[20px] absolute" style={{ width: 800, height: 800, borderColor: "rgba(0,0,0,0.02)" }} />
            <div className="rounded-full border-[14px] absolute" style={{ width: 560, height: 560, borderColor: "rgba(0,0,0,0.03)" }} />
            <div className="rounded-full border-[8px] absolute" style={{ width: 340, height: 340, borderColor: "rgba(0,0,0,0.04)" }} />
          </div>

          {/* Center Shield with glow */}
          <div
            className="absolute z-10"
            style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          >
            {/* Pulse rings */}
            <div className="absolute rounded-full border-2 border-primary/20 pointer-events-none"
              style={{ width: 160, height: 160, left: "50%", top: "50%", transform: "translate(-50%,-50%)", opacity: 0, animation: "sd-pulse-ring 3s ease-out infinite" }} />
            <div className="absolute rounded-full border-2 border-primary/15 pointer-events-none"
              style={{ width: 160, height: 160, left: "50%", top: "50%", transform: "translate(-50%,-50%)", opacity: 0, animation: "sd-pulse-ring 3s ease-out 1s infinite" }} />
            <div
              className="rounded-full border-[6px] border-black flex items-center justify-center relative sd-glow-pulse"
              style={{
                width: 100, height: 100,
                background: "linear-gradient(135deg, hsl(342 100% 55%), hsl(342 100% 45%))",
              }}
            >
              <img src={shieldImg} alt="Shield" className="w-[54px] h-[54px] object-contain drop-shadow-md select-none" draggable={false} />
            </div>
          </div>

          {/* POW! */}
          {powPos && (
            <div
              className="absolute z-30 pointer-events-none flex flex-col items-center justify-center sd-shake"
              style={{ left: `${powPos.x}%`, top: `${powPos.y}%`, transform: "translate(-50%,-50%)" }}
            >
              <img src={powImg} alt="POW" className="w-36 h-36 object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]" draggable={false} />
              <span className="font-black text-sm text-white bg-black/70 px-3 py-1 rounded-full border-2 border-white mt-1 whitespace-nowrap"
                style={{ boxShadow: "2px 2px 0 0 #000" }}>
                ✓ {powPos.word}
              </span>
            </div>
          )}

          {/* Monsters */}
          {monsters.map(m => (
            <div
              key={m.id}
              className="absolute z-20 flex flex-col items-center gap-1 sd-monster-enter"
              style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.size + 32 }}
            >
              {/* Word overhead */}
              <div
                className="bg-black text-white font-black text-center px-3 py-1.5 rounded-xl whitespace-nowrap tracking-tight z-10"
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

          {/* Decorative floating elements */}
          <div className="absolute top-[15%] right-[8%] opacity-[0.06] pointer-events-none sd-float rotate-12">
            <Zap size={100} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-[20%] left-[5%] opacity-[0.05] pointer-events-none sd-float-delay -rotate-6">
            <Shield size={80} strokeWidth={1.5} />
          </div>
        </div>

        {/* ── Fixed Bottom-Right: Webcam Feed ──────────────────────────── */}
        {cameraPermissionGranted && (
          <section className="fixed bottom-[72px] sm:bottom-20 md:bottom-8 right-2 sm:right-4 md:right-8 z-50">
            <div className="relative group">
              <div
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-52 md:h-52 bg-black border-[3px] sm:border-[4px] border-black rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_0_#000]"
                style={{ boxShadow: "6px 6px 0px 0px #000" }}
              >
                {/* Scan lines */}
                <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.04]"
                  style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)" }} />
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored
                  onUserMediaError={handleUserMediaError}
                  videoConstraints={VIDEO_CONSTRAINTS}
                  className="w-full h-full object-cover"
                  style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: "scaleX(-1)" }}
                />

                {/* LIVE badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-500 border-[2px] border-black px-2 py-0.5 rounded-full"
                  style={{ boxShadow: "2px 2px 0 0 #000" }}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-black text-[9px] uppercase tracking-widest">LIVE</span>
                </div>

                {/* Distance warning overlay */}
                {(signRecognition.distanceStatus === "too_close" || signRecognition.distanceStatus === "too_far") && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 p-2 text-center backdrop-blur-sm">
                    <span className="text-xl mb-1">⚠️</span>
                    <span className="text-[10px] font-black text-white uppercase leading-tight bg-black/40 px-3 py-1 rounded-lg">
                      {signRecognition.distanceStatus === "too_close" ? "ถอยออกหน่อย" : "เข้ามาใกล้หน่อย"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Fixed Bottom-Center: Feedback Bar ────────────────────────── */}
        <footer className="fixed bottom-2 sm:bottom-3 md:bottom-6 left-2 right-[7.5rem] sm:right-[9.5rem] md:left-1/2 md:right-auto md:-translate-x-1/2 z-40 md:w-full md:max-w-lg md:px-4">
          <div
            className="bg-white border-[2px] sm:border-[3px] border-black rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-5"
            style={{ boxShadow: "5px 5px 0px 0px #000" }}
          >
            <div className="flex-shrink-0">
              <p className="font-black text-black/40 uppercase text-[9px] tracking-[0.15em]">DETECTED:</p>
              <h2
                className={`font-black text-xl sm:text-2xl md:text-3xl uppercase italic tracking-tighter leading-tight ${currentConf >= CONFIDENCE_THRESHOLD && currentPred ? "text-rose-600" : "text-black/25"
                  }`}
              >
                {currentPred ? (WORD_LABELS[currentPred] ?? currentPred) : "WAITING…"}
              </h2>
            </div>

            <div className="flex-grow h-7 sm:h-8 md:h-9 bg-gray-100 rounded-lg sm:rounded-xl border-[2px] border-black flex items-center px-2 sm:px-2.5 relative overflow-hidden">
              <div
                className="h-full absolute left-0 top-0 rounded-xl transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(currentConf * 100))}%`,
                  background: isReady ? "linear-gradient(90deg, hsl(342 100% 50%), hsl(342 100% 70%))" : "hsl(44 100% 60%)",
                }}
              />
              <p className={`relative z-10 text-black font-bold text-[9px] sm:text-[10px] md:text-xs ${!isReady ? "animate-pulse" : ""}`}>
                {!isReady ? "⏳ กำลังเตรียมพร้อม..." : "✨ ทำท่ามือได้เลย!"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}