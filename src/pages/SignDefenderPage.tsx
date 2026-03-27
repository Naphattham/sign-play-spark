import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSignAndDistance } from "@/hooks/useSignAndDistance";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";

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

function spawnMonster(id: number): Monster {
  const edge = Math.floor(Math.random() * 4);
  let x = 50, y = 50;
  if (edge === 0) { x = randBetween(5, 95); y = 0; }
  else if (edge === 1) { x = 100; y = randBetween(5, 95); }
  else if (edge === 2) { x = randBetween(5, 95); y = 100; }
  else { x = 0; y = randBetween(5, 95); }

  const dx = ARENA_CENTER.x - x;
  const dy = ARENA_CENTER.y - y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const speed = randBetween(0.03, 0.08);
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
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [hp, setHp] = useState(3);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [powPos, setPowPos] = useState<{ x: number; y: number; word: string } | null>(null);
  const [isReturningHome, setIsReturningHome] = useState(false);

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
    console.log("[SignDefender] onPrediction fired! Phase:", phaseRef.current, "Success:", prediction.success);
    if (phaseRef.current !== "playing") return;
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
    enabled: phase === "playing",
    onPrediction: stableOnPrediction,
  });
  // Keep clearBufferRef in sync with the latest hook reference
  clearBufferRef.current = signRecognition.clearBuffer;

  // ── Game Loop ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (phaseRef.current !== "playing") return;

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
      setMonsters(prev => {
        if (prev.length >= maxOnScreen) return prev;
        return [...prev, spawnMonster(nextIdRef.current++)];
      });
    }, interval);
    return () => clearInterval(timer);
  }, [phase, wave]);

  // ── Wave ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => setWave(w => w + 1), 20000);
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

  const renderHearts = () =>
    Array.from({ length: 3 }, (_, i) => (
      <span key={i} style={{ fontSize: 22 }} className={i < hp ? "opacity-100" : "opacity-20 grayscale"}>❤️</span>
    ));

  const currentPred = signRecognition.currentPrediction;
  const currentConf = signRecognition.currentConfidence;
  const bufferPct = Math.round((signRecognition.bufferLength / 40) * 100);
  const isReady = signRecognition.bufferLength >= 40;

  // ─── Shared Webcam Strip (always mounted) ─────────────────────────────────
  // 🔑 Always in DOM so refs are available immediately after mount
  // Hidden webcam elements – always mounted, out of visual flow
  const HiddenWebcam = (
    <div className="fixed" style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
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
  );

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  if (phase === "gameover") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-[2rem] p-10 text-center w-full max-w-md">
              <p className="text-xs font-black uppercase tracking-widest mb-1 text-muted-foreground">WAVE {wave}</p>
              <h2 className="text-6xl font-black uppercase tracking-tighter mb-1 text-foreground">GAME</h2>
              <h2 className="text-6xl font-black uppercase tracking-tighter mb-6 text-primary">OVER</h2>
              <div className="neo-brutalism bg-secondary rounded-2xl px-8 py-4 mb-8 inline-block">
                <p className="text-xs font-black uppercase tracking-wider text-foreground opacity-70">Final Score</p>
                <p className="text-5xl font-black text-foreground">{score}</p>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  disabled={isReturningHome}
                  onClick={startGame}
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

            {/* How to Play Card (Left) */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-5 w-full max-w-[400px] flex flex-col text-sm">
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

            {/* Camera & Start Section (Right) */}
            <div className="w-full max-w-[360px] flex flex-col gap-4">

              {/* Camera Feed */}
              <div className="w-full aspect-square neo-brutalism bg-black rounded-xl relative overflow-hidden flex-shrink-0">
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full uppercase flex items-center gap-1 z-10 border-[2px] border-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </div>
                {signRecognition.isProcessing && (
                  <div className="absolute top-2 right-2 bg-secondary text-foreground text-[10px] font-black uppercase px-2 py-1 rounded-full animate-pulse border-[2px] border-foreground z-10">
                    AI...
                  </div>
                )}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored
                  videoConstraints={{ facingMode: "user" }}
                  className="w-full h-full object-cover opacity-80"
                  style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40">
                  <div
                    className={`h-full transition-all duration-100 ${isReady ? "bg-green-400" : "bg-secondary"}`}
                    style={{ width: `${bufferPct}%` }}
                  />
                </div>
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
              </div>

              {/* Start Button */}
              <button
                onClick={startGame}
                className="neo-brutalism bg-primary text-white text-xl font-black py-3 px-6 rounded-xl transition-all hover:-translate-y-1 hover:brightness-110 active:translate-y-1 uppercase w-full"
              >
                {isReady ? "START GAME" : `WARMING UP… ${bufferPct}%`}
              </button>
            </div>
          </div>
        </div>
      </main>
      </>
    );
  }


  // ─── PLAYING SCREEN ───────────────────────────────────────────────────────
  return (
    <>
      {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
      {HiddenWebcam}

      <main
        className="fixed inset-0 select-none overflow-hidden"
        style={{ background: "hsl(44 95% 96%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* ── Fixed Top HUD ────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-start pointer-events-none">
          {/* Exit Button */}
          <button
            onClick={handleBackToHome}
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
                <span key={i} style={{ fontSize: 26 }} className={i < hp ? "opacity-100" : "opacity-20 grayscale"}>❤️</span>
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
              <span style={{ fontSize: 44 }} className="select-none">🛡️</span>
            </div>
          </div>

          {/* POW! */}
          {powPos && (
            <div
              className="absolute z-30 pointer-events-none"
              style={{ left: `${powPos.x}%`, top: `${powPos.y}%`, transform: "translate(-50%,-50%)" }}
            >
              <div
                className="bg-yellow-300 text-black font-black text-2xl uppercase px-5 py-2 rounded-2xl animate-bounce border-[3px] border-black"
                style={{ boxShadow: "4px 4px 0px 0px #000" }}
              >
                💥 {powPos.word}
              </div>
            </div>
          )}

          {/* Monsters */}
          {monsters.map(m => (
            <div
              key={m.id}
              className="absolute z-20 flex flex-col items-center"
              style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%,-50%)", width: m.size + 24 }}
            >
              {/* Monster tile */}
              <div
                className="flex flex-col items-center rounded-2xl border-[4px] border-black p-2 w-full"
                style={{
                  backgroundColor: m.color,
                  boxShadow: "5px 5px 0px 0px #000",
                  background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
                }}
              >
                <span style={{ fontSize: m.size * 0.38 }} className="select-none leading-none">👾</span>
                <div
                  className="mt-1 bg-black text-white font-black text-center px-2 py-0.5 rounded-lg whitespace-nowrap tracking-tight"
                  style={{ fontSize: Math.max(11, m.size * 0.16) }}
                >
                  {WORD_LABELS[m.label] ?? m.label}
                </div>
              </div>
            </div>
          ))}

          {/* Decorative bolt */}
          <div className="absolute top-1/4 right-16 opacity-10 pointer-events-none rotate-12">
            <span style={{ fontSize: 120, lineHeight: 1 }}>⚡</span>
          </div>
        </div>

        {/* ── Fixed Bottom-Right: Webcam Feed ──────────────────────────── */}
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

              {/* Buffer bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                <div
                  className={`h-full transition-all duration-100 ${isReady ? "bg-green-400" : "bg-yellow-400"}`}
                  style={{ width: `${bufferPct}%` }}
                />
              </div>

              {/* LIVE badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 border-[2px] border-black px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white font-black text-[10px] uppercase tracking-widest">LIVE</span>
              </div>

              {/* Distance warning overlay */}
              {(signRecognition.distanceStatus === "too_close" || signRecognition.distanceStatus === "too_far" || signRecognition.distanceStatus === "no_face") && (
                <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center z-10 p-2 text-center">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-[11px] font-black text-white uppercase leading-tight mt-1">
                    {signRecognition.distanceStatus === "too_close" ? "ถอยออกหน่อย" :
                      signRecognition.distanceStatus === "too_far" ? "เข้ามาใกล้หน่อย" : "ไม่พบใบหน้า"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

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
              <p className="relative z-10 text-black font-bold text-xs">
                {!isReady ? `กำลังรวบรวม ${signRecognition.bufferLength}/40 frames…` : "ระบบพร้อมแล้ว! ทำท่ามือได้เลย"}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
