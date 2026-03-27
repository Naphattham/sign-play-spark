import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";
import { getVideoUrl } from "@/lib/categories";
import { HLSVideoPlayer } from "@/components/HLSVideoPlayer";

// Small helper to shuffle arrays
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const ALL_QUESTIONS = [
  { term: "สวัสดีผู้ใหญ่",  translation: "Hello (Adult)",   videoUrl: getVideoUrl("general", "สวัสดี (ผู้ใหญ่)") },
  { term: "สวัสดีเพื่อน",   translation: "Hello (Friend)",  videoUrl: getVideoUrl("general", "สวัสดี (เพื่อน)") },
  { term: "สบายดีไหม",      translation: "How are you?",    videoUrl: getVideoUrl("general", "สบายดีไหม") },
  { term: "สบายดี",          translation: "I'm fine",        videoUrl: getVideoUrl("general", "สบายดี") },
  { term: "ไม่สบายใจ",      translation: "Unhappy",          videoUrl: getVideoUrl("general", "ไม่สบายใจ") },
  { term: "กินข้าวหรือยัง", translation: "Have you eaten?", videoUrl: getVideoUrl("general", "กินข้าวแล้วหรือยัง") },
  { term: "กินแล้ว",         translation: "Already ate",     videoUrl: getVideoUrl("general", "กินแล้ว") },
  { term: "ยังไม่ได้กิน",   translation: "Not yet eaten",   videoUrl: getVideoUrl("general", "ยังไม่ได้กิน") },
  { term: "ลาก่อน",          translation: "Goodbye",          videoUrl: getVideoUrl("general", "ลาก่อน") },
  { term: "กลัว",             translation: "Scared",           videoUrl: getVideoUrl("emotions", "กลัว") },
  { term: "รัก",              translation: "Love",             videoUrl: getVideoUrl("emotions", "รัก") },
  { term: "เหนื่อย",         translation: "Tired",            videoUrl: getVideoUrl("emotions", "เหนื่อย") },
  { term: "โกรธ",             translation: "Angry",            videoUrl: getVideoUrl("emotions", "โกรธ") },
  { term: "ทำไม",             translation: "Why?",             videoUrl: getVideoUrl("qa", "ทำไม") },
  { term: "อะไร",             translation: "What?",            videoUrl: getVideoUrl("qa", "อะไร") },
  { term: "เท่าไหร่",        translation: "How much?",       videoUrl: getVideoUrl("qa", "เท่าไหร่") },
  { term: "ใช่",              translation: "Yes",              videoUrl: getVideoUrl("qa", "ใช่") },
  { term: "ไม่",              translation: "No",               videoUrl: getVideoUrl("qa", "ไม่") },
  { term: "ปวดท้อง",         translation: "Stomachache",      videoUrl: getVideoUrl("illness", "ปวดท้อง") },
  { term: "ปวดหัว",           translation: "Headache",         videoUrl: getVideoUrl("illness", "ปวดหัว") },
  { term: "เจ็บคอ",           translation: "Sore throat",      videoUrl: getVideoUrl("illness", "เจ็บคอ") },
  { term: "เป็นหวัด",        translation: "Cold",             videoUrl: getVideoUrl("illness", "เป็นหวัด") },
  { term: "เป็นไข้",         translation: "Fever",            videoUrl: getVideoUrl("illness", "เป็นไข้") },
];

const ALL_TERMS = ALL_QUESTIONS.map((q) => q.term);

