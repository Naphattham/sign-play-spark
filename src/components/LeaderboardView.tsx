import { useMemo } from "react";
import { Trophy, Crown, ChevronUp } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import firstPlaceImg from "@/asset/image/1st.webp";
import secondPlaceImg from "@/asset/image/2nd.webp";
import thirdPlaceImg from "@/asset/image/3rd.webp";

/* ── Helper: avatar with fallback ── */
function AvatarImg({
  src,
  username,
  className,
}: {
  src?: string;
  username: string;
  className?: string;
}) {
  return (
    <img
      src={src || getAvatarUrl(null, username)}
      alt={username}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        img.src = getAvatarUrl(null, username);
      }}
    />
  );
}

/* ─────────────────────────────────────────────
 *  3D Podium Block — realistic box with
 *  top face, front face, right-side face
 * ───────────────────────────────────────────── */
function PodiumBlock({
  rank,
  height,
  color,
  darkColor,
  topColor,
  delay,
}: {
  rank: 1 | 2 | 3;
  height: number;          // px on mobile, scaled up on larger screens
  color: string;           // front face
  darkColor: string;       // side face (darker)
  topColor: string;        // top face (lighter)
  delay: string;
}) {
  return (
    <div
      className="lb-podium-rise relative"
      style={{
        animationDelay: delay,
        width: "100%",
        height: `${height}px`,
      }}
    >
      {/* ── Top face (3D depth illusion) ── */}
      <div
        className="absolute left-0 bottom-full w-full h-[10px] sm:h-[14px] border-[3px] border-b-0 border-foreground origin-bottom-left rounded-lg z-0"
        style={{
          background: topColor,
          transform: "skewX(-45deg)",
        }}
      />

      {/* ── Right side face (3D depth illusion) ── */}
      <div
        className="absolute left-full bottom-0 h-full w-[10px] sm:w-[14px] border-[3px] border-l-0 border-foreground origin-bottom-left rounded-r-lg rounded-tl-lg z-0"
        style={{
          background: darkColor,
          transform: "skewY(-45deg)",
        }}
      />

      {/* ── Back Corner Gap Patch ── */}
      <div
        className="absolute -top-[10px] sm:-top-[14px] -right-[10px] sm:-right-[14px] w-[16px] sm:w-[20px] h-[16px] sm:h-[20px] bg-foreground rounded-tr-[6px] sm:rounded-tr-[8px] z-[-1]"
      />

      {/* ── Front face ── */}
      <div
        className="absolute inset-0 border-[3px] border-foreground overflow-hidden rounded-t-lg z-10"
        style={{
          background: color,
          boxShadow: "inset 0 2px 20px rgba(255,255,255,0.15)",
        }}
      >
        {/* Vertical highlight stripe */}
        <div
          className="absolute top-0 bottom-0 opacity-10"
          style={{
            left: "15%",
            width: "20%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-[6px]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
          }}
        />
        {/* Rank number watermark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-black select-none"
            style={{
              fontSize: `${Math.max(height * 0.55, 32)}px`,
              opacity: 0.12,
              color: "rgba(0,0,0,0.5)",
              lineHeight: 1,
            }}
          >
            {rank}
          </span>
        </div>
        {/* Shimmer for #1 */}
        {rank === 1 && <div className="absolute inset-0 lb-shimmer" />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 *  Podium Contestant — avatar card above podium
 * ───────────────────────────────────────────── */
function PodiumContestant({
  entry,
  rank,
  badgeImg,
  badgeAlt,
  podiumHeight,
}: {
  entry: { username: string; points: number; photoURL?: string } | undefined;
  rank: 1 | 2 | 3;
  badgeImg: string;
  badgeAlt: string;
  podiumHeight: number;
}) {
  if (!entry) return null;

  const config = {
    1: {
      avatarSize: "w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20",
      nameSize: "text-[10px] sm:text-xs md:text-sm",
      pointsSize: "text-xs sm:text-sm md:text-base",
      badgeSize: "w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11",
      delay: "0ms",
      order: "order-2",
      containerW: "w-[32%] sm:w-[30%] md:w-[28%] max-w-[200px]",
      color: "hsl(44 100% 70%)",
      darkColor: "hsl(44 80% 50%)",
      topColor: "hsl(44 100% 78%)",
      glowClass: "lb-glow-ring",
    },
    2: {
      avatarSize: "w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16",
      nameSize: "text-[10px] sm:text-xs md:text-sm",
      pointsSize: "text-[10px] sm:text-xs md:text-sm",
      badgeSize: "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9",
      delay: "150ms",
      order: "order-1",
      containerW: "w-[30%] sm:w-[28%] md:w-[26%] max-w-[180px]",
      color: "hsl(220 10% 82%)",
      darkColor: "hsl(220 10% 62%)",
      topColor: "hsl(220 15% 90%)",
      glowClass: "",
    },
    3: {
      avatarSize: "w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16",
      nameSize: "text-[10px] sm:text-xs md:text-sm",
      pointsSize: "text-[10px] sm:text-xs md:text-sm",
      badgeSize: "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9",
      delay: "250ms",
      order: "order-3",
      containerW: "w-[30%] sm:w-[28%] md:w-[26%] max-w-[180px]",
      color: "hsl(25 60% 62%)",
      darkColor: "hsl(25 50% 42%)",
      topColor: "hsl(25 65% 72%)",
      glowClass: "",
    },
  }[rank];

  return (
    <div className={`flex flex-col items-center ${config.order} ${config.containerW}`}>
      {/* ── Player info above podium ── */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 mb-4 sm:mb-6">
        {/* Badge image */}
        <div
          className="lb-badge-pop"
          style={{ animationDelay: `${parseInt(config.delay) + 300}ms` }}
        >
          <img
            src={badgeImg}
            alt={badgeAlt}
            className={`${config.badgeSize} object-contain ${rank === 1 ? "lb-crown-float" : ""}`}
          />
        </div>

        {/* Avatar with ring */}
        <div className="relative">
          {rank === 1 && (
            <div className="absolute -inset-1.5 sm:-inset-2 rounded-full bg-gradient-to-br from-secondary via-primary to-secondary opacity-30 blur-sm animate-pulse" />
          )}
          <div
            className={`relative ${config.avatarSize} rounded-full border-[3px] sm:border-[4px] border-foreground overflow-hidden ${rank === 1 ? config.glowClass : ""}`}
            style={{
              boxShadow: rank !== 1 ? "3px 3px 0px 0px hsl(0 0% 0%)" : undefined,
            }}
          >
            <AvatarImg
              src={entry.photoURL}
              username={entry.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Name */}
        <p
          className={`font-black ${config.nameSize} text-center w-20 sm:w-24 md:w-32 break-words leading-tight mt-1.5 sm:mt-2 md:mt-3`}
        >
          {entry.username?.toUpperCase()}
        </p>

        {/* Points */}
        <div
          className="lb-count-up flex items-center gap-0.5"
          style={{ animationDelay: `${parseInt(config.delay) + 500}ms` }}
        >
          <span className={`font-display font-black ${config.pointsSize} text-primary`}>
            {entry.points.toLocaleString()}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            pts
          </span>
        </div>
      </div>

      {/* ── 3D Podium block ── */}
      <PodiumBlock
        rank={rank}
        height={podiumHeight}
        color={config.color}
        darkColor={config.darkColor}
        topColor={config.topColor}
        delay={config.delay}
      />
    </div>
  );
}

/* ── Leaderboard row for rank 4+ ── */
function LeaderboardRow({
  entry,
  index,
}: {
  entry: { rank: number; username: string; points: number; photoURL?: string };
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={`
        lb-entry-slide group
        flex items-center gap-2 sm:gap-3 md:gap-4
        px-3 sm:px-4 md:px-5
        py-1.5 sm:py-2 md:py-2.5
        font-body transition-all duration-200
        ${isEven ? "bg-card" : "bg-muted/30"}
        hover:bg-secondary/20 hover:translate-x-1
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Rank number */}
      <div className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center shrink-0">
        <span className="font-display font-black text-xs sm:text-sm text-muted-foreground group-hover:text-primary transition-colors">
          {entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-[2px] sm:border-[3px] border-foreground overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}
      >
        <AvatarImg
          src={entry.photoURL}
          username={entry.username}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Username */}
      <span className="flex-1 font-bold break-words text-xs sm:text-sm md:text-base group-hover:text-primary transition-colors">
        {entry.username}
      </span>

      {/* Points */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-display font-black text-primary text-sm sm:text-base md:text-lg">
          {entry.points.toLocaleString()}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
          pts
        </span>
      </div>

      {/* Hover indicator */}
      <ChevronUp className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity -rotate-90 shrink-0 hidden sm:block" />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  MAIN COMPONENT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function LeaderboardView() {
  const { leaderboardData, loading: dataLoading } = useLeaderboard();

  const topThree = useMemo(
    () => leaderboardData.filter((entry) => entry.rank <= 3),
    [leaderboardData]
  );
  const rest = useMemo(
    () => leaderboardData.filter((entry) => entry.rank > 3),
    [leaderboardData]
  );
  const getTop = (rank: number) => topThree.find((e) => e.rank === rank);

  /* ── Loading state ── */
  if (dataLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64 sm:h-80">
        <div className="text-center brutal-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 lb-shimmer" />
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
              <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground font-bold font-body text-sm sm:text-base">
              กำลังโหลดอันดับผู้เล่น...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (leaderboardData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64 sm:h-80 px-4">
        <div className="text-center brutal-card-lg p-6 sm:p-10 relative overflow-hidden">
          <div className="relative">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-muted border-[3px] border-foreground flex items-center justify-center"
              style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-black text-lg sm:text-xl mb-2">
              ยังไม่มีข้อมูลผู้เล่น
            </h3>
            <p className="text-muted-foreground font-body text-sm sm:text-base">
              เริ่มเล่นเกมเพื่อติดอันดับกันเถอะ! 🚀
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-full px-2 sm:px-4 md:px-0 gap-3 sm:gap-4 pb-24 sm:pb-6 md:pb-0">

      {/* ─── 3D Podium for Top 3 ─── */}
      <div className="relative pt-1 sm:pt-2 shrink-0">
        {/* Stage floor gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-foreground/5 via-foreground/3 to-transparent rounded-b-2xl pointer-events-none" />
        {/* Spotlight glow behind #1 */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[40%] h-[60%] bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-end justify-center gap-2.5 sm:gap-3.5 md:gap-5 px-2 sm:px-4 pb-2 sm:pb-3">
          <PodiumContestant
            entry={getTop(2)}
            rank={2}
            badgeImg={secondPlaceImg}
            badgeAlt="2nd Place"
            podiumHeight={56}
          />
          <PodiumContestant
            entry={getTop(1)}
            rank={1}
            badgeImg={firstPlaceImg}
            badgeAlt="1st Place"
            podiumHeight={90}
          />
          <PodiumContestant
            entry={getTop(3)}
            rank={3}
            badgeImg={thirdPlaceImg}
            badgeAlt="3rd Place"
            podiumHeight={40}
          />
        </div>
      </div>

      {/* ─── Rest of leaderboard ─── */}
      {rest.length > 0 && (
        <div className="brutal-card-lg overflow-hidden relative flex-1 min-h-0 flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-foreground text-background shrink-0">
            <div className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-display font-black text-xs sm:text-sm uppercase tracking-wider">
                อันดับผู้เล่น
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold opacity-60 uppercase tracking-wider">
              #{rest[0]?.rank} – #{rest[rest.length - 1]?.rank}
            </span>
          </div>

          {/* Scrollable list */}
          <div className="divide-y-[2px] divide-foreground/10 overflow-y-auto flex-1 min-h-0 lb-scroll">
            {rest.map((entry, i) => (
              <LeaderboardRow key={entry.rank} entry={entry} index={i} />
            ))}
          </div>

          {/* Bottom fade hint */}
          {rest.length > 5 && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
}