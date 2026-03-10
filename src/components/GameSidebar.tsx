import { Hand, Heart, HelpCircle, Thermometer, Trophy, Menu, X, User } from "lucide-react";
import { Category, categories } from "@/lib/categories";

const iconMap: Record<string, React.ElementType> = {
  Hand,
  Heart,
  HelpCircle,
  Thermometer,
};

interface GameSidebarProps {
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  showLeaderboard: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function GameSidebar({
  activeCategory,
  onCategoryChange,
  onLeaderboard,
  onProfile,
  showLeaderboard,
  isOpen,
  onToggle,
}: GameSidebarProps) {
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
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-primary border-r-[3px] border-foreground flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b-[3px] border-foreground">
          <h1 className="text-2xl font-display text-primary-foreground tracking-wide flex items-center gap-2">
            <Hand className="w-7 h-7" />
            SignQuest
          </h1>
          <p className="text-primary-foreground/80 text-sm mt-1 font-body">Learn. Sign. Level Up!</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-wider mb-3 font-body">
            Categories
          </p>
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon];
            const isActive = activeCategory === cat.id && !showLeaderboard;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                  isActive
                    ? "bg-secondary text-secondary-foreground shadow-brutal-sm translate-x-0"
                    : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
                style={isActive ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
              >
                <Icon size={18} />
                {cat.label}
              </button>
            );
          })}

          <div className="pt-4 border-t-[2px] border-primary-foreground/20 mt-4">
            <button
              onClick={onLeaderboard}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[2px] border-foreground font-semibold text-sm transition-all font-body ${
                showLeaderboard
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              }`}
              style={showLeaderboard ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              <Trophy size={18} />
              Leaderboard
            </button>
          </div>
        </nav>

        <div className="p-4 border-t-[3px] border-foreground">
          <button
            onClick={onProfile}
            className="w-full brutal-btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            <User size={16} />
            Profile
          </button>
        </div>
      </aside>
    </>
  );
}
