import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Trophy, Gamepad2, BookOpen, Users, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LoginModal } from "@/components/LoginModal";
import { database } from "@/lib/firebase";
import { ref as dbRef, onValue } from "firebase/database";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";

import generalImg from "@/asset/image/general.webp";
import lessonImg from "@/asset/image/lesson.webp";
import trophyImg from "@/asset/image/Trophy.webp";
import targetImg from "@/asset/image/target.webp";
import joystickImg from "@/asset/image/joystick.webp";

interface LandingPageProps {
  onLoginSuccess: () => void;
}

const FEATURES = [
  { icon: Gamepad2, title: "มินิเกมสุดมัน", desc: "เรียนรู้ผ่านเกมที่ออกแบบมาเพื่อฝึกฝนทักษะภาษามือ", color: "bg-amber-300" },
  { icon: Zap, title: "AI แบบเรียลไทม์", desc: "ระบบ AI วิเคราะห์ท่าทางแบบเรียลไทม์ผ่านกล้อง", color: "bg-pink-400" },
  { icon: Trophy, title: "ระบบ XP & อันดับ", desc: "สะสมคะแนน XP ปีนอันดับ Leaderboard แข่งกับเพื่อน", color: "bg-violet-400" },
  { icon: BookOpen, title: "บทเรียนครบถ้วน", desc: "ครอบคลุม 4 หมวดหมู่หลัก กว่า 20 ท่าทางภาษามือ", color: "bg-emerald-400" },
];

