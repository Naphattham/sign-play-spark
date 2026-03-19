import { useState, useEffect } from "react";
import { auth, database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";

interface QuestViewProps {
  streak: number;
}

export function QuestView({ streak }: QuestViewProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimingWelcome, setClaimingWelcome] = useState(false);
  const [welcomeClaimed, setWelcomeClaimed] = useState(false);

  // ตรวจสอบว่าเคยกดรับรางวัลแล้วหรือยัง
  useEffect(() => {
    const checkClaimed = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.streak3Claimed) {
          setClaimed(true);
        }
        if (data.welcomeBonusClaimed) {
          setWelcomeClaimed(true);
        }
      }
    };
    checkClaimed();
  }, []);

  // ฟังก์ชันกดรับ 50 คะแนน
  const handleClaimReward = async () => {
    const user = auth.currentUser;
    if (!user || claiming || claimed) return;

    setClaiming(true);
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, {
          ...data,
          points: (data.points || 0) + 50,
          streak3Claimed: true,
        });
        setClaimed(true);
        console.log("🎉 รับ 50 คะแนนสำเร็จ!");
      }
    } catch (error) {
      console.error("ไม่สามารถรับคะแนนได้:", error);
    } finally {
      setClaiming(false);
    }
  };

  // ฟังก์ชันกดรับโบนัสต้อนรับ 100 คะแนน (สมาชิกใหม่)
  const handleClaimWelcomeBonus = async () => {
    const user = auth.currentUser;
    if (!user || claimingWelcome || welcomeClaimed) return;

    setClaimingWelcome(true);
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, {
          ...data,
          points: (data.points || 0) + 100,
          welcomeBonusClaimed: true,
        });
        setWelcomeClaimed(true);
        console.log("🎉 รับโบนัสต้อนรับ 100 คะแนนสำเร็จ!");
      }
    } catch (error) {
      console.error("ไม่สามารถรับคะแนนได้:", error);
    } finally {
      setClaimingWelcome(false);
    }
  };

  const isQuestComplete = streak >= 3;
  const progress = Math.min(streak, 3);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-12 bg-background">
      {/* Header */}
      <header className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic tracking-tighter mb-1 sm:mb-2">
          Quest Log
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-700 dark:text-slate-300">
          ทำภารกิจให้สำเร็จเพื่อรับรางวัลสุดพิเศษ!
        </p>
      </header>

      {/* Daily Quests Section */}
      <section className="mb-8 sm:mb-12 md:mb-16">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl text-primary font-bold">
            calendar_today
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase">DAILY QUESTS</h3>
          <div className="h-0.5 sm:h-1 flex-1 bg-black" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Quest Card 1 — โบนัสต้อนรับสมาชิกใหม่ */}
          <div
            className={`${
              welcomeClaimed
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30"
            } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`}
            style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">
                  ยินดีต้อนรับสมาชิกใหม่!
                </h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  สมัครสมาชิกครั้งแรก รับคะแนนโบนัสไปเลยฟรีๆ
                </p>
              </div>
              <div
                className={`${
                  welcomeClaimed ? "bg-green-200" : "bg-secondary"
                } p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}
              >
                <span className="material-symbols-outlined font-bold">
                  {welcomeClaimed ? "check_circle" : "card_giftcard"}
                </span>
                <span className="text-xs font-black">100 PTS</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">
                  {welcomeClaimed ? "สำเร็จแล้ว ✓" : "1/1 สมัครสมาชิกแล้ว"}
                </span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    welcomeClaimed ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {welcomeClaimed ? (
              <button
                disabled
                className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                รับรางวัลแล้ว!
              </button>
            ) : (
              <button
                onClick={handleClaimWelcomeBonus}
                disabled={claimingWelcome}
                className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2"
                style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}
              >
                {claimingWelcome ? "กำลังรับรางวัล..." : "รับรางวัล 100 คะแนน!"}
              </button>
            )}
          </div>

          {/* Quest Card 2 — เข้าสู่ระบบติดต่อกัน 3 วัน */}
          <div
            className={`${
              isQuestComplete && !claimed
                ? "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30"
                : claimed
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-white dark:bg-slate-800"
            } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`}
            style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">
                  เข้าสู่ระบบติดต่อกัน 3 วัน
                </h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  ล็อกอินเข้าใช้งานติดต่อกัน 3 วัน เพื่อรับคะแนนโบนัส
                </p>
              </div>
              <div
                className={`${
                  claimed ? "bg-green-200" : "bg-secondary"
                } p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}
              >
                <span className="material-symbols-outlined font-bold">
                  {claimed ? "check_circle" : "stars"}
                </span>
                <span className="text-xs font-black">50 PTS</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">
                  {claimed ? "สำเร็จแล้ว ✓" : `${progress}/3 วัน`}
                </span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    claimed ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${(progress / 3) * 100}%` }}
                />
              </div>
            </div>

            {claimed ? (
              <button
                disabled
                className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                รับรางวัลแล้ว!
              </button>
            ) : isQuestComplete ? (
              <button
                onClick={handleClaimReward}
                disabled={claiming}
                className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2"
                style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}
              >
                {claiming ? "กำลังรับรางวัล..." : "รับรางวัล 50 คะแนน!"}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-slate-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed opacity-50 mt-2"
              >
                กำลังดำเนินการ ({progress}/3 วัน)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Weekly Quests Section */}
      <section>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl text-primary font-bold">
            event_repeat
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase">WEEKLY QUESTS</h3>
          <div className="h-0.5 sm:h-1 flex-1 bg-black" />
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Weekly Quest Card 1 */}
          <div className="bg-white dark:bg-slate-800 border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 items-center"
               style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 bg-primary border-[2px] sm:border-[3px] border-foreground rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl text-white">timer</span>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
                    ฝึกซ้อม 30 นาที
                  </h4>
                  <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    รวมเวลาฝึกซ้อมทุกบทเรียนในสัปดาห์นี้
                  </p>
                </div>
                <div className="hidden md:flex bg-secondary p-3 border-[3px] border-foreground rounded-lg flex-col items-center shrink-0">
                  <span className="material-symbols-outlined font-bold">payments</span>
                  <span className="text-sm font-black">500 XP</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 h-5 sm:h-6 md:h-8 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                  <div className="h-full bg-[#f94fa4] transition-all duration-500" style={{ width: "45%" }} />
                </div>
                <span className="font-black text-sm sm:text-base md:text-lg min-w-[60px] sm:min-w-[80px] text-right">14/30m</span>
              </div>
            </div>
          </div>

          {/* Weekly Quest Card 2 */}
          <div className="bg-white dark:bg-slate-800 border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6 items-center"
               style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 bg-secondary border-[2px] sm:border-[3px] border-foreground rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl sm:text-4xl md:text-5xl">groups</span>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase">
                    ผีเสื้อสังคม
                  </h4>
                  <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    มีปฏิสัมพันธ์กับผู้ใช้ภาษามือ 5 คน
                  </p>
                </div>
                <div className="hidden md:flex bg-[#f94fa4]/20 p-3 border-[3px] border-foreground rounded-lg flex-col items-center shrink-0">
                  <span className="material-symbols-outlined font-bold">emoji_events</span>
                  <span className="text-sm font-black">250 XP</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 h-5 sm:h-6 md:h-8 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: "20%" }} />
                </div>
                <span className="font-black text-sm sm:text-base md:text-lg min-w-[40px] sm:min-w-[80px] text-right">1/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
