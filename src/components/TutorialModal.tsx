import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Use public paths instead of static imports so images are loaded on-demand
// (not bundled into JS) — saves ~5.5 MB from initial page load
const SLIDES = [
  "/tutorial-1.jpg",
  "/tutorial-2.jpg",
  "/tutorial-3.jpg",
  "/tutorial-4.jpg",
];

interface TutorialModalProps {
  onClose: () => void;
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  const [current, setCurrent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // mount animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 350);
  }, [onClose]);

  const goTo = (next: number) => {
    setCurrent(next);
  };

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
  };

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current]);

  return (
    /* ── backdrop ── */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        backgroundColor: isExiting
          ? "rgba(0,0,0,0)"
          : isVisible
          ? "rgba(0,0,0,0.72)"
          : "rgba(0,0,0,0)",
        backdropFilter: isVisible && !isExiting ? "blur(6px)" : "blur(0px)",
        transition: "background-color 350ms, backdrop-filter 350ms",
      }}
    >
      {/* ── modal card ── */}
      <div
        className="relative w-[95vw] max-w-6xl flex flex-col items-center"
        style={{
          transform: isExiting
            ? "scale(0.92) translateY(16px)"
            : isVisible
            ? "scale(1) translateY(0)"
            : "scale(0.92) translateY(16px)",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          transition: "transform 350ms cubic-bezier(.4,0,.2,1), opacity 350ms",
        }}
      >
        {/* ── close button (top-right) ── */}
        <button
          onClick={handleClose}
          aria-label="Close tutorial"
          className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[3px_3px_0_0_#000] hover:bg-red-500 hover:text-white hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* ── image + side arrows ── */}
        <div className="relative w-full flex items-center gap-2 sm:gap-3">
          {/* Left arrow */}
          <button
            onClick={prev}
            disabled={current === 0}
            aria-label="Previous slide"
            className="shrink-0 w-11 h-11 sm:w-16 sm:h-16 bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0_0_#000]"
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>

          {/* Image frame */}
          <div className="flex-1 border-[4px] border-black rounded-2xl overflow-hidden shadow-[8px_8px_0_0_#000] bg-black">
            <div 
              className="flex w-full h-full"
              style={{
                transform: `translateX(-${current * 100}%)`,
                transition: "transform 500ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            >
              {SLIDES.map((slide, i) => (
                <img
                  key={i}
                  src={slide}
                  alt={`Tutorial step ${i + 1}`}
                  draggable={false}
                  className="w-full h-auto object-contain shrink-0 select-none"
                />
              ))}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            disabled={current === SLIDES.length - 1}
            aria-label="Next slide"
            className="shrink-0 w-11 h-11 sm:w-16 sm:h-16 bg-white border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0_0_#000]"
          >
            <ChevronRight size={32} strokeWidth={3} />
          </button>
        </div>

        {/* ── dot indicators ── */}
        <div className="flex items-center gap-2.5 mt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-250"
              style={{
                width: i === current ? 28 : 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: i === current ? "#c11660" : "#d4d3cc",
                border: "2.5px solid #000",
                boxShadow: i === current ? "2px 2px 0 0 #000" : "1px 1px 0 0 #000",
              }}
            />
          ))}
        </div>

        {/* ── slide counter label ── */}
        <p className="mt-3 font-black text-white text-sm tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)]">
          {current + 1} / {SLIDES.length}
        </p>
      </div>
    </div>
  );
}
