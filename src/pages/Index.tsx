import { useState } from "react";
import { GameSidebar } from "@/components/GameSidebar";
import { VideoCard } from "@/components/VideoCard";
import { WebcamView } from "@/components/WebcamView";
import { PhraseSelector } from "@/components/PhraseSelector";
import { LeaderboardView } from "@/components/LeaderboardView";
import { AuthModal } from "@/components/AuthModal";
import { ProfileEdit } from "@/components/ProfileEdit";
import { Category, Phrase, getPhrasesByCategory } from "@/lib/categories";
import { LogIn } from "lucide-react";

type View = "game" | "leaderboard" | "profile";

const Index = () => {
  const [category, setCategory] = useState<Category>("general");
  const [activePhrase, setActivePhrase] = useState<Phrase>(getPhrasesByCategory("general")[0]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set(["g1", "g2", "e1"]));
  const [view, setView] = useState<View>("game");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setActivePhrase(getPhrasesByCategory(cat)[0]);
    setView("game");
    setSidebarOpen(false);
  };

  const handlePhraseSelect = (phrase: Phrase) => {
    setActivePhrase(phrase);
  };

  return (
    <div className="min-h-screen flex w-full">
      <GameSidebar
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        onLeaderboard={() => { setView("leaderboard"); setSidebarOpen(false); }}
        onProfile={() => { setView("profile"); setSidebarOpen(false); }}
        showLeaderboard={view === "leaderboard"}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-h-screen">
        {/* Top bar */}
        <header className="border-b-[3px] border-foreground bg-card px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 pl-12 lg:pl-0">
            <h2 className="font-display text-xl text-foreground">
              {view === "leaderboard" ? "🏆 Leaderboard" : view === "profile" ? "👤 Profile" : `📚 ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </h2>
          </div>
          <button onClick={() => setAuthOpen(true)} className="brutal-btn-secondary flex items-center gap-2 text-sm font-body">
            <LogIn size={16} />
            Login
          </button>
        </header>

        <div className="p-4 lg:p-6">
          {view === "leaderboard" && <LeaderboardView />}
          {view === "profile" && <ProfileEdit onBack={() => setView("game")} />}
          {view === "game" && (
            <div className="space-y-4 lg:space-y-6">
              {/* Phrase selector */}
              <PhraseSelector
                category={category}
                activePhrase={activePhrase}
                onSelect={handlePhraseSelect}
                completedPhrases={completedPhrases}
              />

              {/* 2-column game grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <VideoCard phrase={activePhrase?.text ?? "Hello"} />
                <WebcamView />
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
