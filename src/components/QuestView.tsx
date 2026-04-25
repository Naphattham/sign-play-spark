import { useState, useEffect, useMemo } from "react";
import {
  Star, Gift, CalendarDays, Timer, BookOpen, BookMarked, Target,
} from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { QuestCard, type QuestStatus } from "./QuestCard";

interface QuestViewProps {
  streak: number;
}

export function QuestView({ streak }: QuestViewProps) {
  const [userId, setUserId] = useState<string | null>(() => auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

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

  // Reset และโหลดข้อมูลใหม่ทุกครั้งที่ user เปลี่ยน
  useEffect(() => {
    setDataLoading(true);
    setWelcomeClaimed(false);
    setDailyLoginClaimed(false);
    setDailyPracticeClaimed(false);
    setLearn5WordsClaimed(false);
    setLearn10WordsClaimed(false);
    setPracticeSeconds(0);
    setCompletedPhrasesCount(0);

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
        const dateKey = `dailyPracticeDate_${user.uid}`;
        const secKey = `dailyPracticeSeconds_${user.uid}`;
        const storedDate = localStorage.getItem(dateKey);
        if (storedDate === ltToday) {
          setPracticeSeconds(parseInt(localStorage.getItem(secKey) || '0', 10));
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
      const user = auth.currentUser;
      if (!user) return;
      const ltToday = new Date().toISOString().split('T')[0];
      const dateKey = `dailyPracticeDate_${user.uid}`;
      const secKey = `dailyPracticeSeconds_${user.uid}`;
      const storedDate = localStorage.getItem(dateKey);
      if (storedDate === ltToday) {
        setPracticeSeconds(parseInt(localStorage.getItem(secKey) || '0', 10));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

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
        await set(userRef, { ...data, points: (data.points || 0) + 100, welcomeBonusClaimed: true });
        setWelcomeClaimed(true);
      }
    } catch (error) { /* silent */ } finally { setClaimingWelcome(false); }
  };

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
        await set(userRef, { ...data, points: (data.points || 0) + 50, dailyLoginClaimedDate: today });
        setDailyLoginClaimed(true);
      }
    } catch (error) { /* silent */ } finally { setClaimingDailyLogin(false); }
  };

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
        await set(userRef, { ...data, points: (data.points || 0) + 100, dailyPracticeClaimedDate: today });
        setDailyPracticeClaimed(true);
      }
    } catch (error) { /* silent */ } finally { setClaimingDailyPractice(false); }
  };

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
    } catch (error) { /* silent */ } finally { setClaimingLearn5Words(false); }
  };

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
    } catch (error) { /* silent */ } finally { setClaimingLearn10Words(false); }
  };

  const practiceMinutes = Math.floor(practiceSeconds / 60);

  // Compute quest statuses
  const welcomeStatus: QuestStatus = welcomeClaimed ? "claimed" : "claimable";
  const loginStatus: QuestStatus = dailyLoginClaimed ? "claimed" : "claimable";
  const practiceStatus: QuestStatus = dailyPracticeClaimed ? "claimed" : practiceMinutes >= 30 ? "claimable" : "locked";
  const learn5Status: QuestStatus = learn5WordsClaimed ? "claimed" : completedPhrasesCount >= 5 ? "claimable" : "locked";
  const learn10Status: QuestStatus = learn10WordsClaimed ? "claimed" : completedPhrasesCount >= 10 ? "claimable" : "locked";

  // Stats
  const completedCount = useMemo(() => {
    return [welcomeClaimed, dailyLoginClaimed, dailyPracticeClaimed, learn5WordsClaimed, learn10WordsClaimed]
      .filter(Boolean).length;
  }, [welcomeClaimed, dailyLoginClaimed, dailyPracticeClaimed, learn5WordsClaimed, learn10WordsClaimed]);

  const totalQuests = 5;
  const overallPercent = Math.round((completedCount / totalQuests) * 100);

  /* ── Loading state ── */
  if (dataLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-12 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64 sm:h-80">
            <div className="text-center brutal-card p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 quest-progress-shimmer" />
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-muted-foreground font-bold font-body text-sm sm:text-base">
                  กำลังโหลดภารกิจ...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto quest-scroll p-3 sm:p-4 md:p-6 lg:p-10 bg-background">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">

        {/* ━━━ HEADER ━━━ */}
        <header className="mb-6 sm:mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">
            Quest Master
          </h1>
          <div className="h-2 sm:h-3 w-20 sm:w-28 md:w-32 bg-primary mt-1 sm:mt-2"></div>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
            รับเควสประจำวัน เพื่อก้าวสู่ความเป็นสุดยอดนักภาษามือ
          </p>
        </header>

        {/* ━━━ DAILY QUESTS ━━━ */}
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight">
              ภารกิจประจำวัน
            </h2>
            <div className="h-[2px] sm:h-[3px] flex-1 bg-foreground/10 rounded-full" />
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-foreground/10 uppercase">
              รีเซ็ตทุกวัน
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            <QuestCard
              title="เข้าสู่ระบบ 1 ครั้ง/วัน"
              description="เข้าสู่ระบบเพื่อใช้งานครั้งแรกของวัน รับคะแนนทันที"
              icon={<CalendarDays />}
              points={50}
              status={loginStatus}
              progressLabel="1/1 วัน"
              progressPercent={100}
              category="DAILY"
              categoryColor="hsl(342 100% 90%)"
              accentColor="hsl(342 100% 64%)"
              delay={0}
              claiming={claimingDailyLogin}
              onClaim={handleClaimDailyLogin}
            />
            <QuestCard
              title="ฝึกซ้อม 30 นาที"
              description="เพียงเข้าใช้งานระบบครบ 30 นาทีใน 1 วัน"
              icon={<Timer />}
              points={100}
              status={practiceStatus}
              progressLabel={`${Math.min(practiceMinutes, 30)}/30 นาที`}
              progressPercent={Math.min((practiceMinutes / 30) * 100, 100)}
              category="DAILY"
              categoryColor="hsl(342 100% 90%)"
              accentColor="hsl(342 100% 64%)"
              delay={80}
              claiming={claimingDailyPractice}
              onClaim={handleClaimDailyPractice}
              lockedLabel={`กำลังดำเนินการ (${Math.min(practiceMinutes, 30)}/30 นาที)`}
            />
          </div>
        </section>

        {/* ━━━ MILESTONE QUESTS ━━━ */}
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-secondary fill-secondary" />
            <h2 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight">
              ภารกิจพิเศษ
            </h2>
            <div className="h-[2px] sm:h-[3px] flex-1 bg-foreground/10 rounded-full" />
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-foreground/10 uppercase">
              ทำได้ครั้งเดียว
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <QuestCard
              title="ยินดีต้อนรับสมาชิกใหม่!"
              description="สมัครสมาชิกครั้งแรก รับคะแนนโบนัสไปเลยฟรีๆ"
              icon={<Gift />}
              points={100}
              status={welcomeStatus}
              progressLabel="1/1 สมัครสมาชิกแล้ว"
              progressPercent={100}
              category="ONE-TIME"
              categoryColor="hsl(44 100% 82%)"
              accentColor="hsl(44 100% 55%)"
              delay={0}
              claiming={claimingWelcome}
              onClaim={handleClaimWelcomeBonus}
            />
            <QuestCard
              title="เรียนรู้ครบ 5 คำ"
              description="สะสมคำศัพท์ที่คุณฝึกผ่านครบ 5 คำ"
              icon={<BookOpen />}
              points={30}
              status={learn5Status}
              progressLabel={`${Math.min(completedPhrasesCount, 5)}/5 คำ`}
              progressPercent={Math.min((completedPhrasesCount / 5) * 100, 100)}
              category="ONE-TIME"
              categoryColor="hsl(44 100% 82%)"
              accentColor="hsl(270 70% 60%)"
              delay={80}
              claiming={claimingLearn5Words}
              onClaim={handleClaimLearn5Words}
              lockedLabel={`กำลังดำเนินการ (${Math.min(completedPhrasesCount, 5)}/5 คำ)`}
            />
            <QuestCard
              title="เรียนรู้ครบ 10 คำ"
              description="สะสมคำศัพท์ที่คุณฝึกผ่านครบ 10 คำ"
              icon={<BookMarked />}
              points={100}
              status={learn10Status}
              progressLabel={`${Math.min(completedPhrasesCount, 10)}/10 คำ`}
              progressPercent={Math.min((completedPhrasesCount / 10) * 100, 100)}
              category="ONE-TIME"
              categoryColor="hsl(44 100% 82%)"
              accentColor="hsl(25 95% 55%)"
              delay={160}
              claiming={claimingLearn10Words}
              onClaim={handleClaimLearn10Words}
              lockedLabel={`กำลังดำเนินการ (${Math.min(completedPhrasesCount, 10)}/10 คำ)`}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
