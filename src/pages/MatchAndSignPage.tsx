import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";
import { getVideoUrl } from "@/lib/categories";
import { HLSVideoPlayer } from "@/components/HLSVideoPlayer";

// A small helper to shuffle arrays
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const ALL_QUESTIONS = [
  { term: "สวัสดีผู้ใหญ่", translation: "Hello (Adult)", correct: getVideoUrl("general", "สวัสดี (ผู้ใหญ่)") },
  { term: "สวัสดีเพื่อน", translation: "Hello (Friend)", correct: getVideoUrl("general", "สวัสดี (เพื่อน)") },
  { term: "สบายดีไหม", translation: "How are you?", correct: getVideoUrl("general", "สบายดีไหม") },
  { term: "สบายดี", translation: "I'm fine", correct: getVideoUrl("general", "สบายดี") },
  { term: "ไม่สบายใจ", translation: "Unhappy", correct: getVideoUrl("general", "ไม่สบายใจ") },
  { term: "กินข้าวหรือยัง", translation: "Have you eaten?", correct: getVideoUrl("general", "กินข้าวแล้วหรือยัง") },
  { term: "กินแล้ว", translation: "Already ate", correct: getVideoUrl("general", "กินแล้ว") },
  { term: "ยังไม่ได้กิน", translation: "Not yet eaten", correct: getVideoUrl("general", "ยังไม่ได้กิน") },
  { term: "ลาก่อน", translation: "Goodbye", correct: getVideoUrl("general", "ลาก่อน") },
  { term: "กลัว", translation: "Scared", correct: getVideoUrl("emotions", "กลัว") },
  { term: "รัก", translation: "Love", correct: getVideoUrl("emotions", "รัก") },
  { term: "เหนื่อย", translation: "Tired", correct: getVideoUrl("emotions", "เหนื่อย") },
  { term: "โกรธ", translation: "Angry", correct: getVideoUrl("emotions", "โกรธ") },
  { term: "ทำไม", translation: "Why?", correct: getVideoUrl("qa", "ทำไม") },
  { term: "อะไร", translation: "What?", correct: getVideoUrl("qa", "อะไร") },
  { term: "เท่าไหร่", translation: "How much?", correct: getVideoUrl("qa", "เท่าไหร่") },
  { term: "ใช่", translation: "Yes", correct: getVideoUrl("qa", "ใช่") },
  { term: "ไม่", translation: "No", correct: getVideoUrl("qa", "ไม่") },
  { term: "ปวดท้อง", translation: "Stomachache", correct: getVideoUrl("illness", "ปวดท้อง") },
  { term: "ปวดหัว", translation: "Headache", correct: getVideoUrl("illness", "ปวดหัว") },
  { term: "เจ็บคอ", translation: "Sore throat", correct: getVideoUrl("illness", "เจ็บคอ") },
  { term: "เป็นหวัด", translation: "Cold", correct: getVideoUrl("illness", "เป็นหวัด") },
  { term: "เป็นไข้", translation: "Fever", correct: getVideoUrl("illness", "เป็นไข้") }
];

const ALL_VIDEOS = ALL_QUESTIONS.map(q => q.correct);

