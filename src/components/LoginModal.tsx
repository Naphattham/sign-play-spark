import { useState } from "react";
import { X } from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/auth";
import handWaveImg from "@/asset/image/hand_wave.webp";

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
}

export function LoginModal({ show, onClose }: LoginModalProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
      setLoading(false);
      handleClose();
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
      setLoading(false);
      handleClose();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="cb-modal-enter bg-white w-full max-w-[340px] sm:max-w-md md:max-w-lg rounded-2xl border-[3px] border-foreground overflow-hidden flex flex-col"
        style={{
          boxShadow: "8px 8px 0 0 #1a1a1a",
          maxHeight: "min(90dvh, 88vh)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-pink-500 p-4 sm:p-6 relative border-b-[3px] border-foreground shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 bg-white/20 p-1.5 sm:p-2 rounded-lg hover:bg-white/40 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={3} className="text-white" />
          </button>
          <div className="text-center text-white">
            <div className="mb-1.5 sm:mb-2.5 cb-float-icon inline-flex items-center justify-center">
              <img src={handWaveImg} alt="Wave" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
            </div>
            <h2 className="font-black text-xl sm:text-2xl md:text-3xl mb-0.5 sm:mb-1 leading-tight">{isSignup ? "New Player?" : "Welcome Back!"}</h2>
            <p className="font-semibold text-white/70 text-[11px] sm:text-xs md:text-sm">{isSignup ? "Create a profile to start winning." : "Log in to continue your streak."}</p>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="p-3.5 sm:p-5 md:p-6 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="bg-red-50 border-[2.5px] border-red-300 text-red-600 px-3 py-2 sm:py-2.5 rounded-xl mb-3 sm:mb-4 font-bold text-xs sm:text-sm flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-2.5 sm:space-y-3.5">
            {isSignup && (
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-foreground/60 mb-1 sm:mb-1.5 uppercase tracking-wide">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">👤</span>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-foreground/60 mb-1 sm:mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">✉️</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-foreground/60 mb-1 sm:mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">🔒</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
              </div>
            </div>
            {isSignup && (
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-foreground/60 mb-1 sm:mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">🔒</span>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} required className="w-full pl-9 pr-4 py-2.5 sm:py-3 border-[2.5px] border-foreground rounded-xl text-sm font-semibold placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 disabled:opacity-50 shadow-[2px_2px_0_0_#1a1a1a] transition-all" />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-300 font-black text-sm sm:text-base md:text-lg rounded-xl py-2.5 sm:py-3 md:py-3.5 border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 sm:w-5 sm:h-5 border-[2.5px] border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Loading...
                </>
              ) : isSignup ? "Sign Up" : "Login"}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-3.5 sm:mt-5">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-3.5">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-foreground/35 font-bold text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">Or continue with</span>
                <div className="flex-1 h-px bg-foreground/10" />
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white flex items-center justify-center gap-2 sm:gap-2.5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-xl border-[2.5px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50 transition-all duration-200 hover:bg-gray-50"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? "Loading..." : "Continue with Google"}
              </button>
            </div>
          )}

          <div className="text-center mt-3.5 sm:mt-5 pb-1 sm:pb-2">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); setPassword(""); setUsername(""); setConfirmPassword(""); }}
              disabled={loading}
              className="text-pink-500 hover:text-pink-600 font-bold text-xs sm:text-sm hover:underline disabled:opacity-50 transition-colors"
            >
              {isSignup ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
