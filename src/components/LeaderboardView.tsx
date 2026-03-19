import { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-secondary-foreground" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-5 h-5 text-accent" />;
  return <span className="font-display text-sm">{rank}</span>;
};

export function LeaderboardView() {
  const { leaderboardData, loading: dataLoading } = useLeaderboard();
  
  // 🚨 State ใหม่สำหรับเช็คว่าโหลดรูปเสร็จหรือยัง
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  useEffect(() => {
    // ถ้าข้อมูล Firebase ยังมาไม่ถึง ให้รอไปก่อน
    if (dataLoading) return;

    // ถ้าไม่มีข้อมูลผู้เล่นเลย ก็ไม่ต้องรอโหลดรูป
    if (leaderboardData.length === 0) {
      setImagesPreloaded(true);
      return;
    }

    // 🚨 เริ่มกระบวนการ Preload รูปภาพทั้งหมด
    let loadedCount = 0;
    
    // ดึง URL ทั้งหมดออกมา (ถ้ารูปโปรไฟล์ไม่มี ให้ดึงรูป Default Avatar แทน)
    const urlsToLoad = leaderboardData.map(
      (entry) => entry.photoURL || getAvatarUrl(null, entry.username || "user")
    );
    const totalUrls = urlsToLoad.length;

    urlsToLoad.forEach((url) => {
      const img = new Image();
      img.src = url;

      // นับจำนวนรูปที่โหลดเสร็จ (ไม่ว่าจะสำเร็จหรือ Error ก็ให้นับ เพื่อไม่ให้หน้าจอค้าง)
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalUrls) setImagesPreloaded(true);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalUrls) setImagesPreloaded(true);
      };
    });
  }, [leaderboardData, dataLoading]);

  // 🚨 เช็ค Loading ควบ 2 เงื่อนไข (รอข้อมูล + รอกระบวนการ Preload รูปเสร็จ)
  if (dataLoading || !imagesPreloaded) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-bold font-body">กำลังโหลดอันดับผู้เล่น...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboardData.filter(entry => entry.rank <= 3);
  const rest = leaderboardData.filter(entry => entry.rank > 3);

  if (leaderboardData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-center brutal-card p-8">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl mb-2">ยังไม่มีข้อมูลผู้เล่น</h3>
          <p className="text-muted-foreground font-body">เริ่มเล่นเกมเพื่อติดอันดับกันเถอะ!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Podium for Top 3 */}
      <div className="flex items-end justify-center gap-4 px-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="text-4xl">🥈</div>
            <div className="w-16 h-16 rounded-full border-[3px] border-foreground bg-muted overflow-hidden">
              <img 
                src={topThree.find(e => e.rank === 2)?.photoURL || getAvatarUrl(null, topThree.find(e => e.rank === 2)?.username || "user")}
                alt={topThree.find(e => e.rank === 2)?.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const username = topThree.find(e => e.rank === 2)?.username || "user";
                  img.src = getAvatarUrl(null, username);
                }}
              />
            </div>
            <p className="font-black text-sm text-center line-clamp-1 w-20 break-words">
              {topThree.find(e => e.rank === 2)?.username}
            </p>
            <p className="text-xs font-bold text-primary">
              {topThree.find(e => e.rank === 2)?.points.toLocaleString()} PTS
            </p>
          </div>
          <div className="w-32 h-24 brutal-card bg-muted flex items-center justify-center">
            <span className="font-black text-4xl opacity-20">2</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="text-4xl">👑</div>
            <div className="w-20 h-20 rounded-full border-[3px] border-foreground bg-accent overflow-hidden shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <img 
                src={topThree.find(e => e.rank === 1)?.photoURL || getAvatarUrl(null, topThree.find(e => e.rank === 1)?.username || "user")}
                alt={topThree.find(e => e.rank === 1)?.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const username = topThree.find(e => e.rank === 1)?.username || "user";
                  img.src = getAvatarUrl(null, username);
                }}
              />
            </div>
            <p className="font-black text-sm text-center line-clamp-1 w-24 break-words">
              {topThree.find(e => e.rank === 1)?.username}
            </p>
            <p className="text-xs font-bold text-primary">
              {topThree.find(e => e.rank === 1)?.points.toLocaleString()} PTS
            </p>
          </div>
          <div className="w-36 h-32 brutal-card bg-secondary flex items-center justify-center">
            <span className="font-black text-5xl opacity-20 text-secondary-foreground">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="text-4xl">🥉</div>
            <div className="w-16 h-16 rounded-full border-[3px] border-foreground bg-muted overflow-hidden">
              <img 
                src={topThree.find(e => e.rank === 3)?.photoURL || getAvatarUrl(null, topThree.find(e => e.rank === 3)?.username || "user")}
                alt={topThree.find(e => e.rank === 3)?.username}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const username = topThree.find(e => e.rank === 3)?.username || "user";
                  img.src = getAvatarUrl(null, username);
                }}
              />
            </div>
            <p className="font-black text-sm text-center line-clamp-1 w-20 break-words">
              {topThree.find(e => e.rank === 3)?.username}
            </p>
            <p className="text-xs font-bold text-primary">
              {topThree.find(e => e.rank === 3)?.points.toLocaleString()} PTS
            </p>
          </div>
          <div className="w-32 h-20 brutal-card bg-muted flex items-center justify-center">
            <span className="font-black text-4xl opacity-20">3</span>
          </div>
        </div>
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="brutal-card-lg overflow-hidden">
          <div className="divide-y-[2px] divide-foreground overflow-y-auto max-h-[320px]">
            {rest.map((entry, i) => (
              <div
                key={entry.rank}
                className="flex items-center gap-4 px-6 py-3 font-body transition-all animate-slide-up bg-card hover:bg-muted/50"
                style={{ animationDelay: `${(i + 3) * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-[2px] border-foreground bg-muted overflow-hidden" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                    <img 
                      src={entry.photoURL || getAvatarUrl(null, entry.username)}
                      alt={entry.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getAvatarUrl(null, entry.username);
                      }}
                    />
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {rankIcon(entry.rank)}
                  </div>
                </div>
                <span className="flex-1 font-semibold truncate">{entry.username}</span>
                <span className="font-display text-primary text-lg">{entry.points.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}