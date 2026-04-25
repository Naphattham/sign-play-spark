import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, Zap, Trophy, Gamepad2, BookOpen, Users, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { database } from "@/lib/firebase";
import { ref as dbRef, onValue } from "firebase/database";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";

import generalImg from "@/asset/image/general.webp";

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
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignup) {
      if (!username.trim()) { setError("กรุณากรอก Username"); return; }
      if (password !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
      if (password.length < 6) { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
    }
    setLoading(true);
    try {
      const result = isSignup
        ? await signUpWithEmail(email, password, username)
        : await signInWithEmail(email, password);
      if (result.error) { setError(result.error); setLoading(false); return; }
      setShowLoginModal(false);
      setLoading(false);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      if (result.error) { setError(result.error); setLoading(false); return; }
      setShowLoginModal(false);
      setLoading(false);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  const videoAdult = getVideoUrl("general", "สวัสดี (ผู้ใหญ่)main");
  const videoFriend = getVideoUrl("general", "สวัสดี (เพื่อน)main");

  return (
    <>
      <div className="min-h-screen text-foreground cb-hero-bg dot-grid flex flex-col">

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
                className="brutal-btn bg-amber-300 font-black text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl lp-cta-glow flex-1 sm:flex-none"
              >
                🎮 เริ่มเกม
              </button>
              <button
                onClick={() => navigate("/categories")}
                className="brutal-btn bg-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl flex items-center justify-center gap-2 flex-1 sm:flex-none hover:bg-gray-50"
              >
                📚 สำรวจบทเรียน
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
                      className={`p-2 rounded-lg border-[2.5px] border-foreground flex justify-center items-center font-bold text-xs sm:text-sm relative transition-all duration-200 ${
                        selectedVideo === v.url
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
                  <span className="text-amber-500 text-base">⭐</span>
                  <span className="font-black text-pink-500 text-sm">+10 pts</span>
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
              <div className="bg-white/20 p-1 rounded-lg text-base">🏆</div>
              <div>
                <p className="text-[9px] font-bold uppercase leading-tight">Daily Streak</p>
                <p className="font-black text-sm leading-none">15 DAYS!</p>
              </div>
            </div>

            <div
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-amber-300 text-foreground p-2 sm:p-2.5 rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] items-center gap-1.5 hidden sm:flex lp-float-badge"
              style={{ "--badge-rotate": "4deg", animationDelay: "1.5s" } as React.CSSProperties}
            >
              <div className="bg-white/40 p-1 rounded-lg text-base">🎯</div>
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
        <footer className="bg-pink-500 py-5 sm:py-8 px-4 sm:px-8 border-t-[3px] border-foreground mt-auto relative overflow-hidden">
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
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-end sm:items-center justify-center" onClick={() => setShowLoginModal(false)}>
          <div
            className="cb-modal-enter bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-[3px] border-foreground overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col sm:m-4"
            style={{ boxShadow: "8px 8px 0 0 #1a1a1a" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-pink-500 p-5 sm:p-6 relative border-b-[3px] border-foreground shrink-0">
              {/* Drag indicator (mobile) */}
              <div className="sm:hidden w-10 h-1 bg-white/40 rounded-full mx-auto mb-3" />
              <button
                onClick={() => { setShowLoginModal(false); setError(""); setEmail(""); setPassword(""); }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 p-1.5 rounded-lg hover:bg-white/40 active:scale-95 transition-all"
              >
                <X size={18} strokeWidth={3} className="text-white" />
              </button>
              <div className="text-center text-white">
                <div className="text-4xl sm:text-5xl mb-2.5 cb-float-icon inline-block">👋</div>
                <h2 className="font-black text-2xl sm:text-3xl mb-1 leading-tight">{isSignup ? "New Player?" : "Welcome Back!"}</h2>
                <p className="font-semibold text-white/70 text-xs sm:text-sm">{isSignup ? "Create a profile to start winning." : "Log in to continue your streak."}</p>
              </div>
            </div>

            {/* Body — scrollable on small screens */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {error && (
                <div className="bg-red-50 border-[2.5px] border-red-300 text-red-600 px-3 py-2.5 rounded-xl mb-4 font-bold text-sm flex items-center gap-2">
                  <span className="shrink-0">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-3.5">
                {isSignup && (
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wide">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">👤</span>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">✉️</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">🔒</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                  </div>
                </div>
                {isSignup && (
                  <div>
                    <label className="block text-xs font-bold text-foreground/60 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">🔒</span>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-300 font-black text-base sm:text-lg rounded-xl py-3 sm:py-3.5 border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-[2.5px] border-foreground/30 border-t-foreground rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : isSignup ? "🚀 Sign Up" : "🎮 Let's Go!"}
                </button>
              </form>

              {!isSignup && (
                <div className="mt-5">
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-foreground/35 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Or continue with</span>
                    <div className="flex-1 h-px bg-foreground/10" />
                  </div>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white flex items-center justify-center gap-2.5 py-2.5 sm:py-3 font-bold text-sm rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 transition-all duration-200 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {loading ? "Loading..." : "Continue with Google"}
                  </button>
                </div>
              )}

              <div className="text-center mt-5 pb-2">
                <button
                  onClick={() => { setIsSignup(!isSignup); setError(""); setPassword(""); setUsername(""); setConfirmPassword(""); }}
                  disabled={loading}
                  className="text-pink-500 hover:text-pink-600 font-bold text-sm hover:underline disabled:opacity-50 transition-colors"
                >
                  {isSignup ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