export default function SignAndMatchPage() {
  const navigate = useNavigate();

  const [currentQuestions, setCurrentQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [options, setOptions] = useState<string[]>([]); // four Thai term choices
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isReturningHome, setIsReturningHome] = useState(false);

  const pointsAddedRef = useRef(false);
  const questionsRef = useRef<typeof ALL_QUESTIONS>([]);
  const roundIndexRef = useRef(0);

  // ── Game helpers ──────────────────────────────────────────────────────────

  const advanceRound = useCallback(() => {
    const nextIndex = roundIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      roundIndexRef.current = nextIndex;
      setCurrentRoundIndex(nextIndex);
    } else {
      setIsGameOver(true);
    }
  }, []);

  // Keep refs in sync
  useEffect(() => { roundIndexRef.current = currentRoundIndex; }, [currentRoundIndex]);
  useEffect(() => { questionsRef.current = currentQuestions; }, [currentQuestions]);

  // ── Game control ───────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const questions = shuffleArray(ALL_QUESTIONS).slice(0, 5);
    questionsRef.current = questions;
    roundIndexRef.current = 0;

    setCurrentQuestions(questions);
    setCurrentRoundIndex(0);
    setScore(0);
    setIsGameOver(false);
    setSelectedOption(null);
    setIsCorrect(null);
    pointsAddedRef.current = false;
  }, []);

  // Boot
  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New round → build 4 word-choices and restart timer
  useEffect(() => {
    if (
      currentQuestions.length === 0 ||
      currentRoundIndex >= currentQuestions.length ||
      isGameOver
    ) return;

    const q = currentQuestions[currentRoundIndex];
    const wrongTerms = ALL_TERMS.filter((t) => t !== q.term);
    const shuffledWrong = shuffleArray(wrongTerms).slice(0, 3);
    setOptions(shuffleArray([q.term, ...shuffledWrong]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundIndex, currentQuestions]);

  // Save points on game over
  useEffect(() => {
    if (isGameOver && !pointsAddedRef.current) {
      pointsAddedRef.current = true;
      if (auth.currentUser && score > 0) {
        addUserPoints(auth.currentUser.uid, score).catch(console.error);
      }
    }
  }, [isGameOver, score]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectOption = (term: string) => {
    if (selectedOption !== null) return;

    const q = currentQuestions[currentRoundIndex];
    setSelectedOption(term);

    if (term === q.term) {
      setIsCorrect(true);
      setScore((prev) => prev + 10);
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

  // ── Game Over screen ───────────────────────────────────────────────────────

  if (isGameOver) {
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

  // ── In-game screen ─────────────────────────────────────────────────────────

  const currentQ = currentQuestions[currentRoundIndex];
  if (!currentQ) return null;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] dark:bg-slate-900">

      {/* Top Bar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4">
        <div className="w-24"></div> {/* Placeholder to keep alignment */}
        <div className="text-2xl font-black uppercase">
          Question {currentRoundIndex + 1} / {currentQuestions.length}
        </div>
        <div className="neo-brutalism bg-white px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xl text-primary">
          <span className="material-symbols-outlined">stars</span>
          {score}
        </div>
      </div>

      {/* Video Question */}
      <div className="w-full max-w-sm mb-8">
        <div className="relative">
          {/* Pop-Brutalism shadow layers */}
          <div className="absolute inset-0 bg-black rounded-[2rem] translate-x-2 translate-y-2 sm:translate-x-3 sm:translate-y-3" />
          <div className="relative bg-[#ff79c6] border-4 border-black rounded-[2rem] overflow-hidden">
            {/* Label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
              bg-black text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-widest
              flex items-center gap-1 whitespace-nowrap"> {/* 🚨 เติม whitespace-nowrap ตรงนี้ */}
              <span className="material-symbols-outlined text-sm">videocam</span>
              ดูภาษามือแล้วเลือกคำที่ถูก
            </div>

            <HLSVideoPlayer
              key={currentQ.videoUrl}
              src={encodeURI(currentQ.videoUrl)}
              lazyLoad={false}
              loop={true}
              muted={true}
              showControls={false}
              className="w-full aspect-square object-cover"
            />

            {/* Decorative badge */}
            <div className="absolute bottom-3 right-4 bg-primary text-white border-2 border-black px-4 py-1 rounded-full font-black text-sm rotate-3">
              Sign & Match!
            </div>
          </div>
        </div>
      </div>

      {/* Answer Choices */}
      <div className="grid grid-cols-4 gap-4 w-full max-w-5xl px-4">
        {options.map((term, i) => {
          let btnClass = "bg-white dark:bg-slate-800 hover:translate-x-[-2px] hover:translate-y-[-2px]";
          
          if (selectedOption !== null) {
            if (term === currentQ.term) {
              btnClass = "bg-green-400 border-green-600"; 
            } else if (term === selectedOption && !isCorrect) {
              btnClass = "bg-red-400 border-red-600 opacity-80"; 
            } else {
              btnClass = "bg-white dark:bg-slate-800 opacity-50";
            }
          }

          return (
            <button
              key={i}
              disabled={selectedOption !== null}
              onClick={() => handleSelectOption(term)}
              className={`
                relative neo-brutalism rounded-2xl p-4 sm:p-6
                flex flex-col items-center justify-center gap-2
                transition-all duration-200
                ${btnClass}
                ${selectedOption === null ? "cursor-pointer" : "cursor-not-allowed"}
              `}
            >
              {/* Number badge (Absolute - z-10) */}
              <div className="absolute top-3 left-3 bg-black text-white w-7 h-7 rounded-full
                border-2 border-white flex items-center justify-center font-black text-xs z-10">
                {i + 1}
              </div>

              {/* Text span */}
              <span className="text-xl sm:text-2xl font-black text-center leading-tight">
                {term}
              </span>

              {/* Feedback icon overlay (Absolute - z-20) */}
              {selectedOption !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-20 rounded-2xl transition-opacity">
                  {term === currentQ.term && (
                    // 🚨 แก้ไขตรงนี้: จาก text-green-600 เป็น text-white 🚨
                    <span className="material-symbols-outlined text-6xl sm:text-7xl text-white drop-shadow-md">
                      check_circle
                    </span>
                  )}
                  {term === selectedOption && !isCorrect && (
                    // 🚨 แก้ไขตรงนี้: จาก text-red-600 เป็น text-white 🚨
                    <span className="material-symbols-outlined text-6xl sm:text-7xl text-white drop-shadow-md">
                      cancel
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      <div className="mt-8 flex items-center gap-6">
        <button
          disabled={selectedOption !== null}
          onClick={handleSkip}
          className={`neo-brutalism bg-white border-4 border-black px-6 py-3 rounded-xl font-black text-base transition-all flex items-center gap-2
            ${selectedOption !== null
              ? "opacity-50 cursor-not-allowed"
              : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            }`}
        >
          <span className="material-symbols-outlined">skip_next</span>
          SKIP
        </button>
      </div>
    </main>
  );
}
