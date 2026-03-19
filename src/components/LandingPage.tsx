import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check } from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/auth";
import generalImg from "@/asset/image/general.png";

interface LandingPageProps {
  onLoginSuccess: () => void;
}

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
  const [selectedVideo, setSelectedVideo] = useState("/videos/general/สวัสดี (ผู้ใหญ่)main.mp4");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate signup fields
    if (isSignup) {
      if (!username.trim()) {
        setError("กรุณากรอก Username");
        return;
      }
      if (password !== confirmPassword) {
        setError("รหัสผ่านไม่ตรงกัน");
        return;
      }
      if (password.length < 6) {
        setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
    }
    
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        result = await signUpWithEmail(email, password, username);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success
      setShowLoginModal(false);
      setLoading(false);
      // Firebase auth state will handle the transition
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Success
      setShowLoginModal(false);
      setLoading(false);
      // Firebase auth state will handle the transition
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen text-sq-black bg-sq-cream flex flex-col">
      {/* Custom Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@100;200;300;400;500&display=swap');
          
          body {
            font-family: 'Prompt', sans-serif;
          }

          h1, h2, h3, .brand-font {
            font-family: 'Prompt', sans-serif;
          }

          .sq-border {
            border: 3px solid #1A1A1A;
            box-shadow: 4px 4px 0px #1A1A1A;
          }
          
          .sq-border-lg {
            border: 4px solid #1A1A1A;
            box-shadow: 6px 6px 0px #1A1A1A;
          }

          .sq-button-hover:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px #1A1A1A;
          }

          .video-container video {
            transition: opacity 0.3s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .video-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }

          .hero-visual-section {
            will-change: auto;
          }

          .video-display-box {
            min-height: 0;
            contain: layout;
          }
        `}
      </style>

      {/* Navigation */}
      <nav className="w-full py-3 px-4 sm:py-4 sm:px-6 md:py-6 md:px-8 flex justify-between items-center border-b-4 border-sq-black bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-sq-pink p-2 rounded-xl sq-border">
            <img src="/LOGO_SignMate.png" alt="SignMate Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <span className="brand-font text-xl sm:text-2xl md:text-3xl tracking-tight text-sq-pink">SignMate</span>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sq-pink/70">Learn. Sign. Level Up!</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* <a className="font-bold hover:text-sq-pink transition-colors" href="#">How it works</a>
          <a className="font-bold hover:text-sq-pink transition-colors" href="#">Courses</a> */}
          <button 
            onClick={() => setShowLoginModal(true)}
            className="bg-sq-yellow px-3 py-1.5 sm:px-6 sm:py-2 rounded-xl sq-border sq-button-hover flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" x2="3" y1="12" y2="12"></line>
            </svg>
            Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 md:py-8 lg:py-12 flex-1 flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16 lg:gap-24">
        {/* Hero Text Section */}
        <div className="flex-1 space-y-6">
          <div className="inline-block bg-sq-pink text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest sq-border">
            เรียนรู้ภาษามือแบบอินเทอร์แอคทีฟ
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            <span className="whitespace-nowrap">เชี่ยวชาญ<span className="text-sq-pink">ภาษามือ</span></span> <br /> ผ่านการเล่นเกม!
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-sq-black/70 max-w-xl">
            วิธีเรียนรู้ภาษามือไทยที่สนุก ฟรี และมีประสิทธิภาพ พัฒนาทักษะของคุณด้วยการตอบรับแบบเรียลไทม์และมินิเกมที่น่าสนใจ
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-sq-yellow text-base sm:text-lg md:text-xl px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-2xl sq-border-lg sq-button-hover font-bold brand-font hover:bg-sq-dark-yellow transition-all"
            >
              เริ่มเกม
            </button>
            <button 
              onClick={() => navigate("/categories")}
              className="bg-white text-sm sm:text-base md:text-lg px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-2xl sq-border sq-button-hover font-bold flex items-center gap-2 sm:gap-3"
            >
              สำรวจบทเรียน
            </button>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-3 border-sq-black bg-blue-400 flex items-center justify-center text-white font-bold text-sm">JD</div>
              <div className="w-10 h-10 rounded-full border-3 border-sq-black bg-green-400 flex items-center justify-center text-white font-bold text-sm">AS</div>
              <div className="w-10 h-10 rounded-full border-3 border-sq-black bg-sq-pink flex items-center justify-center text-white font-bold text-sm">MK</div>
            </div>
            <p className="font-bold text-sq-black/60 text-xs sm:text-sm">มีผู้เรียนลงทะเบียน 0 คนในสัปดาห์นี้!</p>
          </div>
        </div>

        {/* Hero Visual Section */}
        <div className="flex-1 relative hero-visual-section">
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-sq-pink/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-sq-yellow/30 rounded-full blur-3xl -z-10"></div>
          
          <div className="bg-white p-3 sm:p-4 md:p-5 rounded-[1.5rem] sm:rounded-[2rem] sq-border-lg w-full max-w-sm sm:max-w-md mx-auto relative overflow-hidden video-display-box">
            {/* UI Header */}
            {/* <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span className="brand-font italic text-base">General</span>
              </div>
              <div className="bg-sq-yellow px-2 py-1 rounded-lg sq-border text-xs font-bold">2/7</div>
            </div> */}

            {/* Phrases Box */}
            <div className="bg-sq-pink/10 border-sq-pink border-3 rounded-2xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <img src={generalImg} alt="General" className="w-5 h-5 object-contain" />
                <span className="brand-font italic text-sq-pink text-lg">บทสนทนาทั่วไป</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSelectedVideo("/videos/general/สวัสดี (ผู้ใหญ่)main.mp4")}
                  className={`p-2 rounded-xl sq-border flex justify-center items-center font-bold text-base relative transition-all ${
                    selectedVideo === "/videos/general/สวัสดี (ผู้ใหญ่)main.mp4" 
                      ? "bg-sq-yellow" 
                      : "bg-gray-100 opacity-50 hover:opacity-75"
                  }`}
                >
                  สวัสดี(ผู้ใหญ่)
                  {selectedVideo === "/videos/general/สวัสดี (ผู้ใหญ่)main.mp4" && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-sq-pink rounded-full border-2 border-sq-black"></div>
                  )}
                </button>
                <button 
                  onClick={() => setSelectedVideo("/videos/general/สวัสดี (เพื่อน)main.mp4")}
                  className={`p-2 rounded-xl sq-border flex justify-center items-center font-bold text-base relative transition-all ${
                    selectedVideo === "/videos/general/สวัสดี (เพื่อน)main.mp4" 
                      ? "bg-sq-yellow" 
                      : "bg-gray-100 opacity-50 hover:opacity-75"
                  }`}
                >
                  สวัสดี(เพื่อน)
                  {selectedVideo === "/videos/general/สวัสดี (เพื่อน)main.mp4" && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-sq-pink rounded-full border-2 border-sq-black"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Camera Feed / Video Display */}
            <div className="bg-[#222] rounded-2xl p-2 aspect-square flex flex-col items-center justify-center border-3 border-sq-black overflow-hidden video-container">
              <div className="w-full h-full relative">
                <video 
                  key={selectedVideo}
                  src={selectedVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-xl video-fade-in absolute inset-0"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500 text-lg">⭐</span>
                <span className="font-bold text-sq-pink text-sm">+10 pts</span>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-sq-pink sq-border flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Achievement Tag */}
          <div className="absolute -bottom-5 -left-5 bg-sq-pink text-white p-2 sm:p-3 rounded-xl sq-border rotate-[-5deg] flex items-center gap-1.5 sm:gap-2 hidden sm:flex">
            <div className="bg-white/20 p-1.5 rounded-lg text-lg">🏆</div>
            <div>
              <p className="text-[10px] font-bold uppercase">Daily Streak</p>
              <p className="brand-font text-base leading-none">15 DAYS!</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-sq-pink py-6 px-4 sm:py-8 sm:px-6 md:py-12 md:px-8 border-t-4 border-sq-black mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 md:gap-8">
          <div className="flex items-center gap-3">
            <span className="brand-font text-2xl tracking-tight text-sq-cream">SignMate</span>
          </div>
          <div className="flex gap-4 sm:gap-6 md:gap-8 font-bold text-sq-black/60 text-sm sm:text-base">
            <a className="hover:text-sq-cream transition-colors" href="#">Privacy</a>
            <a className="hover:text-sq-cream transition-colors" href="#">Terms</a>
            <a className="hover:text-sq-cream transition-colors" href="#">Support</a>
            <a className="hover:text-sq-cream transition-colors" href="#">About</a>
          </div>
          <p className="font-bold text-sq-black/40 text-xs sm:text-sm text-center">© 2026 SignMate Interactive. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl sq-border-lg overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-sq-pink p-6 relative">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="absolute top-4 right-4 text-white hover:text-white/80 transition-colors"
              >
                <X size={24} />
              </button>
              <div className="text-center text-white">
                <div className="text-5xl mb-4">👋</div>
                <h2 className="brand-font text-3xl mb-2">
                  {isSignup ? "New Player?" : "Welcome Back!"}
                </h2>
                <p className="font-bold text-white/80 text-sm">
                  {isSignup ? "Create a profile to start winning." : "Log in to continue your streak."}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 font-bold text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-bold text-sq-black mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ชื่อผู้ใช้"
                      disabled={loading}
                      required
                      className="w-full px-4 py-3 border-3 border-sq-black rounded-xl focus:outline-none focus:ring-2 focus:ring-sq-pink font-bold placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-sq-black mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={loading}
                    required
                    className="w-full px-4 py-3 border-3 border-sq-black rounded-xl focus:outline-none focus:ring-2 focus:ring-sq-pink font-bold placeholder-gray-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-sq-black mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full px-4 py-3 border-3 border-sq-black rounded-xl focus:outline-none focus:ring-2 focus:ring-sq-pink font-bold placeholder-gray-400 disabled:opacity-50"
                  />
                </div>
                {isSignup && (
                  <div>
                    <label className="block text-sm font-bold text-sq-black mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      className="w-full px-4 py-3 border-3 border-sq-black rounded-xl focus:outline-none focus:ring-2 focus:ring-sq-pink font-bold placeholder-gray-400 disabled:opacity-50"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-sq-yellow py-4 rounded-xl sq-border sq-button-hover font-bold text-lg brand-font disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Loading..." : (isSignup ? "Sign Up" : "Let's Go!")}
                </button>
              </form>

              {!isSignup && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-gray-400 font-bold text-xs uppercase">Or continue with</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-3 border-sq-black rounded-xl hover:bg-gray-50 transition-all font-bold disabled:opacity-50 sq-border"
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

              <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setError('');
                      setPassword('');
                      setUsername('');
                      setConfirmPassword('');
                    }}
                    disabled={loading}
                    className="text-sq-pink hover:text-sq-dark-pink font-bold hover:underline disabled:opacity-50 transition-all"
                  >
                    {isSignup ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
