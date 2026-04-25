import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingScreen } from "@/components/LoadingScreen";
import { auth } from "@/lib/firebase";
import { addUserPoints } from "@/lib/auth";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Star, CheckCircle2, XCircle, SkipForward, ArrowLeft, Trophy, Zap, BookOpen, Swords, Eye } from "lucide-react";

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
  { term: "เป็นไข้", translation: "Fever", correct: getVideoUrl("illness", "เป็นไข้") },
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
  const questionsRef = useRef<typeof ALL_QUESTIONS>([]);
  const roundIndexRef = useRef(0);

  const preloadVideoSet = useCallback(async (vurls: string[]) => {
    for (const url of vurls) {
      try { const vid = document.createElement('video'); vid.src = url; vid.preload = 'auto'; } catch { /* ignore */ }
    }
  }, []);

  const initializeGame = useCallback(() => {
    const questions = shuffleArray(ALL_QUESTIONS).slice(0, 5);
    questionsRef.current = questions;
    setCurrentQuestions(questions);
    const firstQ = questions[0];
    const wrongVids = ALL_VIDEOS.filter(v => v !== firstQ.correct);
    const firstOptions = shuffleArray([firstQ.correct, ...shuffleArray(wrongVids).slice(0, 3)]);
    setOptions(firstOptions);
    preloadVideoSet(firstOptions);
    roundIndexRef.current = 0;
    setCurrentRoundIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
    pointsAddedRef.current = false;
  }, [preloadVideoSet]);

  useEffect(() => { initializeGame(); }, [initializeGame]);

  const advanceRound = useCallback(() => {
    const nextIndex = roundIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      roundIndexRef.current = nextIndex;
      setCurrentRoundIndex(nextIndex);
      const nextQ = questionsRef.current[nextIndex];
      const wrongVids = ALL_VIDEOS.filter(v => v !== nextQ.correct);
      const nextOptions = shuffleArray([nextQ.correct, ...shuffleArray(wrongVids).slice(0, 3)]);
      setOptions(nextOptions);
      preloadVideoSet(nextOptions);
    } else {
      setPhase("gameover");
    }
  }, [preloadVideoSet]);

  const startGame = () => setPhase("playing");
  const handlePlayAgain = () => { initializeGame(); setPhase("playing"); };

  useEffect(() => {
    if (phase === "gameover" && !pointsAddedRef.current) {
      pointsAddedRef.current = true;
      if (auth.currentUser && score > 0) addUserPoints(auth.currentUser.uid, score).catch(console.error);
    }
  }, [phase, score]);

  const handleSelectOption = (videoUrl: string) => {
    if (selectedOption !== null) return;
    const q = currentQuestions[currentRoundIndex];
    setSelectedOption(videoUrl);
    if (videoUrl === q.correct) { setIsCorrect(true); setScore(prev => prev + 10); } else { setIsCorrect(false); }
    setTimeout(() => { setSelectedOption(null); setIsCorrect(null); advanceRound(); }, 1500);
  };

  const handleSkip = () => {
    if (selectedOption !== null) return;
    setSelectedOption("SKIP"); setIsCorrect(false);
    setTimeout(() => { setSelectedOption(null); setIsCorrect(null); advanceRound(); }, 1500);
  };

  const handleBackToHome = () => {
    setIsReturningHome(true);
    setTimeout(() => navigate("/", { state: { view: "gamesetup" } }), 3000);
  };

  const DotGrid = () => (
    <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
      backgroundImage: "radial-gradient(circle, hsl(342 100% 64% / 0.35) 1.5px, transparent 1.5px)",
      backgroundSize: "32px 32px",
    }} />
  );

  /* ─── IDLE ─── */
  if (phase === "idle") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen text-foreground relative p-3 sm:p-4 md:p-8 flex flex-col items-center overflow-hidden sd-gradient-bg">
          <DotGrid />
          <div className="absolute top-[8%] right-[12%] opacity-[0.07] pointer-events-none sd-float hidden sm:block"><BookOpen size={90} strokeWidth={1.5} /></div>
          <div className="absolute bottom-[12%] left-[6%] opacity-[0.07] pointer-events-none sd-float-delay hidden sm:block"><Eye size={70} strokeWidth={1.5} /></div>

          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
            <button onClick={handleBackToHome}
              className="bg-white dark:bg-slate-800 text-foreground text-sm md:text-base font-black py-2.5 px-5 rounded-xl transition-all hover:-translate-y-1 uppercase flex items-center gap-2 border-[3px] border-black active:translate-y-0"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col items-center w-full relative z-10">
            <div className="text-center mb-4 sm:mb-6 md:mb-8 mt-14 md:mt-0 sd-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 border-2 border-primary/30 rounded-full px-3 sm:px-4 py-1 mb-3 sm:mb-4">
                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary">Quiz Mode</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-1 sd-title-glitch">Match</h1>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-primary sd-title-glitch">&amp; Sign</h1>
              <div className="h-1.5 bg-foreground w-16 mx-auto mt-4 rounded-full border-[2px] border-black" style={{ boxShadow: "2px 2px 0 0 #000" }} />
              <p className="mt-4 font-bold text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
                อ่านคำศัพท์ภาษาไทยแล้วเลือกวิดีโอภาษามือที่ถูกต้อง!
              </p>
            </div>

            <div className="flex flex-col gap-4 md:gap-5 w-full max-w-[400px] mx-auto items-stretch">
              <div className="sd-slide-up" style={{ animationDelay: "0.1s" }}>
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full flex flex-col text-sm border-[3px] border-black"
                  style={{ boxShadow: "6px 6px 0px 0px #000" }}>
                  <h2 className="text-lg md:text-xl font-black uppercase mb-4 border-b-[3px] border-foreground pb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> How to Play
                  </h2>
                  <ul className="space-y-3 font-bold">
                    {[
                      { icon: <BookOpen className="w-4 h-4" />, text: "อ่านคำศัพท์ภาษาไทยจากโจทย์" },
                      { icon: <Eye className="w-4 h-4" />, text: "เลือกวิดีโอภาษามือที่ตรงกับคำศัพท์" },
                      { icon: <Star className="w-4 h-4" />, text: <>ตอบถูกได้ <span className="text-primary">+10 คะแนน</span></> },
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start group">
                        <span className="bg-primary text-white font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 border-[2px] border-black transition-transform group-hover:scale-110"
                          style={{ boxShadow: "2px 2px 0 0 #000" }}>{item.icon}</span>
                        <p className="pt-1.5 text-sm">{item.text}</p>
                      </li>
                    ))}
                    <li className="flex items-center pt-3 border-t-[3px] border-foreground/20 mt-1">
                      <span className="bg-secondary text-foreground font-black rounded-xl w-8 h-8 flex items-center justify-center shrink-0 mr-3 border-[2px] border-black"
                        style={{ boxShadow: "2px 2px 0 0 #000" }}><Trophy className="w-4 h-4" /></span>
                      <p className="font-bold text-sm">เล่นจนครบ 5 ข้อเพื่อสะสมคะแนน!</p>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="sd-slide-up" style={{ animationDelay: "0.2s" }}>
                <button onClick={startGame}
                  className="bg-primary text-white text-base sm:text-lg md:text-xl font-black py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all uppercase w-full border-[3px] border-black hover:-translate-y-1 hover:brightness-110 active:translate-y-0 flex items-center justify-center gap-2"
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

  /* ─── GAME OVER ─── */
  if (phase === "gameover") {
    return (
      <>
        {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
        <main className="min-h-screen flex flex-col relative overflow-hidden sd-gradient-bg">
          <DotGrid />
          <div className="absolute top-[10%] left-[8%] opacity-10 pointer-events-none sd-float"><BookOpen size={80} strokeWidth={1.5} /></div>
          <div className="absolute bottom-[15%] right-[10%] opacity-10 pointer-events-none sd-float-delay"><Eye size={60} strokeWidth={1.5} /></div>
          <div className="flex-1 flex items-center justify-center p-4 md:p-6">
            <div className="sd-slide-up bg-white dark:bg-slate-800 border-[3px] md:border-[4px] border-black rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center w-full max-w-md z-10 relative"
              style={{ boxShadow: "6px 6px 0px 0px #000" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-300 border-[3px] border-black px-5 py-1.5 rounded-full"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <p className="font-black uppercase text-xs tracking-widest text-black">COMPLETE</p>
              </div>
              <div className="mx-auto mb-3 md:mb-4 mt-2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary border-[3px] border-black flex items-center justify-center"
                style={{ boxShadow: "3px 3px 0 0 #000" }}>
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 md:mb-6 text-foreground whitespace-nowrap sd-title-glitch">
                GAME <span className="text-primary">OVER</span>
              </h2>
              <div className="bg-secondary border-[3px] border-black rounded-2xl px-6 md:px-8 py-4 md:py-5 mb-6 md:mb-8 inline-block relative"
                style={{ boxShadow: "4px 4px 0 0 #000" }}>
                <Star className="absolute -top-3 -right-3 w-7 h-7 md:w-8 md:h-8 text-yellow-600 bg-yellow-300 rounded-full p-1 border-2 border-black" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60 mb-1">FINAL SCORE</p>
                <p className="text-4xl md:text-6xl font-black text-foreground leading-none">{score}</p>
                <p className="text-[10px] md:text-xs font-bold text-foreground/50 mt-1 uppercase">/ {currentQuestions.length * 10} Points</p>
              </div>
              <div className="flex flex-col gap-3">
                <button disabled={isReturningHome} onClick={handlePlayAgain}
                  className="bg-primary text-white font-black uppercase text-lg md:text-xl py-4 rounded-2xl border-[3px] border-black transition-all hover:-translate-y-1 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "5px 5px 0px 0px #000" }}>
                  <Swords className="w-5 h-5" /> PLAY AGAIN
                </button>
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

  /* ─── PLAYING ─── */
  const currentQ = currentQuestions[currentRoundIndex];
  if (!currentQ) return null;
  const progressPct = ((currentRoundIndex) / currentQuestions.length) * 100;

  return (
    <>
      {isReturningHome && <LoadingScreen message="Returning to Challenge..." />}
      <main className="min-h-screen sd-gradient-bg relative flex flex-col text-foreground">
        <DotGrid />

        {/* HUD */}
        <header className="w-full px-3 md:px-6 py-3 md:py-4 z-20 flex justify-between items-center gap-2 pointer-events-none">
          <button onClick={handleBackToHome} disabled={isReturningHome}
            className="pointer-events-auto bg-white dark:bg-slate-800 border-[3px] border-black px-3 md:px-5 py-2 rounded-2xl flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0.5"
            style={{ boxShadow: "4px 4px 0px 0px #000" }}>
            <ArrowLeft className="w-5 h-5 text-black" strokeWidth={3} />
            <span className="font-black uppercase tracking-tighter text-sm md:text-base text-black hidden sm:inline">EXIT</span>
          </button>
          <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
            <div className="bg-white border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl flex items-center gap-1.5"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <Zap className="w-4 h-4 text-primary" strokeWidth={2.5} />
              <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter">Q{currentRoundIndex + 1}/{currentQuestions.length}</p>
            </div>
            <div className="bg-yellow-300 border-[3px] border-black px-3 md:px-5 py-1.5 md:py-2 rounded-2xl"
              style={{ boxShadow: "4px 4px 0px 0px #000" }}>
              <p className="font-black uppercase text-sm md:text-base text-black tracking-tighter text-center">
                <Star className="w-3.5 h-3.5 inline-block -mt-0.5 mr-1 text-yellow-700" />{score}
              </p>
            </div>
          </div>
        </header>

        {/* Progress bar */}
        <div className="w-full px-3 md:px-6 z-10">
          <div className="h-2 bg-black/10 rounded-full border-[2px] border-black overflow-hidden" style={{ boxShadow: "2px 2px 0 0 #000" }}>
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 md:px-6 py-4 md:py-6 gap-4 md:gap-6 relative z-10">
          {/* Word Question Card */}
          <div className="w-full max-w-sm md:max-w-md sd-slide-up">
            <div className="bg-primary text-white border-[3px] sm:border-[4px] border-black rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 text-center relative overflow-hidden"
              style={{ boxShadow: "6px 6px 0px 0px #000" }}>
              <div className="absolute top-3 left-4 opacity-15 -rotate-12"><BookOpen className="w-10 h-10 sm:w-14 sm:h-14" /></div>
              <div className="absolute top-2.5 right-2.5 bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 z-10 border-[2px] border-white/30"
                style={{ boxShadow: "2px 2px 0 0 rgba(0,0,0,0.3)" }}>
                <BookOpen className="w-3 h-3" /> โจทย์
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-1.5 tracking-tighter break-words mt-2">{currentQ?.term}</h3>
              <p className="text-sm sm:text-base md:text-lg font-bold opacity-80 uppercase tracking-[0.15em]">{currentQ?.translation}</p>
            </div>
          </div>

          {/* Video Choices */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-4xl sd-slide-up" style={{ animationDelay: "0.1s" }}>
            {options.map((opt, i) => {
              let btnBg = "bg-white dark:bg-slate-800";
              let borderColor = "border-black";
              let extraClass = selectedOption === null ? "hover:-translate-y-1 cursor-pointer" : "cursor-not-allowed";

              if (selectedOption !== null) {
                if (opt === currentQ?.correct) { btnBg = "bg-green-400"; borderColor = "border-green-700"; }
                else if (opt === selectedOption && !isCorrect) { btnBg = "bg-red-400"; borderColor = "border-red-700"; extraClass += " opacity-80"; }
                else { extraClass += " opacity-40"; }
              }

              return (
                <button key={i} disabled={selectedOption !== null} onClick={() => handleSelectOption(opt)}
                  className={`group relative flex flex-col rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 border-[3px] ${borderColor} ${btnBg} ${extraClass}`}
                  style={{ boxShadow: selectedOption === null ? "4px 4px 0px 0px #000" : "2px 2px 0px 0px #000" }}>
                  <div className="aspect-square w-full bg-black/5 flex items-center justify-center relative overflow-hidden">
                    <VideoPlayer key={opt} src={opt} autoPlay loop muted playsInline preload="auto"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none" />
                    {selectedOption !== null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-20">
                        {opt === currentQ?.correct && <CheckCircle2 className="text-white bg-green-500 rounded-full drop-shadow-lg p-1.5 w-12 h-12 sm:w-14 sm:h-14" />}
                        {opt === selectedOption && !isCorrect && <XCircle className="text-white bg-red-500 rounded-full drop-shadow-lg p-1.5 w-12 h-12 sm:w-14 sm:h-14" />}
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 bg-black text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center font-black text-[10px] sm:text-xs z-10">
                    {i + 1}
                  </div>
                  <div className="p-2 sm:p-2.5 border-t-[3px] border-black text-center font-black uppercase text-xs sm:text-sm bg-white dark:bg-slate-800">
                    Select
                  </div>
                </button>
              );
            })}
          </div>

          {/* Skip */}
          <div className="sd-slide-up" style={{ animationDelay: "0.2s" }}>
            <button disabled={selectedOption !== null} onClick={handleSkip}
              className={`bg-white dark:bg-slate-800 border-[3px] border-black px-5 py-2.5 rounded-xl font-black text-sm uppercase transition-all flex items-center gap-2 ${selectedOption !== null ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 active:translate-y-0"}`}
              style={{ boxShadow: selectedOption !== null ? "2px 2px 0px 0px #000" : "4px 4px 0px 0px #000" }}>
              <SkipForward className="w-4 h-4" /> SKIP
            </button>
          </div>
        </div>
      </main>
    </>
  );
}