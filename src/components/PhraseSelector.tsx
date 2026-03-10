import { Category, getPhrasesByCategory, Phrase } from "@/lib/categories";
import { CheckCircle } from "lucide-react";

interface PhraseSelectorProps {
  category: Category;
  activePhrase: Phrase | null;
  onSelect: (phrase: Phrase) => void;
  completedPhrases: Set<string>;
}

export function PhraseSelector({ category, activePhrase, onSelect, completedPhrases }: PhraseSelectorProps) {
  const categoryPhrases = getPhrasesByCategory(category);
  const completed = categoryPhrases.filter((p) => completedPhrases.has(p.id)).length;

  return (
    <div className="brutal-card-lg overflow-hidden">
      <div className="bg-primary border-b-[3px] border-foreground px-4 py-2 flex items-center justify-between">
        <h3 className="font-display text-lg text-primary-foreground">🎯 Phrases</h3>
        <span className="text-xs font-body font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded border-[2px] border-foreground">
          {completed}/{categoryPhrases.length}
        </span>
      </div>

      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto">
        {categoryPhrases.map((phrase) => {
          const isActive = activePhrase?.id === phrase.id;
          const isDone = completedPhrases.has(phrase.id);
          return (
            <button
              key={phrase.id}
              onClick={() => onSelect(phrase)}
              className={`relative px-3 py-2 rounded-lg border-[2px] border-foreground text-sm font-body font-semibold transition-all ${
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : isDone
                  ? "bg-muted text-muted-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
              style={isActive ? { boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" } : {}}
            >
              {isDone && <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-primary fill-primary" />}
              {phrase.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
