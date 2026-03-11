import { useState } from "react";
import { X, LogIn, UserPlus } from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate signup fields
    if (mode === "signup") {
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
      if (mode === "signup") {
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
      setLoading(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
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
      setLoading(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="brutal-card-lg bg-card w-full max-w-md animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-primary border-b-[3px] border-foreground px-5 py-3">
          <h2 className="font-display text-xl text-primary-foreground">
            {mode === "login" ? "Welcome Back!" : "Join SignMate!"}
          </h2>
          <button onClick={onClose} className="text-primary-foreground hover:text-primary-foreground/80">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border-l-4 border-destructive text-destructive px-4 py-3 rounded font-bold text-sm">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold font-body mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="brutal-input w-full font-body"
                placeholder="SignMaster99"
                disabled={loading}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold font-body mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brutal-input w-full font-body"
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold font-body mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="brutal-input w-full font-body"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold font-body mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="brutal-input w-full font-body"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="w-full brutal-btn-primary flex items-center justify-center gap-2 py-3 font-body disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              "กำลังโหลด..."
            ) : (
              <>
                {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
                {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </>
            )}
          </button>

          {mode === "login" && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-muted-foreground font-body text-xs uppercase">หรือ</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-foreground rounded-lg hover:bg-muted transition-all font-semibold font-body disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? "กำลังโหลด..." : "เข้าสู่ระบบด้วย Google"}
              </button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground font-body">
            {mode === "login" ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setPassword("");
                setConfirmPassword("");
              }}
              disabled={loading}
              className="text-primary font-semibold underline disabled:opacity-50"
            >
              {mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
