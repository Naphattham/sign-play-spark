import { Category, Phrase, getPhrasesByCategory, isPhraseCompletedCheck } from "@/lib/categories";
import { CheckCircle } from "lucide-react";

interface PhraseSelectorProps {
  category: Category;
  activePhrase: Phrase | null;
  onSelect: (phrase: Phrase) => void;
  completedPhrases: Set<string>;
}

export function PhraseSelector({ category, activePhrase, onSelect, completedPhrases }: PhraseSelectorProps) {
  const categoryPhrases = getPhrasesByCategory(category);
  const completed = categoryPhrases.filter((p) => isPhraseCompletedCheck(p.id, completedPhrases)).length;

  return (
    <div className="brutal-card-lg overflow-hidden h-full flex flex-col">
      <div className="bg-primary border-b-[3px] border-foreground px-4 py-2 flex items-center justify-between">
        <h3 className="font-display text-lg text-primary-foreground">🎯 Phrases</h3>
        <span className="text-xs font-body font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded border-[2px] border-foreground">
          {completed}/{categoryPhrases.length}
        </span>
      </div>

      <div className="flex-1 p-3 grid grid-cols-2 gap-6 overflow-y-auto">
        {categoryPhrases.map((phrase) => {
          const isActive = activePhrase?.id === phrase.id;
          const isDone = isPhraseCompletedCheck(phrase.id, completedPhrases);
          const isUnlocked = true; // เปิดให้เล่นได้หมด หรือใส่ logic ตามต้องการ
          
          return (
            <button
              key={phrase.id}
              onClick={() => onSelect(phrase)}
              className={`
                relative flex items-center justify-between px-6 py-6 rounded-[20px] transition-all duration-150 select-none
                ${isUnlocked
                  ? "bg-[#F4CF4D] shadow-[0_8px_0_#EA6AA8] cursor-pointer active:shadow-none active:translate-y-[8px]"
                  : "bg-[#E5E5E5] shadow-[0_8px_0_#C0C0C0] cursor-not-allowed text-gray-400"
                }
              `}
            >
              {/* Left: Text */}
              <div className="flex flex-col">
                <h3 className="font-body text-2xl md:text-3xl text-black tracking-wide font-bold">
                  {phrase.text}
                </h3>
              </div>

              {/* Right: Stars */}
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  [1, 2, 3].map((starIndex) => (
                    <svg
                      key={starIndex}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-8 h-8 ${
                        isDone && starIndex <= 3
                          ? "text-white"
                          : "text-white/40"
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))
                ) : (
                  <span className="text-4xl opacity-40">🔒</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
