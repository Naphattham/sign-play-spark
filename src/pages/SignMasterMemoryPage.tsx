import { useState, useEffect, useRef, useCallback } from "react";
import { Star, HelpCircle, Smile, Meh, Frown, Play, RotateCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useAudio } from "@/lib/audioContext";

// ─── Types ──────────────────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";
type CardType = "video" | "text";
type CardStatus = "hidden" | "flipped" | "matched";

interface MemoryCard {
  uid: string;       // unique card instance id
  pairId: string;    // shared id between the two paired cards
  type: CardType;
  term: string;      // Thai display text
  translation: string;
  videoUrl: string;
  status: CardStatus;
}

// ─── Word pool ───────────────────────────────────────────────────────────
const WORD_POOL = [
  { id: "w1", term: "สวัสดีผู้ใหญ่", translation: "Hello (Adult)", videoUrl: getVideoUrl("general", "สวัสดี (ผู้ใหญ่)") },
  { id: "w2", term: "สวัสดีเพื่อน", translation: "Hello (Friend)", videoUrl: getVideoUrl("general", "สวัสดี (เพื่อน)") },
  { id: "w3", term: "สบายดีไหม", translation: "How are you?", videoUrl: getVideoUrl("general", "สบายดีไหม") },
  { id: "w4", term: "สบายดี", translation: "I'm fine", videoUrl: getVideoUrl("general", "สบายดี") },
  { id: "w5", term: "ไม่สบายใจ", translation: "Unhappy", videoUrl: getVideoUrl("general", "ไม่สบายใจ") },
  { id: "w6", term: "กินแล้ว", translation: "Already ate", videoUrl: getVideoUrl("general", "กินแล้ว") },
  { id: "w7", term: "ยังไม่ได้กิน", translation: "Not yet eaten", videoUrl: getVideoUrl("general", "ยังไม่ได้กิน") },
  { id: "w8", term: "ลาก่อน", translation: "Goodbye", videoUrl: getVideoUrl("general", "ลาก่อน") },
  { id: "w9", term: "กลัว", translation: "Scared", videoUrl: getVideoUrl("emotions", "กลัว") },
  { id: "w10", term: "รัก", translation: "Love", videoUrl: getVideoUrl("emotions", "รัก") },
  { id: "w11", term: "เหนื่อย", translation: "Tired", videoUrl: getVideoUrl("emotions", "เหนื่อย") },
  { id: "w12", term: "โกรธ", translation: "Angry", videoUrl: getVideoUrl("emotions", "โกรธ") },
  { id: "w13", term: "ทำไม", translation: "Why?", videoUrl: getVideoUrl("qa", "ทำไม") },
  { id: "w14", term: "อะไร", translation: "What?", videoUrl: getVideoUrl("qa", "อะไร") },
  { id: "w15", term: "เท่าไหร่", translation: "How much?", videoUrl: getVideoUrl("qa", "เท่าไหร่") },
  { id: "w16", term: "ใช่", translation: "Yes", videoUrl: getVideoUrl("qa", "ใช่") },
  { id: "w17", term: "ไม่", translation: "No", videoUrl: getVideoUrl("qa", "ไม่") },
  { id: "w18", term: "ปวดท้อง", translation: "Stomachache", videoUrl: getVideoUrl("illness", "ปวดท้อง") },
];