export function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(getVideoUrl("general", "สวัสดี (ผู้ใหญ่)main"));
  const [totalUsers, setTotalUsers] = useState<number>(0);

  useEffect(() => {
    const statsRef = dbRef(database, 'stats/totalUsers');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTotalUsers(snapshot.val() as number);
      } else {
        setTotalUsers(0);
      }
    }, (error) => {
      console.error("Error fetching total users:", error);
    });
    return () => unsubscribe();
  }, []);

  const videoAdult = getVideoUrl("general", "สวัสดี (ผู้ใหญ่)main");
  const videoFriend = getVideoUrl("general", "สวัสดี (เพื่อน)main");

  return (
    <>
      <div className="h-[100dvh] overflow-y-auto scroll-smooth text-foreground cb-hero-bg dot-grid flex flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>

        <Navbar onLoginClick={() => setShowLoginModal(true)} />

        {/* ── Hero Section ── */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20">

          {/* Hero Text */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-5 sm:space-y-6">
            <div className="lp-hero-text inline-flex items-center gap-2 bg-pink-500 text-white px-3 py-1.5 rounded-full border-[2px] border-foreground shadow-[2px_2px_0_0_#1a1a1a] text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Sparkles size={14} strokeWidth={3} />
              เรียนรู้ภาษามือแบบอินเทอร์แอคทีฟ
            </div>

            <h1 className="lp-hero-text text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.15] font-black tracking-tight" style={{ animationDelay: "0.1s" }}>
              <span className="whitespace-nowrap">เชี่ยวชาญ<span className="text-pink-500">ภาษามือ</span></span>
              <br />
              ผ่านการเล่นเกม!
            </h1>

            <p className="lp-hero-text text-sm sm:text-base md:text-lg font-semibold text-foreground/60 max-w-lg" style={{ animationDelay: "0.2s" }}>
              วิธีเรียนรู้ภาษามือไทยที่สนุก ฟรี และมีประสิทธิภาพ พัฒนาทักษะของคุณด้วยการตอบรับแบบเรียลไทม์และมินิเกมที่น่าสนใจ
            </p>

            {/* CTA Buttons */}
            <div className="lp-hero-text flex flex-wrap justify-center md:justify-start gap-3 pt-2 w-full" style={{ animationDelay: "0.3s" }}>
              <button
                onClick={() => setShowLoginModal(true)}
                className="brutal-btn bg-amber-300 font-black text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl lp-cta-glow flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <img src={joystickImg} alt="Joystick" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" /> เริ่มเกม
              </button>
              <button
                onClick={() => navigate("/categories")}
                className="brutal-btn bg-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl flex items-center justify-center gap-2 flex-1 sm:flex-none hover:bg-gray-50"
              >
                <img src={lessonImg} alt="Lesson" className="w-5 h-5 object-contain" /> สำรวจบทเรียน
              </button>
            </div>

            {/* User count */}
            <div className="lp-hero-text flex items-center gap-3 pt-2" style={{ animationDelay: "0.4s" }}>
              <div className="flex -space-x-2.5">
                {["bg-blue-400", "bg-emerald-400", "bg-pink-400", "bg-amber-400"].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-[2.5px] border-foreground ${bg} flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-[2px_2px_0_0_#1a1a1a]`}>
                    {["JD", "AS", "MK", "NP"][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-black text-foreground text-sm sm:text-base leading-none">
                  {totalUsers > 0 ? totalUsers.toLocaleString() : "—"} <span className="font-bold text-foreground/50">คน</span>
                </p>
                <p className="font-semibold text-foreground/40 text-[10px] sm:text-xs">ผู้เรียนลงทะเบียนแล้ว</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="flex-1 relative w-full max-w-sm sm:max-w-md mx-auto md:mx-0 lp-hero-visual" style={{ animationDelay: "0.15s" }}>
            {/* Decorative blurs */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-pink-300/30 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-amber-300/30 rounded-full blur-3xl -z-10" />

            <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border-[3px] border-foreground relative overflow-hidden video-display-box" style={{ boxShadow: "6px 6px 0 0 #1a1a1a" }}>
              {/* Phrase selector */}
              <div className="bg-pink-50 border-[2.5px] border-pink-400 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <img src={generalImg} alt="General" className="w-5 h-5 object-contain" />
                  <span className="font-bold italic text-pink-500 text-sm sm:text-base">บทสนทนาทั่วไป</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: "สวัสดี(ผู้ใหญ่)", url: videoAdult }, { label: "สวัสดี(เพื่อน)", url: videoFriend }].map((v) => (
                    <button
                      key={v.label}
                      onClick={() => setSelectedVideo(v.url)}
                      className={`p-2 rounded-lg border-[2.5px] border-foreground flex justify-center items-center font-bold text-xs sm:text-sm relative transition-all duration-200 ${selectedVideo === v.url
                          ? "bg-amber-300 shadow-[2px_2px_0_0_#1a1a1a]"
                          : "bg-gray-100 opacity-60 hover:opacity-80 shadow-[2px_2px_0_0_#1a1a1a]"
                        }`}
                    >
                      {v.label}
                      {selectedVideo === v.url && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video display */}
              <div className="bg-foreground rounded-xl overflow-hidden border-[3px] border-foreground aspect-square video-container cb-border-glow">
                <div className="w-full h-full relative">
                  <VideoPlayer
                    key={selectedVideo}
                    src={selectedVideo}
                    autoPlay loop muted playsInline preload="auto"
                    className="w-full h-full object-cover rounded-lg video-fade-in absolute inset-0"
                  />
                </div>
              </div>

              {/* Bottom stats bar */}
              <div className="mt-2.5 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                </div>
                <div className="w-7 h-7 rounded-full bg-pink-500 border-[2.5px] border-foreground flex items-center justify-center shadow-[2px_2px_0_0_#1a1a1a]">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div
              className="absolute -bottom-4 -left-3 sm:-bottom-5 sm:-left-5 bg-pink-500 text-white p-2 sm:p-2.5 rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] items-center gap-1.5 hidden sm:flex lp-float-badge"
              style={{ "--badge-rotate": "-5deg" } as React.CSSProperties}
            >
              <div className="bg-white/20 p-1.5 rounded-lg flex items-center justify-center">
                <img src={trophyImg} alt="Trophy" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase leading-tight">Daily Streak</p>
                <p className="font-black text-sm leading-none">15 DAYS!</p>
              </div>
            </div>

            <div
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-amber-300 text-foreground p-2 sm:p-2.5 rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] items-center gap-1.5 hidden sm:flex lp-float-badge"
              style={{ "--badge-rotate": "4deg", animationDelay: "1.5s" } as React.CSSProperties}
            >
              <div className="bg-white/40 p-1.5 rounded-lg flex items-center justify-center">
                <img src={targetImg} alt="Target" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase leading-tight">Accuracy</p>
                <p className="font-black text-sm leading-none">98%</p>
              </div>
            </div>
          </div>
        </main>

        {/* ── Features Section ── */}
        <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="lp-feature-enter bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border-[3px] border-foreground shadow-[4px_4px_0_0_#1a1a1a] hover:shadow-[2px_2px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div className={`${f.color} w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-[2.5px] border-foreground shadow-[2px_2px_0_0_#1a1a1a] flex items-center justify-center mb-2.5`}>
                  <f.icon size={18} strokeWidth={2.5} className="text-foreground" />
                </div>
                <h3 className="font-black text-sm sm:text-base leading-tight mb-1">{f.title}</h3>
                <p className="font-semibold text-foreground/50 text-[10px] sm:text-xs leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-pink-500 py-5 sm:py-8 px-4 sm:px-8 border-t-[3px] border-foreground mt-auto relative overflow-hidden shrink-0">
          <div className="absolute inset-0 cb-shimmer-bar pointer-events-none" />
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="font-black text-xl tracking-tight text-white">SignMate</span>
            </div>
            <p className="font-bold text-white/50 text-xs sm:text-sm text-center">© 2026 SignMate Interactive. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* ── Login Modal ── */}
      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
