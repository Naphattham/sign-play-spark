import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Zap, Smile, Meh, Frown, RotateCcw, ArrowLeft, Trophy, Swords, Eye, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { useAudio } from "@/contexts/AudioContext";
import heartIcon from "../asset/image/monster/heart.webp";

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
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewCounter, setPreviewCounter] = useState(5);
  const [showExitModal, setShowExitModal] = useState(false);

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

  const startPreviewCountdown = useCallback(() => {
    setIsPreviewReady(false);
    setIsPreviewing(true);
    setPreviewCounter(5);

    const countInterval = setInterval(() => {
      setPreviewCounter((prev) => Math.max(0, prev - 1));
    }, 1000);

    setTimeout(() => {
      clearInterval(countInterval);
      setIsPreviewing(false);
      setIsLocked(false);
      startTimer();
    }, 5000);
  }, [startTimer]);

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

    // Start Ready Phase
    setIsPreviewReady(true);
    setIsPreviewing(false);
    setIsLocked(true);
    setPreviewCounter(5);
  }, [difficulty]);

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
        <main className="min-h-screen text-foreground relative p-3 sm:p-4 md:p-8 flex flex-col items-center overflow-hidden sd-gradient-bg">
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.35) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute top-[8%] right-[12%] opacity-[0.07] pointer-events-none sd-float hidden sm:block"><Eye size={90} strokeWidth={1.5} /></div>
          <div className="absolute bottom-[12%] left-[6%] opacity-[0.07] pointer-events-none sd-float-delay hidden sm:block"><Star size={70} strokeWidth={1.5} /></div>

          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
            <button onClick={handleBackToHome}
              className="bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2.5 px-5 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center gap-2 border-[3px] border-black active:translate-y-0"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col items-center w-full relative z-10">
            <div className="text-center mb-4 sm:mb-6 md:mb-8 mt-14 md:mt-0 sd-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/30 rounded-full px-3 sm:px-4 py-1 mb-3 sm:mb-4">
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary">Memory Mode</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-1 sd-title-glitch">Sign Master</h1>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-primary sd-title-glitch">Memory</h1>
              <div className="h-1.5 bg-foreground w-16 mx-auto mt-4 rounded-full border-[2px] border-black" style={{ boxShadow: "2px 2px 0 0 #000" }} />
              <p className="mt-4 font-bold text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
                จับคู่การ์ดวิดีโอภาษามือกับคำศัพท์ที่ถูกต้อง!
              </p>
            </div>

            <div className="flex flex-col gap-4 md:gap-5 w-full items-stretch">
              {/* How to Play */}
              <div className="sd-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full flex flex-col text-sm border-[3px] border-black"
                  style={{ boxShadow: "6px 6px 0px 0px #000" }}>
                  <h2 className="text-lg md:text-xl font-black uppercase mb-4 border-b-[3px] border-foreground pb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> How to Play
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: <Eye className="w-4 h-4" />, text: "แตะเปิดการ์ดเพื่อดูวิดีโอหรือคำศัพท์" },
                      { icon: <Star className="w-4 h-4" />, text: "จดจำตำแหน่งของการ์ดแต่ละใบ" },
                      { icon: <Zap className="w-4 h-4" />, text: "จับคู่วิดีโอกับคำศัพท์ที่ตรงกัน" },
                      { icon: <Trophy className="w-4 h-4" />, text: "ใช้ครั้งน้อยที่สุดเพื่อคะแนนสูงสุด!" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start group">
                        <span className="bg-primary text-white font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 border-[2px] border-black transition-transform group-hover:scale-110"
                          style={{ boxShadow: "2px 2px 0 0 #000" }}>{item.icon}</span>
                        <p className="pt-1.5 text-sm font-bold">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="sd-slide-up" style={{ animationDelay: "0.15s" }}>
                <div className="relative flex bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 w-full border-[3px] border-black"
                  style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                  <div className="absolute top-2 bottom-2 left-2 rounded-xl transition-all duration-300 ease-out border-[2px] border-black"
                    style={{
                      width: 'calc((100% - 16px) / 3)',
                      transform: `translateX(calc(${difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2} * 100%))`,
                      background: difficulty === 'easy' ? 'hsl(142 70% 49%)' : difficulty === 'medium' ? 'hsl(44 100% 60%)' : 'hsl(0 84% 60%)',
                      boxShadow: "2px 2px 0px 0px rgba(0,0,0,1)",
                    }}
                  />
                  {(["easy", "medium", "hard"] as const).map((m) => (
                    <button key={m} onClick={() => setDifficulty(m)}
                      className={`relative z-10 flex-1 flex flex-col items-center justify-center py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black uppercase text-xs sm:text-sm tracking-tight transition-colors duration-300 gap-0.5 ${
                        difficulty === m ? 'text-white' : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      <span className="flex items-center gap-1">
                        {m === 'easy' && <Smile className="w-4 h-4" />}
                        {m === 'medium' && <Meh className="w-4 h-4" />}
                        {m === 'hard' && <Frown className="w-4 h-4" />}
                        {m.toUpperCase()}
                      </span>
                      <span className="text-[9px] sm:text-[10px] opacity-80">
                        {m === 'easy' ? '50 PTS · ผิดได้ 5 ครั้ง' : m === 'medium' ? '100 PTS · ผิดได้ 10 ครั้ง' : '200 PTS · ผิดได้ 20 ครั้ง'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="sd-slide-up" style={{ animationDelay: "0.2s" }}>
                <button onClick={() => startGame(difficulty)} disabled={isReturningHome}
                  className="bg-primary text-white text-base sm:text-lg md:text-xl font-black py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all uppercase w-full border-[3px] border-black hover:-translate-y-1 hover:brightness-110 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                  <Swords className="w-5 h-5" /> START GAME
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── GAME OVER SCREEN ──────────────────────────────────────────────────────
  if (phase === "gameover") {
    const efficiency = Math.max(0, 100 - Math.round(((moves - cfg.pairs) / cfg.pairs) * 100));
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen flex flex-col relative overflow-hidden sd-gradient-bg">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.4) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute top-[10%] left-[8%] opacity-10 pointer-events-none sd-float"><Eye size={80} strokeWidth={1.5} /></div>
          <div className="absolute bottom-[15%] right-[10%] opacity-10 pointer-events-none sd-float-delay"><Star size={60} strokeWidth={1.5} /></div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="sd-slide-up bg-white dark:bg-slate-800 border-[3px] md:border-[4px] border-black rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center w-full max-w-md z-10 relative"
              style={{ boxShadow: "6px 6px 0px 0px #000" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-400 border-[3px] border-black px-5 py-1.5 rounded-full"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <p className="font-black uppercase text-xs tracking-widest text-black">{DIFF_CONFIG[difficulty].label}</p>
              </div>
              <div className="mx-auto mb-3 md:mb-4 mt-2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-6 text-foreground whitespace-nowrap sd-title-glitch">
                YOU <span className="text-primary">WIN!</span>
              </h2>

              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                {[
                  { label: "Score", value: score.toLocaleString(), bg: "bg-primary/10" },
                  { label: "Moves", value: moves, bg: "bg-secondary/20" },
                  { label: "Time", value: formatTime(elapsed), bg: "bg-green-100" },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} border-[3px] border-black rounded-xl p-3 flex flex-col items-center`}
                    style={{ boxShadow: "3px 3px 0 0 #000" }}>
                    <span className="text-[10px] font-black uppercase text-foreground/50 mb-0.5">{s.label}</span>
                    <span className="text-xl md:text-2xl font-black text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-bold text-muted-foreground mb-5">
                Efficiency: <span className="text-foreground font-black">{efficiency}%</span>
              </p>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button disabled={isReturningHome} onClick={() => startGame(difficulty)}
                    className="bg-primary text-white font-black uppercase text-sm md:text-base py-3 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                    <Swords className="w-4 h-4" /> PLAY AGAIN
                  </button>
                  <button disabled={isReturningHome} onClick={() => setPhase("idle")}
                    className="bg-yellow-300 text-black font-black uppercase text-sm md:text-base py-3 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                    CHOOSE LEVEL
                  </button>
                </div>
                <button disabled={isReturningHome} onClick={handleBackToHome}
                  className="bg-white dark:bg-slate-700 text-foreground font-black uppercase text-sm md:text-base py-3 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                  <ArrowLeft className="w-4 h-4" /> BACK TO CHALLENGE
                </button>
              </div>
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
        <main className="min-h-screen flex flex-col relative overflow-hidden sd-gradient-bg">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.4) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute top-[10%] right-[10%] opacity-10 pointer-events-none sd-float"><Frown size={80} strokeWidth={1.5} /></div>
          <div className="absolute bottom-[15%] left-[8%] opacity-10 pointer-events-none sd-float-delay"><Eye size={60} strokeWidth={1.5} /></div>

          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="sd-slide-up bg-white dark:bg-slate-800 border-[3px] md:border-[4px] border-black rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center w-full max-w-md z-10 relative"
              style={{ boxShadow: "6px 6px 0px 0px #000" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-400 border-[3px] border-black px-5 py-1.5 rounded-full"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <p className="font-black uppercase text-xs tracking-widest text-white">OUT OF MOVES</p>
              </div>
              <div className="mx-auto mb-3 md:mb-4 mt-2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-rose-500 border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Frown className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-foreground whitespace-nowrap sd-title-glitch">
                YOU <span className="text-rose-500">LOSE</span>
              </h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => setPhase("idle")}
                  className="bg-primary text-white font-black uppercase text-lg md:text-xl py-4 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                  <RotateCcw className="w-5 h-5" strokeWidth={2.5} /> TRY AGAIN
                </button>
                <button onClick={handleBackToHome} disabled={isReturningHome}
                  className="bg-white dark:bg-slate-700 text-foreground font-black uppercase text-sm md:text-base py-3 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                  <ArrowLeft className="w-4 h-4" /> BACK TO CHALLENGE
                </button>
              </div>
            </div>
          </div>
        </main>
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
      <main className="h-screen overflow-hidden flex flex-col items-center sd-gradient-bg relative">

        {/* Ready Modal */}
        {isPreviewReady && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl border-[4px] border-black p-6 text-center sd-slide-up"
              style={{ boxShadow: "8px 8px 0px 0px #000" }}>
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-400 border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Eye className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-foreground">เตรียมตัว!</h2>
              <p className="font-bold text-muted-foreground mb-6 text-sm">
                คุณมีเวลาจำ <span className="text-2xl font-black text-red-500">5</span> วินาที
              </p>
              <button onClick={startPreviewCountdown}
                className="w-full bg-green-400 text-white font-black uppercase text-xl py-3.5 rounded-xl border-[3px] border-black hover:-translate-y-1 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                <Swords className="w-5 h-5" /> READY
              </button>
            </div>
          </div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl border-[4px] border-black p-6 text-center sd-slide-up"
              style={{ boxShadow: "8px 8px 0px 0px #000" }}>
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-yellow-300 border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Pause className="w-7 h-7 text-black" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-foreground">เกมยังไม่จบ</h2>
              <p className="font-bold text-muted-foreground mb-6 text-sm">
                ต้องการจะออกใช่ไหม?<br /><span className="text-rose-500">หากออกจะไม่ได้รับคะแนนใดๆ ทั้งสิ้น</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(false)}
                  className="flex-1 bg-white dark:bg-slate-700 text-foreground font-black uppercase py-3 rounded-xl border-[3px] border-black hover:-translate-y-1 transition-all"
                  style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                  ยกเลิก
                </button>
                <button onClick={() => { setShowExitModal(false); setPhase("idle"); }}
                  className="flex-1 bg-rose-500 text-white font-black uppercase py-3 rounded-xl border-[3px] border-black hover:-translate-y-1 transition-all"
                  style={{ boxShadow: "4px 4px 0px 0px #000" }}>
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUD Header */}
        <header className="w-full px-3 md:px-6 py-3 md:py-4 flex flex-row justify-between items-center pointer-events-none gap-2 md:gap-4 shrink-0 z-10">
          <button onClick={() => setShowExitModal(true)}
            className="pointer-events-auto shrink-0 bg-white dark:bg-slate-800 border-[3px] border-black px-3 md:px-5 py-2 rounded-2xl flex items-center justify-center gap-1.5 md:gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            style={{ boxShadow: "4px 4px 0px 0px #000" }}>
            <Pause className="w-5 h-5 text-black" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-sm md:text-base text-black hidden sm:inline">EXIT</span>
          </button>

          <div className="pointer-events-auto flex flex-row flex-wrap justify-end items-center gap-2 md:gap-3">
            {/* Score */}
            <div className="bg-primary text-white border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center gap-1.5"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <Star className="w-3.5 h-3.5 text-yellow-200" />
              <p className="font-black uppercase text-sm md:text-base tracking-tighter">{calcScore(cfg.bonusBase, misses, cfg.penalty)}</p>
            </div>
            {/* Time */}
            <div className="bg-yellow-300 border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center gap-1.5"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
              <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter tabular-nums">{formatTime(elapsed)}</p>
            </div>
            {/* Mistakes Left */}
            <div className="bg-white border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <div className="flex items-center gap-1 md:gap-1.5">
                <img src={heartIcon} alt="Heart" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter">
                  {Math.max(0, cfg.maxMisses - misses)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Card Grid Area */}
        <div className="w-full flex-1 min-h-0 flex items-center justify-center p-2 md:p-4 overflow-hidden relative">

          {isPreviewing && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-40 pointer-events-none animate-pulse ${difficulty === "hard" ? "left-10 md:left-16" : "left-10 md:left-24"}`}>
              <span
                className="text-[6rem] md:text-[12rem] font-black text-red-500 leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
              >
                {previewCounter}
              </span>
            </div>
          )}

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
