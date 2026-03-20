import { useState, useEffect } from "react";
import { auth, database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";

interface QuestViewProps {
  streak: number;
}

export function QuestView({ streak }: QuestViewProps) {
  // Pre-loading
  const [dataLoading, setDataLoading] = useState(true);

  // States for claims
  const [claimingWelcome, setClaimingWelcome] = useState(false);
  const [welcomeClaimed, setWelcomeClaimed] = useState(false);

  const [dailyLoginClaimed, setDailyLoginClaimed] = useState(false);
  const [claimingDailyLogin, setClaimingDailyLogin] = useState(false);

  const [dailyPracticeClaimed, setDailyPracticeClaimed] = useState(false);
  const [claimingDailyPractice, setClaimingDailyPractice] = useState(false);

  const [learn5WordsClaimed, setLearn5WordsClaimed] = useState(false);
  const [claimingLearn5Words, setClaimingLearn5Words] = useState(false);

  const [learn10WordsClaimed, setLearn10WordsClaimed] = useState(false);
  const [claimingLearn10Words, setClaimingLearn10Words] = useState(false);

  // Stats
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [completedPhrasesCount, setCompletedPhrasesCount] = useState(0);

  // ตรวจสอบว่าเคยกดรับรางวัลแล้วหรือยัง
  useEffect(() => {
    const checkClaimed = async () => {
      const user = auth.currentUser;
      if (!user) {
        setDataLoading(false);
        return;
      }
      
      try {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const today = new Date().toISOString().split('T')[0];

          if (data.welcomeBonusClaimed) setWelcomeClaimed(true);
          if (data.dailyLoginClaimedDate === today) setDailyLoginClaimed(true);
          if (data.dailyPracticeClaimedDate === today) setDailyPracticeClaimed(true);
          if (data.learn5WordsClaimed) setLearn5WordsClaimed(true);
          if (data.learn10WordsClaimed) setLearn10WordsClaimed(true);

          const completedArr = data.completedPhrases;
          setCompletedPhrasesCount(Array.isArray(completedArr) ? completedArr.length : 0);
        }

        const ltToday = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('dailyPracticeDate');
        if (storedDate === ltToday) {
           setPracticeSeconds(parseInt(localStorage.getItem('dailyPracticeSeconds') || '0', 10));
        }
      } catch (error) {
        console.error("Error fetching quest data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    checkClaimed();

    // Poll practice time so it updates on screen
    const interval = setInterval(() => {
        const ltToday = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('dailyPracticeDate');
        if (storedDate === ltToday) {
           setPracticeSeconds(parseInt(localStorage.getItem('dailyPracticeSeconds') || '0', 10));
        }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ฟังก์ชันกดรับโบนัสต้อนรับ 100 คะแนน
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
      }
    } catch (error) {
    } finally {
      setClaimingWelcome(false);
    }
  };

  // 1. เข้าสู่ระบบอย่างน้อย 1 ครั้ง/วัน
  const handleClaimDailyLogin = async () => {
    const user = auth.currentUser;
    if (!user || claimingDailyLogin || dailyLoginClaimed) return;

    setClaimingDailyLogin(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, {
          ...data,
          points: (data.points || 0) + 50,
          dailyLoginClaimedDate: today,
        });
        setDailyLoginClaimed(true);
      }
    } catch (error) {
    } finally {
      setClaimingDailyLogin(false);
    }
  };

  // 2. ฝึกซ้อม 30 นาที
  const handleClaimDailyPractice = async () => {
    const user = auth.currentUser;
    if (!user || claimingDailyPractice || dailyPracticeClaimed) return;

    setClaimingDailyPractice(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, {
          ...data,
          points: (data.points || 0) + 100,
          dailyPracticeClaimedDate: today,
        });
        setDailyPracticeClaimed(true);
      }
    } catch (error) {
    } finally {
      setClaimingDailyPractice(false);
    }
  };

  // 3. เรียนรู้ 5 คำ
  const handleClaimLearn5Words = async () => {
    const user = auth.currentUser;
    if (!user || claimingLearn5Words || learn5WordsClaimed) return;

    setClaimingLearn5Words(true);
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, { ...data, points: (data.points || 0) + 30, learn5WordsClaimed: true });
        setLearn5WordsClaimed(true);
      }
    } catch (error) {
    } finally {
      setClaimingLearn5Words(false);
    }
  };

  // 4. เรียนรู้ 10 คำ
  const handleClaimLearn10Words = async () => {
    const user = auth.currentUser;
    if (!user || claimingLearn10Words || learn10WordsClaimed) return;

    setClaimingLearn10Words(true);
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        await set(userRef, { ...data, points: (data.points || 0) + 100, learn10WordsClaimed: true });
        setLearn10WordsClaimed(true);
      }
    } catch (error) {
    } finally {
      setClaimingLearn10Words(false);
    }
  };

  const practiceMinutes = Math.floor(practiceSeconds / 60);

  if (dataLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-bold font-body">กำลังโหลดภารกิจ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-12 bg-background">
      <header className="mb-6 sm:mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase italic tracking-tighter mb-1 sm:mb-2">
          Quest Log
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-700 dark:text-slate-300">
          ทำภารกิจให้สำเร็จเพื่อรับรางวัลสุดพิเศษ!
        </p>
      </header>

      <section className="mb-8 sm:mb-12 md:mb-16">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl text-primary font-bold">
            hotel_class
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black uppercase">ALL QUESTS</h3>
          <div className="h-0.5 sm:h-1 flex-1 bg-black" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          
          {/* Welcome Bonus */}
          <div className={`${welcomeClaimed ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-slate-800" } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`} style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">ยินดีต้อนรับสมาชิกใหม่!</h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">สมัครสมาชิกครั้งแรก รับคะแนนโบนัสไปเลยฟรีๆ</p>
              </div>
              <div className={`${welcomeClaimed ? "bg-green-200" : "bg-secondary"} p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}>
                <span className="material-symbols-outlined font-bold">{welcomeClaimed ? "check_circle" : "card_giftcard"}</span>
                <span className="text-xs font-black">100 PTS</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">{welcomeClaimed ? "สำเร็จแล้ว ✓" : "1/1 สมัครสมาชิกแล้ว"}</span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-500 ${welcomeClaimed ? "bg-green-500" : "bg-primary"}`} style={{ width: "100%" }} />
              </div>
            </div>
            {welcomeClaimed ? (
              <button disabled className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>รับรางวัลแล้ว!
              </button>
            ) : (
              <button onClick={handleClaimWelcomeBonus} disabled={claimingWelcome} className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {claimingWelcome ? "กำลังรับรางวัล..." : "รับรางวัล 100 คะแนน!"}
              </button>
            )}
          </div>

          {/* 1. เข้าสู่ระบบ 1 ครั้งต่อวัน */}
          <div className={`${dailyLoginClaimed ? "bg-green-100 dark:bg-green-900/30" : "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30"} border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`} style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">เข้าสู่ระบบ 1 ครั้ง/วัน</h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">เข้าสู่ระบบเพื่อใช้งานครั้งแรกของวัน รับคะแนนทันที</p>
              </div>
              <div className={`${dailyLoginClaimed ? "bg-green-200" : "bg-primary text-white"} p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}>
                <span className="material-symbols-outlined font-bold">{dailyLoginClaimed ? "check_circle" : "event"}</span>
                <span className="text-xs font-black">50 PTS</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">{dailyLoginClaimed ? "สำเร็จแล้ว ✓" : "1/1 วัน"}</span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-500 ${dailyLoginClaimed ? "bg-green-500" : "bg-primary"}`} style={{ width: "100%" }} />
              </div>
            </div>
            {dailyLoginClaimed ? (
              <button disabled className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>รับรางวัลแล้ว!
              </button>
            ) : (
              <button onClick={handleClaimDailyLogin} disabled={claimingDailyLogin} className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {claimingDailyLogin ? "กำลังรับรางวัล..." : "รับรางวัล 50 คะแนน!"}
              </button>
            )}
          </div>

          {/* 2. ฝึกซ้อม 30 นาที/วัน */}
          <div className={`${dailyPracticeClaimed ? "bg-green-100 dark:bg-green-900/30" : practiceMinutes >= 30 ? "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30" : "bg-white dark:bg-slate-800" } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`} style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">ฝึกซ้อม 30 นาที</h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">เพียงเข้าใช้งานระบบครบ 30 นาทีใน 1 วัน</p>
              </div>
              <div className={`${dailyPracticeClaimed ? "bg-green-200" : "bg-primary text-white"} p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}>
                <span className="material-symbols-outlined font-bold">{dailyPracticeClaimed ? "check_circle" : "timer"}</span>
                <span className="text-xs font-black">100 PTS</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">{dailyPracticeClaimed ? "สำเร็จแล้ว ✓" : `${Math.min(practiceMinutes, 30)}/30 นาที`}</span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-500 ${dailyPracticeClaimed ? "bg-green-500" : "bg-primary"}`} style={{ width: `${Math.min((practiceMinutes / 30) * 100, 100)}%` }} />
              </div>
            </div>
            {dailyPracticeClaimed ? (
              <button disabled className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>รับรางวัลแล้ว!
              </button>
            ) : practiceMinutes >= 30 ? (
              <button onClick={handleClaimDailyPractice} disabled={claimingDailyPractice} className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {claimingDailyPractice ? "กำลังรับรางวัล..." : "รับรางวัล 100 คะแนน!"}
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-slate-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed opacity-50 mt-2">
                กำลังดำเนินการ ({Math.min(practiceMinutes, 30)}/30 นาที)
              </button>
            )}
          </div>

          {/* 3. เรียนรู้ 5 คำ */}
          <div className={`${learn5WordsClaimed ? "bg-green-100 dark:bg-green-900/30" : completedPhrasesCount >= 5 ? "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30" : "bg-white dark:bg-slate-800" } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`} style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">เรียนรู้ครบ 5 คำ</h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">สะสมคำศัพท์ที่คุณฝึกผ่านครบ 5 คำ</p>
              </div>
              <div className={`${learn5WordsClaimed ? "bg-green-200" : "bg-primary text-white"} p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}>
                <span className="material-symbols-outlined font-bold">{learn5WordsClaimed ? "check_circle" : "menu_book"}</span>
                <span className="text-xs font-black">30 PTS</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">{learn5WordsClaimed ? "สำเร็จแล้ว ✓" : `${Math.min(completedPhrasesCount, 5)}/5 คำ`}</span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-500 ${learn5WordsClaimed ? "bg-green-500" : "bg-[#f94fa4]"}`} style={{ width: `${Math.min((completedPhrasesCount / 5) * 100, 100)}%` }} />
              </div>
            </div>
            {learn5WordsClaimed ? (
              <button disabled className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>รับรางวัลแล้ว!
              </button>
            ) : completedPhrasesCount >= 5 ? (
              <button onClick={handleClaimLearn5Words} disabled={claimingLearn5Words} className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {claimingLearn5Words ? "กำลังรับรางวัล..." : "รับรางวัล 30 คะแนน!"}
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-slate-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed opacity-50 mt-2">
                กำลังดำเนินการ ({Math.min(completedPhrasesCount, 5)}/5 คำ)
              </button>
            )}
          </div>

          {/* 4. เรียนรู้ 10 คำ */}
          <div className={`${learn10WordsClaimed ? "bg-green-100 dark:bg-green-900/30" : completedPhrasesCount >= 10 ? "bg-[#f94fa4]/20 dark:bg-[#f94fa4]/30" : "bg-white dark:bg-slate-800" } border-[2px] sm:border-[3px] border-foreground rounded-lg p-3 sm:p-4 md:p-6 flex flex-col gap-2 sm:gap-3 md:gap-4`} style={{ boxShadow: "4px 4px 0px 0px hsl(0 0% 0%)" }}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black uppercase leading-tight">เรียนรู้ครบ 10 คำ</h4>
                <p className="font-bold text-slate-600 dark:text-slate-400 text-xs sm:text-sm">สะสมคำศัพท์ที่คุณฝึกผ่านครบ 10 คำ</p>
              </div>
              <div className={`${learn10WordsClaimed ? "bg-green-200" : "bg-primary text-white"} p-2 border-[3px] border-foreground rounded-lg flex flex-col items-center shrink-0`}>
                <span className="material-symbols-outlined font-bold">{learn10WordsClaimed ? "check_circle" : "auto_stories"}</span>
                <span className="text-xs font-black">100 PTS</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="font-black uppercase text-xs italic">ความคืบหน้า</span>
                <span className="font-black text-xs">{learn10WordsClaimed ? "สำเร็จแล้ว ✓" : `${Math.min(completedPhrasesCount, 10)}/10 คำ`}</span>
              </div>
              <div className="w-full h-4 sm:h-5 md:h-6 bg-slate-200 border-[2px] sm:border-[3px] border-foreground rounded-sm overflow-hidden">
                <div className={`h-full transition-all duration-500 ${learn10WordsClaimed ? "bg-green-500" : "bg-[#f94fa4]"}`} style={{ width: `${Math.min((completedPhrasesCount / 10) * 100, 100)}%` }} />
              </div>
            </div>
            {learn10WordsClaimed ? (
              <button disabled className="w-full py-3 bg-green-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>รับรางวัลแล้ว!
              </button>
            ) : completedPhrasesCount >= 10 ? (
              <button onClick={handleClaimLearn10Words} disabled={claimingLearn10Words} className="w-full py-3 bg-secondary border-[3px] border-foreground rounded-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2" style={{ boxShadow: "2px 2px 0px 0px hsl(0 0% 0%)" }}>
                {claimingLearn10Words ? "กำลังรับรางวัล..." : "รับรางวัล 100 คะแนน!"}
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-slate-200 border-[3px] border-foreground rounded-lg font-black uppercase cursor-not-allowed opacity-50 mt-2">
                กำลังดำเนินการ ({Math.min(completedPhrasesCount, 10)}/10 คำ)
              </button>
            )}
          </div>

        </div>
      </section>      
    </div>
  );
}
