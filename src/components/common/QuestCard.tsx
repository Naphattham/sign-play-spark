import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export type QuestStatus = "locked" | "claimable" | "claimed";

interface QuestCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  points: number;
  status: QuestStatus;
  progressLabel: string;
  progressPercent: number;
  category: "DAILY" | "ONE-TIME";
  categoryColor: string;
  accentColor: string;
  delay: number;
  claiming: boolean;
  onClaim: () => void;
  lockedLabel?: string;
}

export function QuestCard({
  title, description, icon, points, status, progressLabel,
  progressPercent, category, categoryColor, accentColor,
  delay, claiming, onClaim, lockedLabel,
}: QuestCardProps) {
  const isClaimed = status === "claimed";
  const isClaimable = status === "claimable";

  const cardBg = isClaimed
    ? "bg-green-50 dark:bg-green-900/20"
    : isClaimable
      ? "bg-gradient-to-br from-[#fff8ee] to-[#fff0f6] dark:from-slate-800 dark:to-slate-800"
      : "bg-white dark:bg-slate-800";

  return (
    <div
      className={`quest-card-enter group relative ${cardBg} border-[3px] border-foreground rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${isClaimable ? "quest-glow-pulse" : ""}`}
      style={{
        animationDelay: `${delay}ms`,
        boxShadow: isClaimable ? undefined : "4px 4px 0px 0px hsl(0 0% 0%)",
      }}
    >
      {/* Top accent stripe */}
      <div className="h-1.5 sm:h-2 w-full" style={{ background: isClaimed ? "#22c55e" : accentColor }} />

      {/* Diagonal stripe overlay for claimable */}
      {isClaimable && <div className="absolute inset-0 quest-stripe-active pointer-events-none" />}

      <div className="p-3 sm:p-4 md:p-5 relative">
        {/* Header row */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div
            className={`shrink-0 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-lg border-[3px] border-foreground flex items-center justify-center ${isClaimable ? "quest-icon-float" : ""}`}
            style={{
              background: isClaimed ? "#bbf7d0" : accentColor,
              boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)",
            }}
          >
            {isClaimed ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-700 quest-check-pop" />
            ) : (
              <span className="text-white [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">{icon}</span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border-[2px] border-foreground"
                style={{ background: categoryColor }}
              >
                {category}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-primary">
                +{points} PTS
              </span>
            </div>
            <h4 className="text-sm sm:text-base md:text-lg font-black uppercase leading-tight line-clamp-1">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        {/* Progress section */}
        <div className="mt-3 sm:mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-muted-foreground">
              ความคืบหน้า
            </span>
            <span className="text-[10px] sm:text-xs font-black">
              {isClaimed ? "สำเร็จแล้ว ✓" : progressLabel}
            </span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 border-[2px] border-foreground rounded-sm overflow-hidden relative">
            <div
              className="h-full transition-all duration-700 ease-out rounded-sm relative"
              style={{
                width: `${progressPercent}%`,
                background: isClaimed
                  ? "#22c55e"
                  : `linear-gradient(90deg, ${accentColor}, ${accentColor}dd)`,
              }}
            >
              {!isClaimed && progressPercent > 0 && (
                <div className="absolute inset-0 quest-progress-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="mt-3 sm:mt-4">
          {isClaimed ? (
            <button
              disabled
              className="w-full py-2 sm:py-2.5 bg-green-100 dark:bg-green-900/30 border-[3px] border-foreground rounded-lg font-black uppercase text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 text-green-700 dark:text-green-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              รับรางวัลแล้ว!
            </button>
          ) : isClaimable ? (
            <button
              onClick={onClaim}
              disabled={claiming}
              className="w-full py-2 sm:py-2.5 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase text-xs sm:text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-200 quest-claim-burst"
              style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}
            >
              {claiming ? "กำลังรับรางวัล..." : `รับรางวัล ${points} คะแนน!`}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 border-[3px] border-foreground rounded-lg font-black uppercase text-[10px] sm:text-xs cursor-not-allowed opacity-60"
            >
              {lockedLabel || "กำลังดำเนินการ..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