// ─── Config ──────────────────────────────────────────────────────────────
const DIFF_CONFIG: Record<Difficulty, { label: string; pairs: number; cols: number; penalty: number; bonusBase: number; maxMisses: number }> = {
  easy: { label: "Easy", pairs: 3, cols: 3, penalty: 5, bonusBase: 50, maxMisses: 5 },
  medium: { label: "Medium", pairs: 6, cols: 4, penalty: 10, bonusBase: 100, maxMisses: 10 },
  hard: { label: "Hard", pairs: 9, cols: 6, penalty: 10, bonusBase: 200, maxMisses: 20 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(difficulty: Difficulty): MemoryCard[] {
  const { pairs } = DIFF_CONFIG[difficulty];
  const words = shuffleArray(WORD_POOL).slice(0, pairs);

  const cards: MemoryCard[] = [];
  words.forEach((w) => {
    cards.push({
      uid: `${w.id}-video`,
      pairId: w.id,
      type: "video",
      term: w.term,
      translation: w.translation,
      videoUrl: w.videoUrl,
      status: "hidden",
    });
    cards.push({
      uid: `${w.id}-text`,
      pairId: w.id,
      type: "text",
      term: w.term,
      translation: w.translation,
      videoUrl: w.videoUrl,
      status: "hidden",
    });
  });

  return shuffleArray(cards);
}

function calcScore(bonusBase: number, misses: number, penalty: number): number {
  return Math.max(0, bonusBase - misses * penalty);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Card Component ───────────────────────────────────────────────────────
interface MemoryCardProps {
  card: MemoryCard;
  isFlipping: boolean;
  onClick: (uid: string) => void;
  isLocked: boolean;
  isMatchGlowing?: boolean;
}

function MemoryCardTile({ card, isFlipping, onClick, isLocked, isMatchGlowing }: MemoryCardProps) {
  const isVisible = card.status === "flipped" || card.status === "matched" || isFlipping;
  const isMatched = card.status === "matched";

  const [playKey, setPlayKey] = useState(0);
  const [shouldRenderContent, setShouldRenderContent] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRenderContent(true);
    } else {
      // Delay unmounting the content until the 500ms 3D flip animation has completed.
      // This immediately drastically reduces iPad memory usage because 
      // inactive animated WebPs are completely removed from the DOM.
      const timer = setTimeout(() => {
        setShouldRenderContent(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && card.type === "video") {
      // Delay remount to exactly when the front of the card faces the user (offsetting the flip animation)
      const timer = setTimeout(() => {
        setPlayKey((k) => k + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, card.type]);

  const handleClick = () => {
    if (card.status !== "hidden" || isLocked) return;
    onClick(card.uid);
  };

  return (
    <div
      className={`w-full aspect-square cursor-pointer transition-transform duration-500 ${isMatchGlowing ? "-translate-y-2" : ""}`}
      style={{ perspective: "600px" }}
      onClick={handleClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isVisible ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back (hidden) */}
        <div
          className={`absolute inset-0 border-4 border-black flex items-center justify-center rounded-lg
            ${isMatched ? "bg-green-100" : "bg-primary"}
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <Star className="text-white w-10 h-10 md:w-12 md:h-12" fill="currentColor" />
        </div>

        {/* Front (revealed) */}
        <div
          className={`absolute inset-0 border-4 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300
            ${isMatchGlowing
              ? "border-yellow-400 bg-yellow-50 shadow-[0_0_0_6px_rgba(250,204,21,0.6),4px_4px_0px_0px_rgba(0,0,0,1)]"
              : "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {shouldRenderContent ? (
            card.type === "video" ? (
              <VideoPlayer
                key={`${card.uid}-${playKey}`}
                src={card.videoUrl}
                title={card.term}
                className="w-full h-full object-cover rounded-md"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <div className="flex flex-col items-center justify-center px-1 gap-1">
                <span className="text-xs sm:text-sm md:text-base font-black text-center leading-tight text-gray-900">
                  {card.term}
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 text-center">
                  {card.translation}
                </span>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SignMasterMemoryPage() {
  const navigate = useNavigate();
  const { isMuted } = useAudio();

  const [phase, setPhase] = useState<"idle" | "playing" | "gameover" | "gameover_lose">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [misses, setMisses] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isReturningHome, setIsReturningHome] = useState(false);
  const [lastMatchAnim, setLastMatchAnim] = useState<string | null>(null);
  const [showMismatch, setShowMismatch] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewCounter, setPreviewCounter] = useState(3);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointsAddedRef = useRef(false);

  const cfg = DIFF_CONFIG[difficulty];

  // ── Timer ──────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Sounds ──────────────────────────────────────────────────────────────
  const playMatchSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch { /* noop */ }
  }, [isMuted]);

  const playMissSound = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } catch { /* noop */ }
  }, [isMuted]);

  const startGame = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    const newDeck = buildDeck(d);
    setDeck(newDeck);
    setFlippedUids([]);
    setMoves(0);
    setMisses(0);
    setMatchedPairs(0);
    setScore(0);
    setElapsed(0);
    setPhase("playing");
    pointsAddedRef.current = false;

    // Start 3s Preview Phase
    setIsPreviewing(true);
    setIsLocked(true);
    setPreviewCounter(3);

    const countInterval = setInterval(() => {
      setPreviewCounter((prev) => Math.max(0, prev - 1));
    }, 1000);

    setTimeout(() => {
      clearInterval(countInterval);
      setIsPreviewing(false);
      setIsLocked(false);
      startTimer();
    }, 3000);
  }, [difficulty, startTimer]);

  // ── Card Click ──────────────────────────────────────────────────────────
  const handleCardClick = useCallback((uid: string) => {
    setFlippedUids((prev) => {
      if (prev.includes(uid) || prev.length >= 2) return prev;
      return [...prev, uid];
    });
  }, []);

  // ── Watch flippedUids for match check ───────────────────────────────────
  useEffect(() => {
    if (flippedUids.length !== 2) return;

    setMoves((m) => m + 1);
    setIsLocked(true);

    const [uidA, uidB] = flippedUids;
    const cardA = deck.find((c) => c.uid === uidA);
    const cardB = deck.find((c) => c.uid === uidB);

    if (cardA && cardB && cardA.pairId === cardB.pairId) {
      // ✅ Match
      playMatchSound();
      setLastMatchAnim(cardA.pairId);
      setTimeout(() => setLastMatchAnim(null), 800);

      setDeck((prev) =>
        prev.map((c) =>
          c.uid === uidA || c.uid === uidB ? { ...c, status: "matched" } : c
        )
      );
      setFlippedUids([]);

      const newPairs = matchedPairs + 1;
      setMatchedPairs(newPairs);

      if (newPairs >= cfg.pairs) {
        // Game complete
        stopTimer();
        setIsLocked(true);
        setTimeout(() => {
          const finalScore = calcScore(cfg.bonusBase, misses, cfg.penalty);
          setScore(finalScore);
          setPhase("gameover");
        }, 3000);
      } else {
        setIsLocked(false);
      }
    } else {
      // ❌ Mismatch
      playMissSound();
      setShowMismatch(true);

      const newMisses = misses + 1;
      setMisses(newMisses);

      const maxMisses = cfg.maxMisses;
      if (newMisses >= maxMisses) {
        stopTimer();
        setIsLocked(true);
        // Show the mismatched cards briefly before going to the You Lose screen immediately
        setTimeout(() => {
          setPhase("gameover_lose");
        }, 800);
      } else {
        const delayMs = (cardA.type === "video" || cardB.type === "video") ? 2500 : 1200;

        setTimeout(() => {
          setDeck((prev) =>
            prev.map((c) =>
              c.uid === uidA || c.uid === uidB ? { ...c, status: "hidden" } : c
            )
          );
          setFlippedUids([]);
          setIsLocked(false);
          setShowMismatch(false);
        }, delayMs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flippedUids]);

  // ── Save points on game over ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "gameover" && !pointsAddedRef.current) {
      pointsAddedRef.current = true;
      if (auth.currentUser && score > 0) {
        addUserPoints(auth.currentUser.uid, score).catch(console.error);
      }
    }
  }, [phase, score]);

  // ── Back home ────────────────────────────────────────────────────────────
  const handleBackToHome = () => {
    stopTimer();
    setIsReturningHome(true);
    setTimeout(() => {
      navigate("/", { state: { view: "gamesetup" } });
    }, 3000);
  };

  // ─── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <div className="min-h-screen bg-surface font-body text-on-surface dot-grid relative overflow-x-hidden flex flex-col">

          {/* Floating Background Shapes */}
          <div className="absolute top-14 left-6 w-10 h-10 bg-primary-container rotate-12 neo-shadow opacity-30 rounded-lg -z-10 pointer-events-none" />
          <div className="absolute top-1/2 -right-6 w-16 h-16 bg-secondary-container rounded-full neo-shadow opacity-20 -z-10 pointer-events-none" />
          <div className="absolute bottom-14 left-1/4 w-8 h-8 bg-tertiary-container rotate-45 neo-shadow opacity-30 -z-10 pointer-events-none" />

          {/* Back button – absolute top-left, matching MatchAndSignPage */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
            <button
              onClick={handleBackToHome}
              className="neo-brutalism bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2 px-4 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center justify-center gap-2"
            >
              ← Back to Challenge
            </button>
          </div>

          <main className="max-w-2xl mx-auto px-4 pt-14 md:pt-20 pb-6 flex flex-col gap-4 flex-1 w-full">

            {/* Header */}
            <header className="text-center">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase italic text-primary mb-4 leading-none">
                SIGN MASTER<br />
                <span className="text-on-surface bg-secondary-container px-4 border-4 border-on-primary-fixed inline-block mt-2">
                  MEMORY
                </span>
              </h1>
              <p className="font-bold text-xl uppercase tracking-widest text-on-surface-variant">
                Level Up Your Visual Recall
              </p>
            </header>

            {/* How to Play – compact */}
            <section className="bg-surface-container-low border-4 border-on-primary-fixed rounded-xl p-3 neo-shadow">
              <h2 className="text-sm font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                <span className="bg-primary text-on-primary p-0.5 rounded-md">
                  <HelpCircle className="w-4 h-4" />
                </span>
                How to play
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { n: "01", text: "แตะเปิดการ์ดเพื่อดูคลิปวิดีโอท่าทาง หรือคำศัพท์ที่ซ่อนอยู่" },
                  { n: "02", text: "จดจำตำแหน่งของการ์ดแต่ละใบให้แม่นยำ ก่อนที่มันจะคว่ำลง" },
                  { n: "03", text: "จับคู่การ์ด 'วิดีโอภาษามือ' ให้ตรงกับ 'คำศัพท์' ที่มีความหมายเดียวกัน" },
                  { n: "04", text: "ใช้จำนวนครั้งให้น้อยและไวที่สุด เพื่อคว้าคะแนนระดับ Master!" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-2"> {/* เปลี่ยน items-center เป็น items-start เพราะข้อความยาวขึ้น */}
                    <div className="flex-shrink-0 w-6 h-6 bg-on-primary-fixed text-surface rounded-full flex items-center justify-center font-black text-[10px] mt-0.5">
                      {n}
                    </div>
                    <p className="font-bold text-[11px] leading-tight uppercase">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Difficulty Selection */}
            <section>
              <h2 className="text-lg font-black uppercase tracking-tight mb-3 text-center">SELECT DIFFICULTY</h2>
              <div className="grid grid-cols-3 gap-3">

                {/* Easy – Green */}
                <button
                  onClick={() => setDifficulty("easy")}
                  className={`border-4 border-on-primary-fixed py-6 px-4 rounded-xl transition-all flex flex-col items-center gap-1 font-black
        ${difficulty === "easy"
                      ? "bg-green-400 text-white neo-shadow-lg -translate-y-1 scale-105"
                      : "bg-green-100 text-green-900 neo-shadow hover:-translate-y-0.5"
                    }`}
                >
                  {/* ลบ fill ออก และเพิ่มความหนาเส้นนิดนึงให้เข้ากับฟอนต์ */}
                  <Smile className="w-8 h-8" strokeWidth={2.5} />
                  <span className="text-lg uppercase">EASY</span>
                  <div className="flex flex-col items-center opacity-90 text-[10px] sm:text-[11px] leading-tight mt-1">
                    <span>50 PTS | -5 PTS</span>
                    <span>ผิดได้ 5 ครั้ง</span>
                  </div>
                </button>

                {/* Medium – Yellow */}
                <button
                  onClick={() => setDifficulty("medium")}
                  className={`border-4 border-on-primary-fixed py-6 px-4 rounded-xl transition-all flex flex-col items-center gap-1 font-black
        ${difficulty === "medium"
                      ? "bg-yellow-400 text-white neo-shadow-lg -translate-y-1 scale-105"
                      : "bg-yellow-100 text-yellow-900 neo-shadow hover:-translate-y-0.5"
                    }`}
                >
                  <Meh className="w-8 h-8" strokeWidth={2.5} />
                  <span className="text-lg uppercase">MEDIUM</span>
                  <div className="flex flex-col items-center opacity-90 text-[10px] sm:text-[11px] leading-tight mt-1">
                    <span>100 PTS | -10 PTS</span>
                    <span>ผิดได้ 10 ครั้ง</span>
                  </div>
                </button>

                {/* Hard – Red */}
                <button
                  onClick={() => setDifficulty("hard")}
                  className={`border-4 border-on-primary-fixed py-6 px-4 rounded-xl transition-all flex flex-col items-center gap-1 font-black
        ${difficulty === "hard"
                      ? "bg-red-500 text-white neo-shadow-lg -translate-y-1 scale-105"
                      : "bg-red-100 text-red-900 neo-shadow hover:-translate-y-0.5"
                    }`}
                >
                  <Frown className="w-8 h-8" strokeWidth={2.5} />
                  <span className="text-lg uppercase">HARD</span>
                  <div className="flex flex-col items-center opacity-90 text-[10px] sm:text-[11px] leading-tight mt-1">
                    <span>200 PTS | -10 PTS</span>
                    <span>ผิดได้ 20 ครั้ง</span>
                  </div>
                </button>

              </div>
            </section>

            {/* Start Button */}
            <div className="flex justify-center">
              <button
                onClick={() => startGame(difficulty)}
                disabled={isReturningHome}
                className="bg-secondary-container text-on-secondary-container border-4 border-on-primary-fixed py-4 px-10 rounded-xl flex items-center justify-center gap-3 text-2xl font-black uppercase italic tracking-tighter neo-shadow-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
              >
                START GAME
                <Play className="w-7 h-7" fill="currentColor" />
              </button>
            </div>



          </main>

          {/* Bottom accent bar */}
          <div className="fixed bottom-0 left-0 w-full h-2 bg-on-primary-fixed z-50" />
        </div>
      </>
    );
  }

  // ─── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (phase === "gameover") {
    const efficiency = Math.max(0, 100 - Math.round(((moves - cfg.pairs) / cfg.pairs) * 100));
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 flex items-center justify-center min-h-screen bg-[hsl(44,95%,96%)] dark:bg-slate-900">
          <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-[2rem] p-10 text-center max-w-lg w-full flex flex-col gap-6">
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-foreground">
              You <span className="text-primary">Win!</span>
            </h2>

            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <div className="neo-brutalism bg-primary/10 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase text-muted-foreground mb-1">Score</span>
                <span className="text-3xl font-black text-primary">{score.toLocaleString()}</span>
              </div>
              <div className="neo-brutalism bg-secondary/10 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase text-muted-foreground mb-1">Moves</span>
                <span className="text-3xl font-black">{moves}</span>
              </div>
              <div className="neo-brutalism bg-green-100 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-xs font-black uppercase text-muted-foreground mb-1">Time</span>
                <span className="text-3xl font-black">{formatTime(elapsed)}</span>
              </div>
            </div>

            <div className="text-sm font-bold text-muted-foreground">
              Efficiency: <span className="text-foreground font-black">{efficiency}%</span>
              &nbsp;·&nbsp; Difficulty: <span className="text-foreground font-black">{DIFF_CONFIG[difficulty].label}</span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="neo-brutalism bg-primary text-white py-6 text-lg sm:text-xl font-black uppercase"
                  onClick={() => startGame(difficulty)}
                  disabled={isReturningHome}
                >
                  Play Again
                </Button>
                <Button
                  className="neo-brutalism bg-yellow-400 text-slate-900 py-6 text-lg sm:text-xl font-black uppercase"
                  onClick={() => setPhase("idle")}
                  disabled={isReturningHome}
                >
                  Choose Level
                </Button>
              </div>
              <Button
                className="neo-brutalism bg-surface text-black py-6 text-xl font-black uppercase"
                onClick={handleBackToHome}
                disabled={isReturningHome}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── GAME OVER (LOSE) SCREEN ───────────────────────────────────────────────
  if (phase === "gameover_lose") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <div className="min-h-screen bg-[hsl(44,95%,96%)] dark:bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Floating Background Shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-400 rotate-12 neo-shadow opacity-20 rounded-lg -z-10 pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-400 rounded-full neo-shadow opacity-20 -z-10 pointer-events-none" />

          <div className="bg-white dark:bg-slate-800 border-4 border-black p-8 md:p-12 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-lg w-full flex flex-col items-center z-10">
            {/* 🚨 ลบ fill ออก และใส่ strokeWidth แทน เพื่อให้ไอคอนดูหนาและชัดเจนขึ้น */}
            <Frown className="text-red-500 w-24 h-24 mb-4 drop-shadow-md" strokeWidth={2.5} />

            <h1 className="text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-red-600 mb-2">
              YOU LOSE
            </h1>
            <div className="bg-red-100 border-2 border-red-500 px-6 py-2 rounded-full mb-8">
              <p className="font-bold text-xl uppercase tracking-widest text-red-900">
                Out of moves
              </p>
            </div>

            <button
              onClick={() => setPhase("idle")}
              className="w-full neo-brutalism bg-primary text-white border-4 border-black text-xl md:text-2xl font-black py-4 px-6 rounded-xl hover:-translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase flex justify-center items-center gap-2"
            >
              <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
              TRY AGAIN
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── PLAYING SCREEN ────────────────────────────────────────────────────────
  const gridRows = Math.ceil(deck.length / cfg.cols);
  // Let each mode use its actual column count (Easy=3, Medium=4, Hard=6) to independently scale to the largest possible size
  const effectiveCols = cfg.cols;

  return (
    <>
      {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
      <main className="h-screen overflow-hidden flex flex-col items-center bg-[hsl(44,95%,96%)] dark:bg-slate-900 relative">

        {/* Preview Overlay */}
        {isPreviewing && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="flex flex-col items-center animate-bounce mt-[-10vh]">
              <span className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-primary drop-shadow-lg">
                ให้เวลาจำ!
              </span>
              <span className="mt-4 text-5xl md:text-7xl font-black text-slate-800 dark:text-white drop-shadow-lg">
                {previewCounter} วินาที
              </span>
            </div>
          </div>
        )}

        {/* HUD Header */}
        <header className="w-full p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-black bg-white dark:bg-slate-800 shrink-0 z-10">
          <button
            onClick={() => setPhase("idle")}
            className="flex items-center gap-2 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide uppercase">Exit</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center bg-primary px-4 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
              <span className="text-sm font-semibold uppercase opacity-90 mr-2">Score</span>
              <span className="text-2xl font-black">{calcScore(cfg.bonusBase, misses, cfg.penalty).toLocaleString()}</span>
            </div>

            <div className="flex items-center bg-secondary-container px-4 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-on-secondary-container">
              <span className="text-sm font-semibold uppercase opacity-90 mr-2">Time</span>
              <span className="text-2xl font-black tabular-nums">{formatTime(elapsed)}</span>
            </div>

            <div className="flex items-center bg-tertiary-container px-4 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-on-tertiary-container">
              <span className="text-sm font-semibold uppercase opacity-90 mr-2">Mistakes Left</span>
              <span className="text-2xl font-black tabular-nums">{Math.max(0, cfg.maxMisses - misses)}</span>
            </div>
          </div>
        </header>

        {/* Card Grid Area */}
        <div className="w-full flex-1 min-h-0 flex items-center justify-center p-2 md:p-4 overflow-hidden">
          <div
            style={{
              display: "grid",
              // Use max(cols, 6) baseline for width, but adapt vertical deduction (280px) to clear the tall header cleanly!
              gridTemplateColumns: `repeat(${cfg.cols}, min(
                calc((min(100vw, 64rem) - ${effectiveCols - 1} * clamp(4px,1vw,10px)) / ${effectiveCols}),
                calc((100dvh - 280px) / ${gridRows} - clamp(4px,1vw,10px))
              ))`,
              gridAutoRows: `min(
                calc((min(100vw, 64rem) - ${effectiveCols - 1} * clamp(4px,1vw,10px)) / ${effectiveCols}),
                calc((100dvh - 280px) / ${gridRows} - clamp(4px,1vw,10px))
              )`,
              gap: "clamp(4px, 1vw, 10px)",
            }}
          >
            {deck.map((card) => {
              const isFlipping = isPreviewing || flippedUids.includes(card.uid);
              const isMatchGlowing = lastMatchAnim === card.pairId;
              return (
                <div
                  key={card.uid}
                  className={`transition-all duration-300 ${isMatchGlowing ? "scale-105" : ""}`}
                >
                  <MemoryCardTile
                    card={card}
                    isFlipping={isFlipping}
                    onClick={handleCardClick}
                    isLocked={isLocked && card.status === "hidden"}
                    isMatchGlowing={isMatchGlowing}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </>
  );
}
