import { useState, useEffect } from "react";
import { Menu, X, User, Home, ChevronRight } from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { ref as dbRef, get, onValue } from "firebase/database";
import { getAvatarUrl } from "@/lib/avatar";

import { Category, categories } from "@/lib/categories";
import generalImg from "@/asset/image/general.png";
import emotionalImg from "@/asset/image/emotional.png";
import qaImg from "@/asset/image/qa.png";
import illnessImg from "@/asset/image/illness.png";
import trophyImg from "@/asset/image/Trophy.png";
import questImg from "@/asset/image/quest.png";
import challengeImg from "@/asset/image/challenge.png";
import playImg from "@/asset/image/Play.png";

const iconMap: Record<string, string> = {
  Hand: generalImg,
  Heart: emotionalImg,
  HelpCircle: qaImg,
  Thermometer: illnessImg,
};

interface GameSidebarProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onPlayGame: () => void;
  onQuest: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onLessons: () => void;
  onHome: () => void;
  showPlayGame: boolean;
  showLessons: boolean;
  showQuest: boolean;
  showLeaderboard: boolean;
  showHome: boolean;
  showProfile: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function GameSidebar({
  activeCategory,
  onCategoryChange,
  onPlayGame,
  onQuest,
  onLeaderboard,
  onProfile,
  onLessons,
  onHome,
  showPlayGame,
  showLessons,
  showQuest,
  showLeaderboard,
  showHome,
  showProfile,
  isOpen,
  onToggle,
}: GameSidebarProps) {

  const [username, setUsername] = useState("User");
  const [photoURL, setPhotoURL] = useState<string | null>(() => {
    if (auth.currentUser?.photoURL) return auth.currentUser.photoURL;
    return localStorage.getItem("cached_avatar");
  });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setUsername(user.displayName || "User");
    if (user.photoURL && !photoURL) setPhotoURL(user.photoURL);

    const userRef = dbRef(database, `users/${user.uid}`);
    
    // Set up real-time listener for user data (points, photoURL)
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.points !== undefined) setPoints(userData.points);
        if (userData.photoURL && !photoURL) setPhotoURL(userData.photoURL);
      }
    }, (error) => {
      console.error("Error loading database data:", error);
    });

    return () => unsubscribe();
  }, [photoURL]);

  const handlePlayGame = () => {
    onPlayGame();
    if (isOpen) {
      onToggle(); // Close sidebar on mobile
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 brutal-btn-primary p-2 lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-30 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-screen w-64 bg-primary border-r-[3px] border-foreground flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b-[3px] border-foreground">
          <h1 className="text-2xl font-display text-primary-foreground tracking-wide flex items-center gap-2">
            <img src="/LOGO_SignMate.png" alt="SignMate" className="w-7 h-7 object-contain" />
            SignMate
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1 font-body">Learn. Sign. Level Up!</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col overflow-y-auto">
          <div className="space-y-2 mb-4">
            <button
              onClick={onHome}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                showHome
                  ? "bg-secondary text-secondary-foreground shadow-brutal-sm"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              }`}
              style={showHome ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <Home size={18} />
              Home
            </button>

              <button
              onClick={handlePlayGame}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                showPlayGame
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-purple-400 text-white hover:bg-purple-500"
              }`}
              style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}
            >
              <img src={challengeImg} alt="Challenge" className="w-[18px] h-[18px] object-contain" />
              Challenge
            </button>

              <button
                onClick={onQuest}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                  showQuest
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
                style={showQuest ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
              >
                <img src={questImg} alt="Quest" className="w-[18px] h-[18px] object-contain" />
                Quest
              </button>

              <button
                onClick={onLeaderboard}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                  showLeaderboard
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
                style={showLeaderboard ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
              >
                <img src={trophyImg} alt="Leaderboard" className="w-[18px] h-[18px] object-contain" />
                Leaderboard
              </button>

          </div>

          <button
            onClick={onLessons}
            className="w-full mt-auto transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <img src={playImg} alt="Play" className="w-full h-auto" />
          </button>
        </nav>

        <div className="p-4 border-t-[3px] border-foreground">
          <div 
            onClick={onProfile}
            className="bg-secondary rounded-lg border-[2px] border-foreground shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] transition-all"
          >
            <img 
              alt={username} 
              className="w-9 h-9 rounded-full border-[2px] border-foreground object-cover bg-slate-200 shrink-0" 
              src={photoURL || getAvatarUrl(null, username || auth.currentUser?.email || "user")}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = getAvatarUrl(null, username || auth.currentUser?.email || "user");
              }}
            />
            <div className="flex-1 overflow-hidden text-left">
              <p className="font-display text-secondary-foreground leading-tight text-[13px] truncate">{username}</p>
              <p className="text-[11px] font-bold text-secondary-foreground opacity-80 mt-0.5">{points.toLocaleString()} pts</p>
            </div>
            <ChevronRight size={18} className="text-secondary-foreground shrink-0 opacity-80" />
          </div>
        </div>
      </aside>
    </>
  );
}
