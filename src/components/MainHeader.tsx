import { LogOut, User, Menu } from "lucide-react";
import { View, categoryIconMap, trophyImg, questImg, challengeImg, lessonImg } from "@/lib/gameConstants";
import { categories } from "@/lib/categories";
import homeImg from "@/asset/image/Home_Icon.png";

interface MainHeaderProps {
  view: View;
  category: string;
  onMenuOpen: () => void;
  onLogout: () => void;
}

export const MainHeader = ({ view, category, onMenuOpen, onLogout }: MainHeaderProps) => {
  return (
    <header className="border-b-[3px] border-foreground bg-card px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          className="lg:hidden shrink-0 p-1.5 -ml-1 rounded-md touch-manipulation active:bg-foreground/10 hover:bg-foreground/10 transition-colors"
          onClick={onMenuOpen}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {view === "home" && (
          <>
            <img src={homeImg} alt="Home" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Home</h2>
          </>
        )}
        {view === "lessons" && (
          <>
            <img src={lessonImg} alt="Lessons" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Lessons</h2>
          </>
        )}
        {view === "leaderboard" && (
          <>
            <img src={trophyImg} alt="Leaderboard" className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Leaderboard</h2>
          </>
        )}
        {view === "quest" && (
          <>
            <img src={questImg} alt="Quest" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Quest</h2>
          </>
        )}
        {view === "profile" && (
          <>
            <User size={18} className="text-foreground shrink-0 sm:w-5 sm:h-5" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Profile</h2>
          </>
        )}
        {view === "gamesetup" && (
          <>
            <img src={challengeImg} alt="Play Game" className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">Challenge</h2>
          </>
        )}
        {view === "game" && (
          <>
            <img src={categoryIconMap[category]} alt={category} className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0" />
            <h2 className="font-display text-sm sm:text-base md:text-xl text-foreground truncate">
              {categories.find(c => c.id === category)?.label || category}
            </h2>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onLogout}
          className="brutal-btn-secondary flex items-center gap-1.5 text-xs sm:text-sm font-body touch-manipulation min-h-[36px] px-2.5 sm:px-4"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
