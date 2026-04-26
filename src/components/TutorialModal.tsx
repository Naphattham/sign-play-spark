import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";

// Use public paths instead of static imports so images are loaded on-demand
// (not bundled into JS) — saves ~5.5 MB from initial page load
const SLIDES = [
  { src: "/tutorial-1.jpg", title: "เริ่มต้นใช้งาน", desc: "เลือกเมนู Lesson แล้วกด Start Lesson" },
  { src: "/tutorial-2.jpg", title: "หน้าฝึกท่าทาง", desc: "ทำท่าให้ทั้งตัวอยู่ในกรอบกล้อง" },
  { src: "/tutorial-3.jpg", title: "ฝึกซ้อมตามแบบ", desc: "ดูวิดีโอตัวอย่างแล้วทำตาม" },
  { src: "/tutorial-4.jpg", title: "รับคะแนน!", desc: "ทำท่าถูกต้องเพื่อรับคะแนนสะสม" },
];

interface TutorialModalProps {
  onClose: () => void;
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  const [current, setCurrent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLastSlide = current === SLIDES.length - 1;

  // mount animation
  useEffect(() => {
    const t = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const goTo = (next: number) => {
    if (next >= 0 && next < SLIDES.length) setCurrent(next);
  };

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, handleClose]);

  // touch / swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };
  const handleTouchEnd = () => {
    if (Math.abs(touchDelta) > 50) {
      if (touchDelta < 0) next();
      else prev();
    }
    setTouchStart(null);
    setTouchDelta(0);
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        backgroundColor: isExiting ? "rgba(0,0,0,0)" : isVisible ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
        backdropFilter: isVisible && !isExiting ? "blur(8px)" : "blur(0px)",
        transition: "background-color 300ms, backdrop-filter 300ms",
      }}
      onClick={handleClose}
    >
      {/* ── modal card ── */}
      <div
        ref={containerRef}
        className="relative w-[92vw] max-w-3xl mx-auto flex flex-col"
        style={{
          transform: isExiting
            ? "scale(0.92) translateY(20px)"
            : isVisible
              ? "scale(1) translateY(0)"
              : "scale(0.92) translateY(20px)",
          opacity: isExiting ? 0 : isVisible ? 1 : 0,
          transition: "transform 300ms cubic-bezier(.4,0,.2,1), opacity 300ms",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Main card container ── */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border-[3px] border-black overflow-hidden shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000]">

          {/* ── Header bar ── */}
          <div className="bg-pink-500 px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between border-b-[3px] border-black">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">📖</span>
              <h2 className="font-black text-white text-sm sm:text-base md:text-lg tracking-tight">วิธีเล่น</h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Step counter badge */}
              <div className="bg-white/20 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                <span className="font-black text-white text-[11px] sm:text-xs tracking-wider">
                  {current + 1} / {SLIDES.length}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                aria-label="Close tutorial"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/40 active:scale-90 transition-all"
              >
                <X size={16} strokeWidth={3} className="text-white" />
              </button>
            </div>
          </div>

          {/* ── Image carousel ── */}
          <div
            className="relative overflow-hidden bg-gray-100"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex w-full"
              style={{
                transform: `translateX(calc(-${current * 100}% + ${isDragging ? touchDelta : 0}px))`,
                transition: isDragging ? "none" : "transform 450ms cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            >
              {SLIDES.map((slide, i) => (
                <img
                  key={i}
                  src={slide.src}
                  alt={`Tutorial step ${i + 1}`}
                  draggable={false}
                  className="w-full h-auto object-contain shrink-0 select-none"
                />
              ))}
            </div>

            {/* Prev / Next overlay buttons (hidden on very small screens — swipe instead) */}
            <button
              onClick={prev}
              disabled={current === 0}
              aria-label="Previous slide"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 border-[2.5px] border-black rounded-full items-center justify-center shadow-[3px_3px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:scale-95 active:shadow-none active:scale-90 transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
            <button
              onClick={next}
              disabled={isLastSlide}
              aria-label="Next slide"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 border-[2.5px] border-black rounded-full items-center justify-center shadow-[3px_3px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:scale-95 active:shadow-none active:scale-90 transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </div>

          {/* ── Footer: info + dots + action ── */}
          <div className="px-3 py-3 sm:px-5 sm:py-4 border-t-[3px] border-black bg-amber-50">
            {/* Slide info */}
            <div className="text-center mb-2.5 sm:mb-3">
              <h3 className="font-black text-sm sm:text-base md:text-lg text-foreground leading-tight">
                {SLIDES[current].title}
              </h3>
              <p className="font-semibold text-foreground/50 text-[11px] sm:text-xs md:text-sm mt-0.5">
                {SLIDES[current].desc}
              </p>
            </div>

            {/* Dots + action row */}
            <div className="flex items-center gap-3">
              {/* Prev button (mobile) / spacer (desktop) — fixed width zone */}
              <div className="flex-1 flex justify-start">
                <button
                  onClick={prev}
                  disabled={current === 0}
                  className="sm:invisible w-8 h-8 sm:w-9 sm:h-9 bg-white border-[2.5px] border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all disabled:opacity-30 disabled:pointer-events-none shrink-0"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Dot indicators — always centered */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="transition-all duration-300"
                    style={{
                      width: i === current ? 24 : 8,
                      height: 8,
                      borderRadius: 9999,
                      backgroundColor: i === current ? "#c11660" : "#d4d3cc",
                      border: "2px solid #000",
                      boxShadow: i === current ? "2px 2px 0 0 #000" : "1px 1px 0 0 #000",
                    }}
                  />
                ))}
              </div>

              {/* Next / Start button — fixed width zone */}
              <div className="flex-1 flex justify-end relative">
                {/* Arrow button — visible on non-last slides */}
                <button
                  onClick={next}
                  className={`sm:invisible w-8 h-8 sm:w-9 sm:h-9 bg-white border-[2.5px] border-black rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#000] shrink-0 ${isLastSlide ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
                {/* Start button — visible on last slide only */}
                <button
                  onClick={handleClose}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 bg-amber-300 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-[2.5px] border-black font-black text-xs sm:text-sm shadow-[3px_3px_0_0_#000] shrink-0 whitespace-nowrap ${isLastSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <Play size={14} strokeWidth={3} fill="currentColor" />
                  เริ่มเลย!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
