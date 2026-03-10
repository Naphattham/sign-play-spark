import { Trophy, Medal, Award } from "lucide-react";
import { leaderboardData } from "@/lib/categories";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-secondary-foreground" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-5 h-5 text-accent" />;
  return <span className="font-display text-sm">{rank}</span>;
};

export function LeaderboardView() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="brutal-card-lg overflow-hidden">
        <div className="bg-secondary border-b-[3px] border-foreground px-6 py-4">
          <h2 className="font-display text-2xl text-secondary-foreground flex items-center gap-2">
            <Trophy className="w-7 h-7" />
            Leaderboard
          </h2>
        </div>

        <div className="divide-y-[2px] divide-foreground">
          {leaderboardData.map((entry, i) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 px-6 py-3 font-body transition-all animate-slide-up ${
                i < 3 ? "bg-secondary/20" : "bg-card"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg border-[2px] border-foreground bg-card" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {rankIcon(entry.rank)}
              </div>
              <span className="flex-1 font-semibold">{entry.username}</span>
              <span className="font-display text-primary text-lg">{entry.points.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
