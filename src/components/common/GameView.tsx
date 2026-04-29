import { ArrowLeft, Check } from "lucide-react";
import { Category, Phrase, getPhrasesByCategory, isPhraseCompletedCheck } from "@/lib/categories";
import { phraseIconMap } from "@/lib/gameConstants";

interface GameViewProps {
  category: Category;
  completedPhrases: Set<string>;
  onBack: () => void;
  onPhraseSelect: (phrase: Phrase) => void;
}

export const GameView = ({ category, completedPhrases, onBack, onPhraseSelect }: GameViewProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-10 pb-24 sm:pb-32">
      {/* Header — slide down */}
      <div
        className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 md:mb-10 mt-1"
        style={{ animation: "slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <button
          onClick={onBack}
          className="shrink-0 flex items-center gap-1 sm:gap-1.5 font-black brutal-btn-secondary px-2.5 py-1.5 sm:px-3 sm:py-2 touch-manipulation transition-transform text-xs sm:text-sm hover:-translate-x-1 active:scale-95"
        >
          <ArrowLeft size={15} className="sm:w-4 sm:h-4 shrink-0" />
          <span>กลับ</span>
        </button>
        <p className="flex-1 text-slate-800 dark:text-white font-black uppercase tracking-wide sm:tracking-widest text-sm sm:text-lg md:text-2xl lg:text-3xl text-center drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)] truncate">
          UNIT {category === "general" ? "1" : category === "emotions" ? "2" : category === "qa" ? "3" : "4"}: {category.toUpperCase()}
        </p>
        <div className="shrink-0 w-[60px] sm:w-[72px]" aria-hidden />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {getPhrasesByCategory(category).map((phrase, index) => {
          const isCompleted = isPhraseCompletedCheck(phrase.id, completedPhrases);
          const delay = `${0.08 + index * 0.06}s`;

          return (
            <div
              key={phrase.id}
              onClick={() => onPhraseSelect(phrase)}
              style={{
                animation: `fadeInUp 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay} both`,
              }}
              className={`relative brutal-card flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 md:p-4 pr-8 sm:pr-10 cursor-pointer
                transition-all touch-manipulation
                hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                active:scale-[0.96] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-800'}`}
            >
              {/* Badge — pop in */}
              {isCompleted ? (
                <div
                  className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 bg-green-500 text-white font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 rounded-full border-[2px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 flex items-center gap-1"
                  style={{ animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${parseFloat(delay) + 0.2}s both` }}
                >
                  <Check size={11} strokeWidth={4} className="shrink-0" />
                  <span>ผ่าน {phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} คะแนน</span>
                </div>
              ) : (
                <div
                  className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 bg-[#f94fa4] text-white font-black text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 rounded-full border-[2px] border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10"
                  style={{ animation: `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${parseFloat(delay) + 0.2}s both` }}
                >
                  +{phrase.id === "g1" || phrase.id === "g4" || phrase.id === "g6" ? "200" : "100"} pts
                </div>
              )}

              {/* Icon — wiggle on card hover */}
              <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-accent/20 brutal-card flex items-center justify-center shrink-0 p-1 transition-transform duration-200 group-hover:rotate-[-5deg] group-hover:scale-110">
                {phraseIconMap[phrase.id] ? (
                  <img src={phraseIconMap[phrase.id]} alt={phrase.text} className="w-full h-full object-contain drop-shadow-sm" />
                ) : (
                  <span className="text-2xl">{phrase.emoji || "✋"}</span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base md:text-lg lg:text-xl leading-tight truncate">{phrase.text}</h3>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs md:text-sm mt-0.5 truncate">{phrase.english || phrase.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};