import { useState } from "react";
import { X, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: just close
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="brutal-card-lg bg-card w-full max-w-md animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-primary border-b-[3px] border-foreground px-5 py-3">
          <h2 className="font-display text-xl text-primary-foreground">
            {mode === "login" ? "Welcome Back!" : "Join SignQuest!"}
          </h2>
          <button onClick={onClose} className="text-primary-foreground hover:text-primary-foreground/80">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold font-body mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="brutal-input w-full font-body"
                placeholder="SignMaster99"
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
            />
          </div>

          <button type="submit" className="w-full brutal-btn-primary flex items-center justify-center gap-2 py-3 font-body">
            {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>

          <p className="text-center text-sm text-muted-foreground font-body">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-semibold underline"
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
