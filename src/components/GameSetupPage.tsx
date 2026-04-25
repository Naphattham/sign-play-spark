import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Puzzle, FileSearch, Brain, Shield,
  Gamepad2, Sparkles, Monitor, Lock, ArrowRight, Zap,
} from "lucide-react";

/* ─── Game Data ─── */
const gameCards = [
  {
    id: 1,
    title: "Match & Sign",
    subtitle: "Visual Matching",
    description: "ดูรูป เลือกท่า ฝึกจำคำศัพท์ โดยการเลือกวิดีโอภาษามือให้ตรงกับรูปภาพที่กำหนด",
    available: true,
    desktopOnly: false,
    color: "hsl(48 100% 55%)",
    colorLight: "hsl(48 100% 92%)",
    gradient: "from-yellow-300 via-amber-300 to-orange-300",
    route: "/match-and-sign",
    difficulty: "Easy",
  },
  {
    id: 2,
    title: "Sign & Match",
    subtitle: "Translation Skills",
    description: "ดูท่า เลือกรูป ฝึกแปลความหมาย โดยการเลือกรูปภาพให้ตรงกับวิดีโอภาษามือที่เห็น",
    available: true,
    desktopOnly: false,
    color: "hsl(330 85% 65%)",
    colorLight: "hsl(330 85% 93%)",
    gradient: "from-pink-300 via-rose-300 to-fuchsia-300",
    route: "/sign-and-match",
    difficulty: "Medium",
  },
  {
    id: 3,
    title: "Sign Master Memory",
    subtitle: "Memory Challenge",
    description: "จับคู่วิดีโอภาษามือกับคำศัพท์ ยิ่ง Moves น้อย ยิ่งได้คะแนนสูง!",
    available: true,
    desktopOnly: true,
    color: "hsl(142 70% 50%)",
    colorLight: "hsl(142 70% 92%)",
    gradient: "from-emerald-300 via-green-300 to-teal-300",
    route: "/sign-master-memory",
    difficulty: "Hard",
  },
  {
    id: 4,
    title: "Sign Defender",
    subtitle: "Action Game",
    description: "ทำท่า สู้มอนสเตอร์ เกมแอ็กชันใช้กล้องจริง ทำท่ามือให้ตรงกับคำบนตัวมอนสเตอร์",
    available: true,
    desktopOnly: true,
    color: "hsl(265 80% 65%)",
    colorLight: "hsl(265 80% 93%)",
    gradient: "from-violet-300 via-purple-300 to-indigo-300",
    route: "/sign-defender",
    difficulty: "Expert",
  },
];

const iconMap: Record<number, (locked: boolean) => React.ReactNode> = {
  1: (locked) => <Puzzle className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-500 ${locked ? "text-foreground/30" : "text-foreground"}`} strokeWidth={2.5} />,
  2: (locked) => <FileSearch className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-500 ${locked ? "text-foreground/30" : "text-foreground"}`} strokeWidth={2.5} />,
  3: (locked) => <Brain className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-500 ${locked ? "text-foreground/30" : "text-foreground"}`} strokeWidth={2.5} />,
  4: (locked) => <Shield className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-500 ${locked ? "text-foreground/30" : "text-foreground"}`} strokeWidth={2.5} />,
};

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-300",
  Medium: "bg-amber-100 text-amber-700 border-amber-300",
  Hard: "bg-red-100 text-red-700 border-red-300",
  Expert: "bg-violet-100 text-violet-700 border-violet-300",
};

