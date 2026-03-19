import { Category, getPhrasesByCategory } from "@/lib/categories";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getAvatarUrl } from "@/lib/avatar";
import { useMemo } from "react";
import { auth } from "@/lib/firebase";

interface HomePageProps {
  onCategorySelect: (category: Category) => void;
  onResumeLesson: () => void;
  onLeaderboard: () => void;
  onLessons: () => void;
  completedPhrases: Set<string>;
  streak: number;
}

export function HomePage({ onCategorySelect, onResumeLesson, onLeaderboard, onLessons, completedPhrases, streak }: HomePageProps) {
  const { leaderboardData, loading } = useLeaderboard();
  const topThree = leaderboardData.slice(0, 3);

  // Get last accessed category and phrase from localStorage
  const lastCategory = (localStorage.getItem('lastCategory') as Category) || 'general';
  const lastPhraseId = localStorage.getItem('lastPhraseId');
  const categoryPhrases = getPhrasesByCategory(lastCategory);
  const completedCount = categoryPhrases.filter(p => completedPhrases.has(p.id)).length;
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
  const nextPhrase = lastPhrase || categoryPhrases.find(p => !completedPhrases.has(p.id)) || categoryPhrases[0];

  // Build video URL (same logic as VideoCard)
  const getVideoUrl = () => {
    let videoFileName = nextPhrase.text;

    // Handle phrases with multiple options
    if (lastCategory === "general") {
      if (nextPhrase.text.includes("สวัสดี") && nextPhrase.text.includes("|")) {
        videoFileName = "สวัสดี (ผู้ใหญ่)";
      } else if (nextPhrase.text.includes("กินแล้ว") && nextPhrase.text.includes("|")) {
        videoFileName = "กินแล้ว";
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

    return `/videos/${lastCategory}/${videoFileName}.mp4`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Hero Section */}
          <section className="brutal-card bg-accent p-8 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="relative z-10 text-center md:text-left flex-1">
              <span className="bg-foreground text-background px-3 py-1 rounded font-black text-xs uppercase tracking-widest">
                Master Signer • LVL 12
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4 leading-none uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                Welcome Back,<br />{auth.currentUser?.displayName || 'Questor'}!
              </h2>
              <div className="flex items-center gap-3 mt-6 justify-center md:justify-start">
                <div className="bg-background border-2 border-foreground px-4 py-2 rounded-lg font-black flex items-center gap-2 shadow-brutal-sm">
                  <span className="text-2xl">🔥</span>
                  <span className="text-foreground">{streak} DAY STREAK!</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <button
                onClick={onLessons}
                className="brutal-btn-primary px-8 py-4 rounded-xl font-black text-xl uppercase tracking-tighter"
              >
                Keep Learning
              </button>
            </div>
            {/* Abstract patterns in background */}
            <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
              <span className="text-[200px]">👋</span>
            </div>
          </section>

          {/* Continue Learning */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Current Quest</h3>
              <button
                onClick={() => onCategorySelect(lastCategory)}
                className="text-sm font-bold underline decoration-primary decoration-2 underline-offset-4"
              >
                View All
              </button>
            </div>
            <div className="brutal-card bg-card p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 aspect-video md:aspect-square bg-muted rounded-lg border-2 border-foreground overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  src={getVideoUrl()}
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-primary font-black text-xs uppercase tracking-widest mb-1">
                      Last Learned
                    </p>
                    <h4 className="text-2xl font-black">{nextPhrase.text}</h4>
                  </div>
                  <span className="font-black text-xl">
                    {completedCount}/{totalCount} <span className="text-sm text-muted-foreground font-bold uppercase italic">Signs</span>
                  </span>
                </div>
                <div className="w-full h-6 bg-muted border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-primary border-r-2 border-foreground" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={onResumeLesson}
                    className="brutal-btn-primary px-6 py-2 rounded-lg font-black uppercase text-sm"
                  >
                    Click to Resume
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Top Challengers */}
          <section className="brutal-card bg-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🏆</span>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Top Challengers</h3>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : topThree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">ยังไม่มีข้อมูลผู้เล่น</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topThree.map((entry, index) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 p-${index === 0 ? '3 bg-accent/10 rounded-lg border-2 border-dashed border-foreground' : '2'}`}
                  >
                    <span className="text-lg font-black italic w-6">{entry.rank}</span>
                    <div className="size-10 rounded-full border-2 border-foreground overflow-hidden flex-shrink-0 bg-muted">
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
                    <div className="flex-1">
                      <p className="font-black uppercase text-sm leading-none">{entry.username}</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">{entry.points.toLocaleString()} Pts</p>
                    </div>
                    {index === 0 && <span className="text-accent text-2xl">🏅</span>}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onLeaderboard}
              className="w-full mt-6 brutal-btn-secondary py-2 font-black uppercase text-xs tracking-widest"
            >
              View Full Board
            </button>
          </section>

          {/* Daily Goals */}
          <section className="brutal-card bg-foreground text-background p-6 rounded-xl">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-accent">
              Daily Goals
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-6 border-2 border-background rounded-md flex items-center justify-center bg-primary mt-1">
                  <span className="text-sm font-black text-background">✓</span>
                </div>
                <div>
                  <p className="font-bold text-sm uppercase">Learn 5 new signs</p>
                  <div className="w-32 h-2 bg-background/20 rounded-full mt-2 border border-background/30">
                    <div className="w-full h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 border-2 border-background rounded-md flex items-center justify-center bg-background/20 mt-1"></div>
                <div>
                  <p className="font-bold text-sm uppercase">Practice for 15 mins</p>
                  <div className="w-32 h-2 bg-background/20 rounded-full mt-2 border border-background/30">
                    <div className="w-[40%] h-full bg-accent rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Nav Shortcut (Visible on Small Screens) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => onCategorySelect("general")}
          className="brutal-btn-primary size-16 rounded-full flex items-center justify-center"
        >
          <span className="text-4xl font-black">▶</span>
        </button>
      </div>
    </div>
  );
}
