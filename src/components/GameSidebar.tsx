import { useState, useEffect } from "react";
import { User, Home, ChevronRight, ChevronLeft } from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref as dbRef, get, onValue } from "firebase/database";
import { getAvatarUrl } from "@/lib/avatar";

import { Category, categories } from "@/lib/categories";
import generalImg from "@/asset/image/general.webp";
import emotionalImg from "@/asset/image/emotional.webp";
import qaImg from "@/asset/image/qa.webp";
import illnessImg from "@/asset/image/illness.webp";
import trophyImg from "@/asset/image/Trophy.webp";
import questImg from "@/asset/image/quest.webp";
import challengeImg from "@/asset/image/challenge.webp";
import lessonImg from "@/asset/image/lesson.webp";

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

  const [userId, setUserId] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const [username, setUsername] = useState("User");
  const [photoURL, setPhotoURL] = useState<string | null>(() => {
    if (auth.currentUser?.photoURL) return auth.currentUser.photoURL;
    return localStorage.getItem("cached_avatar");
  });
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Reset state เมื่อ user เปลี่ยน
    setUsername("User");
    setPhotoURL(auth.currentUser?.photoURL || localStorage.getItem("cached_avatar"));
    setPoints(0);

    const user = auth.currentUser;
    if (!user) return;

    setUsername(user.displayName || "User");

    const userRef = dbRef(database, `users/${user.uid}`);

    // Set up real-time listener for user data (points, photoURL, username)
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.points !== undefined) setPoints(userData.points);
        if (userData.photoURL) setPhotoURL(userData.photoURL);
        if (userData.username || userData.displayName) {
          setUsername(userData.username || userData.displayName);
        }
      }
    }, (error) => {
      console.error("Error loading database data:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const handlePlayGame = () => {
    onPlayGame();
    if (isOpen) {
      onToggle(); // Close sidebar on mobile
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-30 lg:hidden" onClick={onToggle} />
      )}

      {/* Sidebar wrapper — the arrow tab is positioned at the right edge of this wrapper */}
      <div
        className={`fixed lg:static z-40 top-0 left-0 h-dvh transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "fit-content" }}
      >
        <aside
          className="h-full w-64 bg-primary border-r-[3px] border-foreground flex flex-col overflow-hidden"
        >
        <div className="p-6 border-b-[3px] border-foreground">
          <h1 
            className="text-2xl font-display text-primary-foreground tracking-wide flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onHome}
          >
            <img src="/LOGO_SignMate.png" alt="SignMate" className="w-7 h-7 object-contain" />
            SignMate
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1 font-body">Learn. Sign. Level Up!</p>
        </div>

        <nav className="flex-1 min-h-0 p-4 flex flex-col overflow-y-auto">
          <div className="space-y-2 mb-4">
            <button
              onClick={onHome}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${showHome
                  ? "bg-secondary text-secondary-foreground shadow-brutal-sm"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
              style={showHome ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <Home size={18} />
              Home
            </button>

            <button
              onClick={onLessons}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${showLessons
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
              style={showLessons ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <img src={lessonImg} alt="Lesson" className="w-[18px] h-[18px] object-contain" />
              Lesson
            </button>

            <button
              onClick={handlePlayGame}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${showPlayGame
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
              style={showPlayGame ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <img src={challengeImg} alt="Challenge" className="w-[18px] h-[18px] object-contain" />
              Challenge
            </button>

            <button
              onClick={onQuest}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${showQuest
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${showLeaderboard
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
              style={showLeaderboard ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <img src={trophyImg} alt="Leaderboard" className="w-[18px] h-[18px] object-contain" />
              Leaderboard
            </button>
          </div>


        </nav>

        <div className="p-4 border-t-[3px] border-foreground shrink-0">
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
              <p className="font-display text-secondary-foreground leading-tight text-[13px] truncate">{username?.split(" ")[0]}</p>
              <p className="text-[11px] font-bold text-secondary-foreground opacity-80 mt-0.5">{points.toLocaleString()} pts</p>
            </div>
            <ChevronRight size={18} className="text-secondary-foreground shrink-0 opacity-80" />
          </div>
        </div>
      </aside>

        {/* Close tab — only shown when sidebar is open */}
        {isOpen && (
          <button
            onClick={onToggle}
            className="absolute top-1/2 -translate-y-1/2 -right-5 z-50 lg:hidden
              w-5 h-14 bg-primary border-[2px] border-l-0 border-foreground
              rounded-r-lg flex items-center justify-center
              shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              hover:bg-primary/90 active:shadow-none active:translate-x-[1px]
              transition-all"
            aria-label="Close sidebar"
          >
            <ChevronLeft size={16} className="text-primary-foreground" />
          </button>
        )}
      </div>
    </>
  );
}
