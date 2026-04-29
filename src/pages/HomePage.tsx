import { Category, getPhrasesByCategory, isPhraseCompletedCheck, getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/common/VideoPlayer";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getAvatarUrl } from "@/lib/avatar";
import { useState, useEffect } from "react";
import { auth, database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import steakImg from "@/asset/image/steak.webp";
import trophyImg from "@/asset/image/Trophy.webp";
import goldMedalImg from "@/asset/image/first-gold-medal.png";

interface HomePageProps {
  onCategorySelect: (category: Category) => void;
  onResumeLesson: () => void;
  onLeaderboard: () => void;
  onLessons: () => void;
  onQuest: () => void;
  completedPhrases: Set<string>;
  streak: number;
  level: number;
}

export function HomePage({ onCategorySelect, onResumeLesson, onLeaderboard, onLessons, onQuest, completedPhrases, streak, level }: HomePageProps) {
  const { leaderboardData, loading } = useLeaderboard();

  // Detect new user: creationTime and lastSignInTime are within 5 minutes of each other
  const isNewUser = (() => {
    const meta = auth.currentUser?.metadata;
    if (!meta?.creationTime || !meta?.lastSignInTime) return false;
    const created = new Date(meta.creationTime).getTime();
    const lastSignIn = new Date(meta.lastSignInTime).getTime();
    return Math.abs(lastSignIn - created) < 5 * 60 * 1000;
  })();

  const [practiceMinutes, setPracticeMinutes] = useState(0);
  const [dailyPracticeClaimed, setDailyPracticeClaimed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(auth.currentUser?.uid);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user?.uid);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const readPractice = () => {
      const user = auth.currentUser;
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const dateKey = `dailyPracticeDate_${user.uid}`;
      const secKey = `dailyPracticeSeconds_${user.uid}`;
      const storedDate = localStorage.getItem(dateKey);
      if (storedDate === today) {
        const secs = parseInt(localStorage.getItem(secKey) || '0', 10);
        setPracticeMinutes(Math.floor(secs / 60));
      } else {
        setPracticeMinutes(0);
      }
    };
    readPractice();
    const interval = setInterval(readPractice, 5000);

    // Check if reward already claimed today
    const user = auth.currentUser;
    if (user) {
      get(ref(database, `users/${user.uid}`)).then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const today = new Date().toISOString().split('T')[0];
          if (data.dailyPracticeClaimedDate === today) setDailyPracticeClaimed(true);
        }
      }).catch(() => { });
    }

    return () => clearInterval(interval);
  }, []);

  const practiceProgressPct = Math.min((practiceMinutes / 30) * 100, 100);
  const topThree = leaderboardData.slice(0, 3);
  const currentUserEntry = leaderboardData.find(entry => entry.id === currentUserId);
  const isUserInTopThree = topThree.some(entry => entry.id === currentUserId);

  // Get last accessed category and phrase from localStorage
  const lastCategory = (localStorage.getItem('lastCategory') as Category) || 'general';
  const lastPhraseId = localStorage.getItem('lastPhraseId');
  const categoryPhrases = getPhrasesByCategory(lastCategory);
  const completedCount = categoryPhrases.filter(p => isPhraseCompletedCheck(p.id, completedPhrases)).length;
  const totalCount = categoryPhrases.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Get category display name
  const categoryNames: Record<Category, string> = {
    general: 'General Phrases',
    emotions: 'Emotions',
    illness: 'Illness & Health',
    qa: 'Questions & Answers'
  };

  // Get category video folder
  const categoryFolders: Record<Category, string> = {
    general: 'general',
    emotions: 'emotions',
    illness: 'illness',
    qa: 'qa'
  };

  // Get last accessed phrase or first uncompleted phrase for thumbnail
  const lastPhrase = categoryPhrases.find(p => p.id === lastPhraseId);
  const nextPhrase = lastPhrase || categoryPhrases.find(p => !isPhraseCompletedCheck(p.id, completedPhrases)) || categoryPhrases[0];

  // Build video URL (same logic as VideoCard)
  const getVideoSrc = () => {
    let videoFileName = nextPhrase.text;

    // Handle phrases with multiple options
    if (lastCategory === "general") {
      if (nextPhrase.text.includes("สวัสดี") && nextPhrase.text.includes("|")) {
        videoFileName = "สวัสดี (ผู้ใหญ่)";
      } else if (nextPhrase.text.includes("กินแล้ว") && nextPhrase.text.includes("|")) {
        videoFileName = "กินแล้ว";
      } else if (nextPhrase.text.includes("สบายดี") && nextPhrase.text.includes("|")) {
        videoFileName = "สบายดี";
      }
      // Handle phrases with question marks
      if (nextPhrase.text === "กินข้าวหรือยัง?") {
        videoFileName = "กินข้าวแล้วหรือยัง";
      } else if (nextPhrase.text === "สบายดีไหม?") {
        videoFileName = "สบายดีไหม";
      }
    }

    // Remove question marks from Q&A category video filenames
    if (lastCategory === "qa") {
      videoFileName = videoFileName.replace("?", "");
    }

    return getVideoUrl(lastCategory, videoFileName);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-3 pt-3 pb-28 sm:px-4 sm:pb-8 md:px-6 md:pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 md:gap-6 xl:gap-8">

        {/* ── Left Column ── */}
        <div className="xl:col-span-8 space-y-4 sm:space-y-5 md:space-y-6">

          {/* Hero */}
          <section className="brutal-card bg-accent p-4 sm:p-5 md:p-8 rounded-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative z-10 text-center sm:text-left flex-1 min-w-0">
              <span className="inline-block bg-foreground text-background px-2.5 py-1 sm:px-3 sm:py-1 rounded font-black text-xs sm:text-sm uppercase tracking-widest">
                Master Signer • LVL {level}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-4xl xl:text-5xl font-black text-foreground mt-2 sm:mt-3 md:mt-4 leading-none uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                {isNewUser ? 'Welcome,' : 'Welcome Back,'}
                <br />
                <span className="truncate block">{auth.currentUser?.displayName?.split(" ")[0] || 'Questor'}!</span>
              </h2>
              <div className="flex items-center gap-2 mt-3 sm:mt-4 md:mt-6 justify-center sm:justify-start flex-wrap">
                <div className="bg-background border-2 border-foreground px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg font-black flex items-center gap-1.5 sm:gap-2 shadow-brutal-sm">
                  <img src={steakImg} alt="Streak" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain shrink-0" />
                  <span className="text-foreground text-xs sm:text-sm md:text-base">{streak} DAY STREAK!</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              <button
                onClick={onLessons}
                className="brutal-btn-primary px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-xl font-black text-sm sm:text-base md:text-xl uppercase touch-manipulation min-h-[44px] transition-all duration-300 hover:brightness-110 active:brightness-95"
              >
                Start Lesson
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 sm:-right-10 sm:-bottom-10 opacity-20 rotate-12 pointer-events-none select-none hidden sm:block" aria-hidden>
              <span className="text-[100px] md:text-[180px]">👋</span>
            </div>
          </section>

          {/* Current Quest */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-xl md:text-2xl font-black uppercase italic tracking-tighter">Current Quest</h3>
              <button
                onClick={() => onCategorySelect(lastCategory)}
                className="text-xs sm:text-sm font-bold underline decoration-primary decoration-2 underline-offset-4 touch-manipulation min-h-[36px] flex items-center transition-colors hover:text-primary"
              >
                View All
              </button>
            </div>
            <div
              className="brutal-card bg-card p-3 sm:p-4 md:p-6 rounded-xl flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 items-stretch sm:items-center animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '100ms' }}
            >
              {/* Video — 16:9 on all sizes, fixed width on sm+ */}
              <div className="w-full sm:w-36 md:w-44 xl:w-52 shrink-0 aspect-square bg-muted rounded-lg border-2 border-foreground overflow-hidden">
                <VideoPlayer
                  key={getVideoSrc()}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                  src={getVideoSrc()}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-primary font-black text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
                      Last Learned
                    </p>
                    <h4 className="text-base sm:text-xl md:text-2xl font-black truncate">{nextPhrase.text}</h4>
                  </div>
                  <span className="font-black text-sm sm:text-lg md:text-xl shrink-0">
                    {completedCount}/{totalCount}
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase italic ml-1">Signs</span>
                  </span>
                </div>
                <div className="w-full h-4 sm:h-5 bg-muted border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-primary border-r-2 border-foreground transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="flex justify-center sm:justify-end">
                  <button
                    onClick={onResumeLesson}
                    className="brutal-btn-primary w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2 rounded-lg font-black uppercase text-xs sm:text-sm touch-manipulation min-h-[40px] transition-all hover:brightness-110 active:brightness-95"
                  >
                    Click to Resume
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div className="xl:col-span-4 space-y-4 sm:space-y-5 md:space-y-6">

          {/* Top Challengers */}
          <section className="brutal-card bg-card p-3 sm:p-4 md:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
              <img src={trophyImg} alt="Trophy" className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0" />
              <h3 className="text-sm sm:text-base md:text-lg font-black uppercase italic tracking-tighter">Top Challengers</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : topThree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">ยังไม่มีข้อมูลผู้เล่น</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {topThree.map((entry, index) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-2 sm:gap-3 rounded-lg ${
                      index === 0
                        ? 'p-2.5 sm:p-3 bg-accent/10 border-2 border-dashed border-foreground'
                        : 'p-2 sm:p-2.5'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-black italic w-5 shrink-0">{entry.rank}</span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-foreground overflow-hidden shrink-0 bg-muted">
                      <img
                        alt={entry.username}
                        src={entry.photoURL || getAvatarUrl(null, entry.username)}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = getAvatarUrl(null, entry.username);
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-xs sm:text-sm leading-none truncate">
                        {entry.username?.split(" ")[0]}
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-0.5">
                        {entry.points.toLocaleString()} Pts
                      </p>
                    </div>
                    {index === 0 && <img src={goldMedalImg} alt="Gold Medal" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 object-contain" />}
                  </div>
                ))}
                
                {!isUserInTopThree && currentUserEntry && (
                  <div
                    className="flex items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-2.5"
                  >
                    <span className="text-base sm:text-lg font-black italic w-5 shrink-0">{currentUserEntry.rank}</span>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-foreground overflow-hidden shrink-0 bg-muted">
                      <img
                        alt={currentUserEntry.username}
                        src={currentUserEntry.photoURL || getAvatarUrl(null, currentUserEntry.username)}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = getAvatarUrl(null, currentUserEntry.username);
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black uppercase text-xs sm:text-sm leading-none truncate">
                        {currentUserEntry.username?.split(" ")[0]} <span className="opacity-70 text-[10px] sm:text-xs ml-1">(คุณ)</span>
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-0.5">
                        {currentUserEntry.points.toLocaleString()} Pts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onLeaderboard}
              className="w-full mt-3 sm:mt-4 brutal-btn-secondary py-2 font-black uppercase text-[10px] sm:text-xs tracking-widest touch-manipulation min-h-[40px] transition-all hover:brightness-105 active:brightness-95"
            >
              View Full Board
            </button>
          </section>

          {/* Daily Goals */}
          <section className="brutal-card bg-foreground text-background p-3 sm:p-4 md:p-6 rounded-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base md:text-lg font-black uppercase italic tracking-tighter text-accent">
                Daily Goals
              </h3>
              <button
                onClick={onQuest}
                className="text-xs sm:text-sm font-bold underline decoration-primary decoration-2 underline-offset-4 touch-manipulation min-h-[36px] flex items-center transition-colors hover:text-primary"
              >
                View
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">

              {/* Goal 1 — always complete */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="size-5 sm:size-6 border-2 border-background rounded-md flex items-center justify-center bg-primary mt-0.5 shrink-0">
                  <span className="text-xs font-black text-background leading-none">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs sm:text-sm truncate">เข้าสู่ระบบ 1 ครั้ง/วัน</p>
                    <p className="text-[10px] text-background/60 font-semibold shrink-0">สำเร็จแล้ว!</p>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-background/20 rounded-full mt-1.5 border border-background/30">
                    <div className="w-full h-full bg-primary rounded-full" />
                  </div>
                </div>
              </div>

              {/* Goal 2 — practice 30 min */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className={`size-5 sm:size-6 border-2 border-background rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
                  dailyPracticeClaimed || practiceMinutes >= 30 ? 'bg-primary' : 'bg-background/20'
                }`}>
                  {(dailyPracticeClaimed || practiceMinutes >= 30) && (
                    <span className="text-xs font-black text-background leading-none">✓</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs sm:text-sm">ฝึกซ้อม 30 นาที</p>
                    <p className="text-[10px] text-background/60 font-semibold shrink-0">
                      {dailyPracticeClaimed ? 'สำเร็จแล้ว!' : `${Math.min(practiceMinutes, 30)}/30 นาที`}
                    </p>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-background/20 rounded-full mt-1.5 border border-background/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${dailyPracticeClaimed ? 'bg-primary' : 'bg-accent'}`}
                      style={{ width: `${dailyPracticeClaimed ? 100 : practiceProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
