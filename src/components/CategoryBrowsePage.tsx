import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check } from "lucide-react";
import { categories, getPhrasesByCategory, type Category } from "@/lib/categories";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { LoadingScreen } from "@/components/LoadingScreen";

export function CategoryBrowsePage() {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<{ phrase: string; category: Category } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginTransitioning, setIsLoginTransitioning] = useState(false);

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
      setIsLoginTransitioning(true);
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 3500);
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
      setIsLoginTransitioning(true);
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 3500);
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  const getVideoUrl = (phrase: string, category: Category) => {
    let videoFileName = phrase;
    
    // Handle phrases with multiple options
    if (category === "general") {
      if (phrase.includes("สวัสดี") && phrase.includes("|")) {
        videoFileName = "สวัสดี (ผู้ใหญ่)";
      } else if (phrase.includes("กินแล้ว") && phrase.includes("|")) {
        videoFileName = "กินแล้ว";
      }
      // Handle phrases with question marks
      if (phrase === "กินข้าวหรือยัง?") {
        videoFileName = "กินข้าวแล้วหรือยัง";
      } else if (phrase === "สบายดีไหม?") {
        videoFileName = "สบายดีไหม";
      }
    }
    
    // Remove question marks from Q&A category video filenames
    if (category === "qa") {
      videoFileName = videoFileName.replace("?", "");
    }
    
    return `/videos/${category}/${videoFileName}.mp4`;
  };

  const categoryColors: Record<Category, string> = {
    general: "bg-sq-yellow",
    emotions: "bg-sq-pink",
    qa: "bg-purple-400",
    illness: "bg-red-400",
  };

  if (isLoginTransitioning) {
    return <LoadingScreen message="กำลังเข้าสู่ระบบ..." />;
  }

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
          `}
        </style>

        {/* Navigation */}
        <nav className="w-full py-6 px-8 flex justify-between items-center border-b-4 border-sq-black bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-sq-pink p-2 rounded-xl sq-border">
              <img src="/LOGO_SignMate.png" alt="SignMate Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="brand-font text-3xl tracking-tight text-sq-pink">SignMate</span>
              <p className="text-xs font-bold uppercase tracking-wider text-sq-pink/70">Learn. Sign. Level Up!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-sq-yellow px-6 py-2 rounded-xl sq-border sq-button-hover flex items-center gap-2 font-bold"
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
        <main className="max-w-7xl mx-auto px-6 py-8 md:py-12 flex-1">
          <div className="text-center mb-12 relative">
            <button 
              onClick={() => navigate(-1)}
              className="absolute right-0 top-0 bg-sq-yellow px-6 py-2 rounded-xl sq-border sq-button-hover flex items-center gap-2 font-bold"
            >
              ← กลับ
            </button>
            <h1 className="text-4xl md:text-5xl leading-tight brand-font mb-4">
              สำรวจ<span className="text-sq-pink">บทเรียน</span>ภาษามือ
            </h1>
            <p className="text-lg md:text-xl font-medium text-sq-black/70">
              เลือกหมวดหมู่และคำศัพท์ที่ต้องการเรียนรู้
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category) => {
              const categoryPhrases = getPhrasesByCategory(category.id);
              
              return (
                <div key={category.id} className="bg-white p-6 rounded-3xl sq-border-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`${categoryColors[category.id]} p-3 rounded-xl sq-border`}>
                      <span className="text-2xl">
                        {category.id === "general" && "👋"}
                        {category.id === "emotions" && "❤️"}
                        {category.id === "qa" && "❓"}
                        {category.id === "illness" && "🤒"}
                      </span>
                    </div>
                    <div>
                      <h2 className="brand-font text-2xl">{category.label}</h2>
                      <p className="text-sm font-bold text-sq-black/60">{categoryPhrases.length} คำศัพท์</p>
                    </div>
                  </div>

                  {/* Phrases Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {categoryPhrases.map((phrase) => (
                      <button
                        key={phrase.id}
                        onClick={() => setSelectedVideo({ phrase: phrase.text, category: category.id })}
                        className="bg-sq-cream p-4 rounded-xl sq-border sq-button-hover font-bold text-left hover:bg-sq-yellow/50 transition-all"
                      >
                        {phrase.text}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-sq-pink py-12 px-8 border-t-4 border-sq-black mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="brand-font text-2xl tracking-tight text-sq-cream">SignMate</span>
            </div>
            <div className="flex gap-8 font-bold text-sq-black/60">
              <a className="hover:text-sq-cream transition-colors" href="#">Privacy</a>
              <a className="hover:text-sq-cream transition-colors" href="#">Terms</a>
              <a className="hover:text-sq-cream transition-colors" href="#">Support</a>
              <a className="hover:text-sq-cream transition-colors" href="#">About</a>
            </div>
            <p className="font-bold text-sq-black/40">© 2026 SignMate Interactive. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Video Popup Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl sq-border-lg overflow-hidden animate-fade-in-up flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-sq-pink p-4 relative flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="text-2xl">📹</span>
                </div>
                <div>
                  <h3 className="brand-font text-2xl text-white">
                    {selectedVideo.phrase}
                  </h3>
                  <p className="text-sm font-bold text-white/80">
                    {categories.find(c => c.id === selectedVideo.category)?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Video Player */}
            <div className="p-4 flex flex-col items-center justify-center flex-shrink-0">
              <div className="bg-[#222] rounded-2xl overflow-hidden sq-border aspect-square w-full max-w-md">
                <video
                  key={getVideoUrl(selectedVideo.phrase, selectedVideo.category)}
                  src={getVideoUrl(selectedVideo.phrase, selectedVideo.category)}
                  autoPlay
                  loop
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-3 text-center">
                <p className="font-bold text-sq-black/70 text-sm">
                  ดูวิดีโอและฝึกฝนท่าทางตามให้ได้ 🎯
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
