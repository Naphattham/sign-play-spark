import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Puzzle, FileSearch, Brain, Shield } from "lucide-react";

const gameCards = [
  {
    id: 1,
    icon: "extension",
    color: "bg-[#ffea00]",
    title: "Match & Sign",
    description: "ดูรูป เลือกท่า ฝึกจำคำศัพท์ โดยการเลือกวิดีโอภาษามือให้ตรงกับรูปภาพที่กำหนด",
    available: true,
    delay: "0ms",
  },
  {
    id: 2,
    icon: "find_in_page",
    color: "bg-[#ff79c6]",
    title: "Sign & Match",
    description: "ดูท่า เลือกรูป ฝึกแปลความหมาย โดยการเลือกรูปภาพให้ตรงกับวิดีโอภาษามือที่เห็น",
    available: true,
    delay: "100ms",
  },
  {
    id: 3,
    icon: "psychology",
    color: "bg-[#50fa7b]",
    title: "Sign Master Memory",
    description: "จับคู่วิดีโอภาษามือกับคำศัพท์ ยิ่ง Moves น้อย ยิ่งได้คะแนนสูง!",
    available: true,
    delay: "200ms",
  },
  {
    id: 4,
    icon: "shield",
    color: "bg-[#bd93f9]",
    title: "Sign Defender",
    description: "ทำท่า สู้มอนสเตอร์ เกมแอ็กชันใช้กล้องจริง ทำท่ามือให้ตรงกับคำบนตัวมอนสเตอร์",
    available: true,
    delay: "300ms",
  },
];

const iconMap: Record<number, React.ReactNode> = {
  1: <Puzzle className="text-black w-12 h-12 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3" />,
  2: <FileSearch className="text-black w-12 h-12 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3" />,
  3: <Brain className="text-black w-12 h-12 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3" />,
  4: <Shield className="text-black w-12 h-12 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3" />,
};


export function GameSetupPage() {

  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-12">

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">
            Challenge
          </h1>
          <div className="h-2 sm:h-3 w-20 sm:w-28 md:w-32 bg-primary mt-1 sm:mt-2" />
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
            เลือกเกมที่คุณสนใจ แล้วไปสนุกกัน!
          </p>
        </div>

        {/* Game Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {gameCards.map((card) => {
              const isLocked = !card.available || ((card.id === 3 || card.id === 4) && !isDesktop);

              return (
                <div
                  key={card.id}
                  className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 md:gap-4 group
                    hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_hsl(0_0%_0%)]
                    transition-all duration-300 ease-in-out
                    animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDuration: "500ms", animationDelay: card.delay }}
                >
                  {/* Icon Box */}
                  <div
                    className={`aspect-square w-full neo-brutalism-sm ${card.color} flex items-center justify-center rounded-lg overflow-hidden relative
                      transition-all duration-300 ease-in-out group-hover:scale-[1.03]`}
                  >
                    {iconMap[card.id]}
                    {!card.available && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-white/90 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    {((card.id === 3 || card.id === 4) && !isDesktop) && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-white/90 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                          Desktop Only
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-black uppercase mb-0.5 sm:mb-1 group-hover:text-primary transition-colors duration-300 ease-in-out">
                      {card.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-medium opacity-70 line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  {/* Button */}
                  <button
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;
                      if (card.id === 1) navigate("/match-and-sign");
                      else if (card.id === 2) navigate("/sign-and-match");
                      else if (card.id === 3) navigate("/sign-master-memory");
                      else if (card.id === 4) navigate("/sign-defender");
                    }}
                    className={`
                      neo-brutalism py-2 text-sm font-black uppercase
                      transition-all duration-300 ease-in-out
                      ${!isLocked
                        ? "bg-primary text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:brightness-110 cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      }
                    `}
                  >
                    {!isLocked ? "Play Now" : "Locked"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}

