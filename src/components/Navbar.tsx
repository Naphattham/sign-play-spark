import { useState, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { LoginModal } from "@/components/LoginModal";
import neoRunGif from "../asset/image/rungif/neo-run.gif";
import postRunGif from "../asset/image/rungif/post-run.gif";
import iceRunGif from "../asset/image/rungif/ice-run.gif";
import ajRunGif from "../asset/image/rungif/aj-run.gif";
import faiRunGif from "../asset/image/rungif/fai-run.gif";

export interface NavbarHandle {
  openLogin: () => void;
}

export const Navbar = forwardRef<NavbarHandle>(function Navbar(_props, ref) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useImperativeHandle(ref, () => ({
    openLogin: () => setShowLoginModal(true),
  }));

  return (
    <>
      <nav className="z-50 relative w-full py-3 px-4 sm:py-4 sm:px-8 flex justify-between items-center border-b-[3px] border-foreground bg-white/85 backdrop-blur-md">
        {/* Running GIF Animation Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 flex items-end gap-2 sm:gap-4 w-max walk-patrol-train z-0">
            <img 
              src={neoRunGif} 
              alt="Running Neo" 
              className="h-10 sm:h-14 w-auto"
            />
            <img 
              src={postRunGif} 
              alt="Running Post" 
              className="h-14 sm:h-16 w-auto -scale-x-100"
            />
            <img 
              src={iceRunGif} 
              alt="Running Ice" 
              className="h-14 sm:h-16 w-auto"
            />
            <img 
              src={faiRunGif} 
              alt="Running Fai" 
              className="h-14 sm:h-16 w-auto -scale-x-100"
            />
            <img 
              src={ajRunGif} 
              alt="Running AJ" 
              className="h-14 sm:h-16 w-auto -scale-x-100"
            />
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="bg-pink-400 p-1.5 sm:p-2 rounded-xl border-[3px] border-foreground shadow-[3px_3px_0_0_#1a1a1a] group-hover:shadow-[1px_1px_0_0_#1a1a1a] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-200">
            <img src="/LOGO_SignMate.png" alt="SignMate Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
          </div>
          <div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-pink-500">SignMate</span>
            <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-pink-400/70 leading-none">Learn · Sign · Level Up!</p>
          </div>
        </div>
        <button
          onClick={() => setShowLoginModal(true)}
          className="relative z-10 brutal-btn bg-amber-300 text-foreground flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-bold rounded-xl"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" />
          </svg>
          Login
        </button>
      </nav>

      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
});