export default function MatchAndSignPage() {
  const navigate = useNavigate();
  const [currentQuestions, setCurrentQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "gameover">("idle");
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isReturningHome, setIsReturningHome] = useState(false);

  const pointsAddedRef = useRef(false);
  // Stable refs so timer callbacks don't close over stale state
  const questionsRef = useRef<typeof ALL_QUESTIONS>([]);
  const roundIndexRef = useRef(0);

  /**
   * Advance to the next question (or end the game).
   */
  const advanceRound = useCallback(() => {
    const nextIndex = roundIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      roundIndexRef.current = nextIndex;
      setCurrentRoundIndex(nextIndex);
    } else {
      setPhase("gameover");
    }
  }, []);

  // Keep refs in sync with state (for the timer callbacks)
  useEffect(() => {
    roundIndexRef.current = currentRoundIndex;
  }, [currentRoundIndex]);

  useEffect(() => {
    questionsRef.current = currentQuestions;
  }, [currentQuestions]);

  /** Reset everything and begin a new game */
  const startGame = useCallback(() => {
    const questions = shuffleArray(ALL_QUESTIONS).slice(0, 5);
    questionsRef.current = questions;
    roundIndexRef.current = 0;

    setCurrentQuestions(questions);
    setCurrentRoundIndex(0);
    setScore(0);
    setPhase("playing");
    setSelectedOption(null);
    setIsCorrect(null);
    pointsAddedRef.current = false;
  }, []);

  // Boot the game once on mount
  useEffect(() => {
    // Game is started manually from the idle screen now
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the round index changes, set up new options and start timer
  useEffect(() => {
    if (
      currentQuestions.length === 0 ||
      currentRoundIndex >= currentQuestions.length ||
      phase === "gameover"
    ) return;

    const q = currentQuestions[currentRoundIndex];
    const wrongVids = ALL_VIDEOS.filter(v => v !== q.correct);
    const shuffledWrong = shuffleArray(wrongVids).slice(0, 3);
    setOptions(shuffleArray([q.correct, ...shuffledWrong]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundIndex, currentQuestions]);

  // Save points when game ends
  useEffect(() => {
    if (phase === "gameover" && !pointsAddedRef.current) {
      pointsAddedRef.current = true;
      if (auth.currentUser && score > 0) {
        addUserPoints(auth.currentUser.uid, score).catch(console.error);
      }
    }
  }, [phase, score]);

  const handleSelectOption = (videoUrl: string) => {
    if (selectedOption !== null) return;

    const q = currentQuestions[currentRoundIndex];
    setSelectedOption(videoUrl);

    if (videoUrl === q.correct) {
      setIsCorrect(true);
      setScore(prev => prev + 10);
    } else {
      setIsCorrect(false);
    }

    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrect(null);
      advanceRound();
    }, 1500);
  };

  const handleSkip = () => {
    if (selectedOption !== null) return;
    setSelectedOption("SKIP");
    setIsCorrect(false);
    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrect(null);
      advanceRound();
    }, 1500);
  };

  const handleBackToHome = () => {
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
        <main className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 text-foreground relative p-4 md:p-8 flex flex-col items-center">
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
            <div className="text-center mb-8 mt-12 md:mt-24">
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-2 whitespace-nowrap">
                Match & <span className="text-primary">Sign</span>
              </h1>
              <div className="h-2 bg-foreground w-20 mx-auto mt-4 rounded-full neo-brutalism-sm"></div>
              <p className="mt-4 font-bold text-base text-muted-foreground">อ่านคำศัพท์ภาษาไทยแล้วเลือกวิดีโอภาษามือที่ถูกต้อง!</p>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col gap-6 w-full max-w-[400px] mx-auto items-stretch justify-center">

              {/* How to Play Card */}
              <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-6 w-full flex flex-col text-sm">
                <h2 className="text-2xl font-black uppercase mb-4 border-b-[3px] border-foreground pb-2">How to Play</h2>
                <ul className="space-y-4 flex-grow flex flex-col justify-center font-bold text-base">
                   <li className="flex items-start">
                    <span className="neo-brutalism bg-primary text-white font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-sm">01</span>
                    <p className="pt-1">อ่านคำศัพท์ภาษาไทยจากโจทย์</p>
                  </li>
                  <li className="flex items-start">
                    <span className="neo-brutalism bg-primary text-white font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-sm">02</span>
                    <p className="pt-1">เลือกวิดีโอภาษามือที่ตรงกับคำศัพท์</p>
                  </li>
                  <li className="flex items-start">
                    <span className="neo-brutalism bg-primary text-white font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-sm">03</span>
                    <div className="pt-1">
                      <p>ตอบถูกได้ +10 คะแนน</p>
                    </div>
                  </li>
                  <li className="flex items-start pt-4 border-t-[3px] border-foreground">
                    <span className="neo-brutalism bg-secondary text-foreground font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 mr-3 text-sm">
                      ★
                    </span>
                    <p className="pt-1">เล่นจนครบเพื่อสะสมคะแนน!</p>
                  </li>
                </ul>
              </div>

              {/* Start Section */}
              <div className="w-full flex flex-col gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="neo-brutalism bg-primary text-white text-2xl font-black py-4 px-6 rounded-xl transition-all uppercase w-full hover:-translate-y-1 hover:brightness-110 active:translate-y-1"
                >
                  START GAME
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (phase === "gameover") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 flex items-center justify-center min-h-screen bg-[#f8f9fa] dark:bg-slate-900">
        <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-[2rem] p-12 text-center max-w-lg w-full">
          <h2 className="text-4xl sm:text-6xl font-black uppercase mb-4 tracking-tighter text-primary">Game Over</h2>
          <p className="text-2xl font-bold mb-8">Score: {score} / {currentQuestions.length * 10}</p>
          <div className="flex flex-col gap-4">
            <Button
              className="neo-brutalism bg-primary text-white py-6 text-xl font-black uppercase"
              onClick={startGame}
              disabled={isReturningHome}
            >
              Play Again
            </Button>
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

  const currentQ = currentQuestions[currentRoundIndex];
  if (!currentQ) return null;

  return (
    <>
      {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] dark:bg-slate-900">

      {/* Top Bar with Timer and Score */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4">
        <div className="flex-1 flex justify-start">
          <button
            onClick={handleBackToHome}
            disabled={isReturningHome}
            className="neo-brutalism bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2 px-4 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            ← <span className="hidden sm:inline">EXIT</span>
          </button>
        </div>
        <div className="text-xl sm:text-2xl font-black uppercase text-center flex-shrink-0 px-2">
          Question {currentRoundIndex + 1} / {currentQuestions.length}
        </div>
        <div className="flex-1 flex justify-end">
          <div className="neo-brutalism bg-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 font-black text-lg sm:text-xl text-primary">
            <span className="material-symbols-outlined">stars</span>
            {score}
          </div>
        </div>
      </div>

      {/* Thai Word Display (The Question) */}
      <div className="w-full max-w-2xl mb-8">
        <div className="relative">
          {/* Decorative back layers for Pop-Brutalism feel */}
          <div className="absolute inset-0 bg-black rounded-[2rem] translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3"></div>
          <div className="relative bg-primary text-white border-4 border-black rounded-[2rem] p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute top-4 left-6 opacity-20 transform -rotate-12">
              <span className="material-symbols-outlined text-6xl" data-icon="format_quote">format_quote</span>
            </div>

            <h3 className="text-5xl sm:text-7xl md:text-8xl font-black mb-2 tracking-tighter">{currentQ?.term}</h3>
            <p className="text-lg sm:text-xl md:text-2xl font-bold opacity-90 uppercase tracking-[0.2em]">{currentQ?.translation}</p>

            <div className="absolute bottom-4 right-6 bg-secondary text-white border-2 border-black px-4 py-1 rounded-full font-black text-sm rotate-6">
              Match It!
            </div>
          </div>
        </div>
      </div>

      {/* Hand Sign Grid (The Options) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl px-4">
        {options.map((opt, i) => {

          let buttonClass = "bg-white dark:bg-slate-800";
          if (selectedOption !== null) {
            if (opt === currentQ?.correct) {
              buttonClass = "bg-green-400 border-green-600 scale-105";
            } else if (opt === selectedOption && !isCorrect) {
              buttonClass = "bg-red-400 border-red-600 opacity-80 scale-95";
            } else {
              buttonClass = "bg-white dark:bg-slate-800 opacity-50";
            }
          }

          return (
            <button
              key={i}
              disabled={selectedOption !== null}
              onClick={() => handleSelectOption(opt)}
              className={`group relative flex flex-col neo-brutalism rounded-2xl overflow-hidden transition-all duration-300 transform ${buttonClass} ${selectedOption === null ? 'hover:translate-x-[-2px] hover:translate-y-[-2px]' : ''}`}
            >
              <div className="aspect-square w-full bg-black/5 flex items-center justify-center relative overflow-hidden">
                <HLSVideoPlayer
                  src={encodeURI(opt)}
                  lazyLoad={false}
                  loop={true}
                  muted={true}
                  showControls={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                />

                {selectedOption !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-20 transition-opacity">
                    {opt === currentQ?.correct && (
                      <span className="material-symbols-outlined text-5xl sm:text-6xl text-green-500 bg-white rounded-full drop-shadow-md p-2">check_circle</span>
                    )}
                    {opt === selectedOption && !isCorrect && (
                      <span className="material-symbols-outlined text-5xl sm:text-6xl text-red-500 bg-white rounded-full drop-shadow-md p-2">cancel</span>
                    )}
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3 bg-black text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white flex items-center justify-center font-black text-sm sm:text-base z-10">
                {i + 1}
              </div>
              <div className="p-3 border-t-4 border-black text-center font-black uppercase text-sm sm:text-base bg-white dark:bg-slate-800">
                Select
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 flex items-center gap-6">
        <button
          disabled={selectedOption !== null}
          onClick={handleSkip}
          className={`neo-brutalism bg-white border-4 border-black px-6 py-3 rounded-xl font-black text-base transition-all flex items-center gap-2 ${selectedOption !== null ? 'opacity-50 cursor-not-allowed' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
        >
          <span className="material-symbols-outlined" data-icon="skip_next">skip_next</span>
          SKIP WORD
        </button>
      </div>
    </main>
    </>
  );
}
