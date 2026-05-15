import { useEffect, useState } from "react";

export function LoadingScreen({ message = "กำลังโหลด..." }: { message?: string }) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Stagger entrance animation
    const t = setTimeout(() => setShowContent(true), 150);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Fast at first, slowing down near end
        const increment = prev < 60 ? 3 : prev < 80 ? 1.5 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 80);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-sq-cream overflow-hidden">

      {/* ── Animated background orbs ── */}
      <div className="loading-orb loading-orb-1"></div>
      <div className="loading-orb loading-orb-2"></div>
      <div className="loading-orb loading-orb-3"></div>

      {/* ── Dot grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#1A1A1A 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* ── Main content ── */}
      <div
        className="relative text-center w-full max-w-lg px-6"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* ── Logo block ── */}
        <div className="relative flex justify-center mb-12">
          {/* Outer ring - dashed, slow spin */}
          <div className="loading-ring loading-ring-outer"></div>

          {/* Inner ring - solid, reverse spin */}
          <div className="loading-ring loading-ring-inner"></div>

          {/* Logo container */}
          <div className="loading-logo-container">
            <img
              src="/LOGO_SignMate.png"
              alt="SignMate Logo"
              className="w-24 h-24 md:w-28 md:h-28 object-contain loading-logo-pulse"
            />
          </div>
        </div>

        {/* ── Brand name ── */}
        <div className="mb-6">
          <h1
            className="brand-font text-sq-black leading-[0.85] tracking-tight inline-block text-left"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}
          >
            <div className="text-6xl md:text-8xl font-bold ml-2">Sign</div>
            <div className="text-6xl md:text-8xl font-bold text-sq-pink ml-[1.5em] -mt-2 md:-mt-3">Mate</div>
          </h1>



          <p
            className="text-sm md:text-base text-sq-black/40 tracking-[0.3em] uppercase mt-4 font-medium"
            style={{
              opacity: showContent ? 1 : 0,
              transition: "opacity 0.6s ease 0.5s",
            }}
          >
            AI Sign Language Trainer
          </p>
        </div>

        {/* ── Progress bar (neo-brutal style) ── */}
        <div
          className="w-full max-w-sm mx-auto"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s",
          }}
        >
          {/* Bar container */}
          <div className="relative h-7 md:h-8 bg-white rounded-full border-[3px] border-sq-black overflow-hidden"
            style={{ boxShadow: "3px 3px 0px #1A1A1A" }}>
            {/* Fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full loading-bar-fill"
              style={{
                width: `${progress}%`,
                transition: "width 0.3s ease-out",
              }}
            ></div>

            {/* Shine sweep */}
            <div className="loading-bar-shine"></div>
          </div>

          {/* Progress text */}
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm md:text-base font-semibold text-sq-black/60 tracking-wide">
              {message}
            </p>
            <span className="text-sm font-bold text-sq-pink tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* ── Bouncing dots ── */}
        <div
          className="flex justify-center gap-3 mt-10"
          style={{
            opacity: showContent ? 1 : 0,
            transition: "opacity 0.6s ease 0.6s",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="loading-bounce-dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
          ))}
        </div>

      </div>

      {/* Powered by Wrapper */}
      <div
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-3 text-[10px] sm:text-xs text-sq-black/70 font-medium"
        style={{
          opacity: showContent ? 1 : 0,
          transition: "opacity 0.6s ease 0.4s",
        }}
      >
        {/* Line 1: เปลี่ยนจาก flex-col เป็น flex-row เพื่อให้อยู่บรรทัดเดียวกันใน Mobile */}
        <div className="flex flex-row items-center gap-2">
          <span className="whitespace-nowrap">Powered by</span>
          <div className="flex items-center gap-2">
            <img src="/ONLYBU_LOGO.webp" alt="BU Logo" className="h-5 md:h-7 object-contain" />
            <span className="whitespace-nowrap">School of Engineering · Bangkok University</span>
          </div>
        </div>

        {/* Line 2: เปลี่ยนจาก flex-col เป็น flex-row เช่นกัน */}
        <div className="flex flex-row items-center gap-2">
          <span className="whitespace-nowrap">Associate with</span>
          <div className="flex items-center gap-2">
            <img src="/SuanDusit_LOGO.webp" alt="Suan Dusit Logo" className="h-5 md:h-7 object-contain" />
            <span className="whitespace-nowrap">Suan Dusit University</span>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Background Orbs ── */
        .loading-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          will-change: transform;
        }

        .loading-orb-1 {
          width: 550px;
          height: 550px;
          background: #FF4D8D;
          top: -10%;
          right: -10%;
          opacity: 0.12;
          animation: loadingOrbFloat1 8s ease-in-out infinite;
        }

        .loading-orb-2 {
          width: 420px;
          height: 420px;
          background: #FFD369;
          bottom: -5%;
          left: -10%;
          animation: loadingOrbFloat2 10s ease-in-out infinite;
        }

        .loading-orb-3 {
          width: 280px;
          height: 280px;
          background: #FF4D8D;
          bottom: 20%;
          right: 20%;
          opacity: 0.12;
          animation: loadingOrbFloat3 6s ease-in-out infinite;
        }

        @keyframes loadingOrbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }

        @keyframes loadingOrbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.15); }
        }

        @keyframes loadingOrbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 20px); }
        }

        /* ── Logo Rings ── */
        .loading-ring {
          position: absolute;
          border-radius: 50%;
        }

        .loading-ring-outer {
          width: 200px;
          height: 200px;
          border: 2px dashed rgba(255, 77, 141, 0.25);
          animation: loadingSpinCW 12s linear infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .loading-ring-inner {
          width: 170px;
          height: 170px;
          border: 2px solid transparent;
          border-top-color: #FF4D8D;
          border-right-color: #FFD369;
          animation: loadingSpinCCW 4s linear infinite;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        @keyframes loadingSpinCW {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes loadingSpinCCW {
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }

        /* ── Logo Container ── */
        .loading-logo-container {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 130px;
          height: 130px;
          background: linear-gradient(135deg, #FF4D8D, #E03D7A);
          border-radius: 2rem;
          border: 3px solid #1A1A1A;
          box-shadow: 5px 5px 0px #1A1A1A, 0 0 50px rgba(255, 77, 141, 0.35);
        }

        @media (min-width: 768px) {
          .loading-logo-container {
            width: 150px;
            height: 150px;
            border-radius: 2.5rem;
          }
        }

        .loading-logo-pulse {
          animation: loadingLogoPulse 2.5s ease-in-out infinite;
        }

        @keyframes loadingLogoPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.06); filter: brightness(1.15); }
        }

        /* ── Progress Bar Fill ── */
        .loading-bar-fill {
          background: linear-gradient(90deg, #FFD369, #FF4D8D, #FF4D8D);
          background-size: 200% 100%;
          animation: loadingBarGradient 2s linear infinite;
        }

        @keyframes loadingBarGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* ── Bar Shine ── */
        .loading-bar-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: loadingShine 2s ease-in-out infinite;
          transform: translateX(-100%) skewX(-15deg);
        }

        @keyframes loadingShine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        /* ── Bouncing Dots ── */
        .loading-bounce-dot {
          width: 10px;
          height: 10px;
          background: #FF4D8D;
          border-radius: 50%;
          animation: loadingBounce 1.2s ease-in-out infinite;
        }

        @keyframes loadingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }
          30% {
            transform: translateY(-12px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}