/* ─── Component ─── */
export function GameSetupPage() {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const availableCount = gameCards.filter(
    (c) => c.available && !(c.desktopOnly && !isDesktop)
  ).length;

  return (
    <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">

        {/* ━━━ HEADER ━━━ */}
        <header
          className={`transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {/* Top badge row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-foreground text-background px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg">
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
                Game Center
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-primary/20">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-primary" />
              <span className="text-[10px] sm:text-xs font-bold">
                {availableCount}/{gameCards.length} พร้อมเล่น
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
            Challenge
          </h1>
          <div className="h-2 sm:h-3 w-20 sm:w-28 md:w-32 bg-primary mt-1.5 sm:mt-2 rounded-sm" />
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2 sm:mt-3 max-w-lg">
            เลือกโหมดเกมที่สนใจ ฝึกฝนทักษะภาษามือ แล้วมาสนุกไปด้วยกัน!
          </p>
        </header>

        {/* ━━━ GAME CARDS GRID ━━━ */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {gameCards.map((card, index) => {
              const isLocked = !card.available || (card.desktopOnly && !isDesktop);

              return (
                <div
                  key={card.id}
                  className={`
                    relative group flex flex-col rounded-xl
                    border-[3px] border-foreground
                    bg-card
                    transition-all duration-400 ease-out
                    ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                    ${!isLocked
                      ? "hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_hsl(0_0%_0%)]"
                      : "cursor-not-allowed"
                    }
                  `}
                  style={{
                    boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)",
                    transitionDelay: `${150 + index * 100}ms`,
                  }}
                  onMouseEnter={() => setHoveredId(card.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* ── Icon Hero Area ── */}
                  <div
                    className={`
                      relative h-40 sm:h-44 md:h-48 w-full
                      flex items-center justify-center
                      rounded-t-[9px] overflow-hidden
                      transition-all duration-500
                      ${isLocked ? "grayscale opacity-60" : ""}
                    `}
                    style={{
                      background: isLocked
                        ? "hsl(var(--muted))"
                        : `linear-gradient(135deg, ${card.colorLight}, ${card.color}20)`,
                    }}
                  >
                    {/* Decorative bg circles */}
                    <div
                      className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-20 transition-transform duration-700 group-hover:scale-125"
                      style={{ background: card.color }}
                    />
                    <div
                      className="absolute -bottom-3 -left-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full opacity-15 transition-transform duration-700 group-hover:scale-110"
                      style={{ background: card.color }}
                    />

                    {/* Icon container with ring */}
                    <div
                      className={`
                        relative z-10 w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18
                        rounded-xl border-[3px] border-foreground
                        flex items-center justify-center
                        transition-all duration-500
                        group-hover:scale-110 group-hover:rotate-3
                      `}
                      style={{
                        background: isLocked ? "hsl(var(--muted))" : card.colorLight,
                        boxShadow: isLocked ? "none" : `3px 3px 0px 0px hsl(0 0% 0%)`,
                      }}
                    >
                      {iconMap[card.id](isLocked)}

                      {/* Sparkle indicator */}
                      {!isLocked && hoveredId === card.id && (
                        <Sparkles className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 text-primary animate-bounce" />
                      )}
                    </div>

                    {/* Locked overlay badge */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center z-20">
                        <div className="flex items-center gap-1.5 bg-foreground text-background px-3 py-1.5 rounded-lg border-2 border-foreground shadow-[2px_2px_0px_0px_hsl(0_0%_0%/0.3)]">
                          {!card.available ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                                Coming Soon
                              </span>
                            </>
                          ) : (
                            <>
                              <Monitor className="w-3.5 h-3.5" />
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                                Desktop Only
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ── Content Area ── */}
                  <div className="flex-1 flex flex-col p-2.5 sm:p-3 gap-1.5 sm:gap-2">
                    {/* Subtitle */}
                    <span
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors duration-300"
                      style={{ color: isLocked ? "hsl(var(--muted-foreground))" : card.color }}
                    >
                      {card.subtitle}
                    </span>

                    {/* Title */}
                    <h3 className={`text-base sm:text-lg font-black uppercase leading-tight transition-colors duration-300 ${isLocked ? "text-muted-foreground" : "group-hover:text-primary"
                      }`}>
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-[10px] sm:text-xs font-medium leading-relaxed line-clamp-2 ${isLocked ? "text-muted-foreground/50" : "text-muted-foreground"
                      }`}>
                      {card.description}
                    </p>

                    {/* Spacer */}
                    <div className="flex-1 min-h-0" />

                    {/* Action Button */}
                    <button
                      disabled={isLocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) navigate(card.route);
                      }}
                      className={`
                        w-full py-2 sm:py-2.5 rounded-lg
                        border-[3px] border-foreground
                        text-xs sm:text-sm font-black uppercase tracking-wider
                        flex items-center justify-center gap-2
                        transition-all duration-300 ease-out
                        ${!isLocked
                          ? "bg-primary text-primary-foreground hover:brightness-110 hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                        }
                      `}
                      style={{
                        boxShadow: isLocked ? "none" : "3px 3px 0px 0px hsl(0 0% 0%)",
                      }}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Locked
                        </>
                      ) : (
                        <>
                          Play Now
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ━━━ MOBILE INFO BANNER ━━━ */}
        {!isDesktop && (
          <div
            className={`
              brutal-card bg-foreground text-background p-3 sm:p-4 rounded-xl
              flex items-start gap-3
              transition-all duration-700 ease-out
              ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
            style={{ transitionDelay: "700ms" }}
          >
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold">
                บางเกมรองรับเฉพาะ Desktop
              </p>
              <p className="text-[10px] sm:text-xs text-background/60 font-medium mt-0.5">
                Sign Master Memory และ Sign Defender ต้องใช้กล้องเว็บแคม จึงเปิดเฉพาะบนคอมพิวเตอร์
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
