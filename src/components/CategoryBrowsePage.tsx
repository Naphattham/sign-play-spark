import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowLeft, Play, Search } from "lucide-react";
import { categories, getPhrasesByCategory, type Category, getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";

// Category images
import generalImg from "@/asset/image/general.webp";
import emotionalImg from "@/asset/image/emotional.webp";
import qaImg from "@/asset/image/qa.webp";
import illnessImg from "@/asset/image/illness.webp";

// Phrase images (mapped by english key)
import helloImg from "@/asset/image/Hello.webp";
import goodbyeImg from "@/asset/image/Goodbye.webp";
import haveYouEatenImg from "@/asset/image/Have you eaten.webp";
import alreadyAteImg from "@/asset/image/Already ate | Not yet.webp";
import howAreYouImg from "@/asset/image/how_are_you.webp";
import fineUnhappyImg from "@/asset/image/I'm fine | Unhappy.webp";
import angryImg from "@/asset/image/angry.webp";
import scaredImg from "@/asset/image/Scared.webp";
import loveImg from "@/asset/image/Love.webp";
import tiredImg from "@/asset/image/Tired.webp";
import whatImg from "@/asset/image/What.webp";
import whyImg from "@/asset/image/Why.webp";
import howMuchImg from "@/asset/image/How much.webp";
import yesImg from "@/asset/image/yes.webp";
import noImg from "@/asset/image/no.webp";
import coldImg from "@/asset/image/cold.webp";
import soreThroatImg from "@/asset/image/Sore throat.webp";
import stomachacheImg from "@/asset/image/Stomachache.webp";
import headacheImg from "@/asset/image/headache.webp";
import feverImg from "@/asset/image/fever.webp";

const PHRASE_IMG_MAP: Record<string, string> = {
  "Hello": helloImg,
  "Goodbye": goodbyeImg,
  "Have you eaten?": haveYouEatenImg,
  "Already ate | Not yet": alreadyAteImg,
  "How are you?": howAreYouImg,
  "I'm fine | Unhappy": fineUnhappyImg,
  "Angry": angryImg,
  "Scared": scaredImg,
  "Love": loveImg,
  "Tired": tiredImg,
  "What?": whatImg,
  "Why?": whyImg,
  "How much?": howMuchImg,
  "Yes": yesImg,
  "No": noImg,
  "Cold": coldImg,
  "Sore throat": soreThroatImg,
  "Stomachache": stomachacheImg,
  "Headache": headacheImg,
  "Fever": feverImg,
};

const CATEGORY_THEMES: Record<Category, { bg: string; accent: string; glow: string; img: string }> = {
  general: { bg: "bg-amber-300", accent: "hsl(44 100% 70%)", glow: "hsl(44 100% 70% / 0.4)", img: generalImg },
  emotions: { bg: "bg-pink-400", accent: "hsl(342 100% 64%)", glow: "hsl(342 100% 64% / 0.4)", img: emotionalImg },
  qa: { bg: "bg-violet-400", accent: "hsl(270 60% 60%)", glow: "hsl(270 60% 60% / 0.4)", img: qaImg },
  illness: { bg: "bg-red-400", accent: "hsl(0 84% 60%)", glow: "hsl(0 84% 60% / 0.4)", img: illnessImg },
};

export function CategoryBrowsePage() {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<{ phrase: string; category: Category } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getVideoSrc = (phrase: string, category: Category) => {
    let videoFileName = phrase;
    if (category === "general") {
      if (phrase.includes("สวัสดี") && phrase.includes("|")) videoFileName = "สวัสดี (ผู้ใหญ่)";
      else if (phrase.includes("กินแล้ว") && phrase.includes("|")) videoFileName = "กินแล้ว";
      else if (phrase.includes("สบายดี") && phrase.includes("|")) videoFileName = "สบายดี";
      if (phrase === "กินข้าวหรือยัง?") videoFileName = "กินข้าวแล้วหรือยัง";
      else if (phrase === "สบายดีไหม?") videoFileName = "สบายดีไหม";
    }
    if (category === "qa") videoFileName = videoFileName.replace("?", "");
    return getVideoUrl(category, videoFileName);
  };

  const totalPhrases = categories.reduce((acc, c) => acc + getPhrasesByCategory(c.id).length, 0);

  return (
    <>
      <div className="flex flex-col">

        {/* ── Hero Section ── */}
        <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-2 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
            <div className="cb-title-reveal">
              <button
                onClick={() => navigate(-1)}
                className="brutal-btn bg-white/80 backdrop-blur-sm text-foreground flex items-center gap-1.5 text-sm font-bold rounded-xl mb-4 sm:mb-5"
              >
                <ArrowLeft size={16} strokeWidth={3} />
                กลับ
              </button>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight">
                สำรวจ<span className="text-pink-500">บทเรียน</span>
                <br className="sm:hidden" />
                ภาษามือ
              </h1>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-foreground/60 mt-2 sm:mt-3 max-w-md">
                เลือกหมวดหมู่และคำศัพท์ที่ต้องการเรียนรู้ — ดูวิดีโอตัวอย่างท่าทางภาษามือได้ทันที
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 sm:gap-3 cb-badge-count" style={{ animationDelay: "0.3s" }}>
              <div className="bg-white/80 backdrop-blur-sm border-[3px] border-foreground rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-[3px_3px_0_0_#1a1a1a]">
                <span className="text-xs sm:text-sm font-bold text-foreground/60">หมวดหมู่</span>
                <p className="text-lg sm:text-xl font-black text-pink-500 leading-none">{categories.length}</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border-[3px] border-foreground rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-[3px_3px_0_0_#1a1a1a]">
                <span className="text-xs sm:text-sm font-bold text-foreground/60">คำศัพท์</span>
                <p className="text-lg sm:text-xl font-black text-amber-500 leading-none">{totalPhrases}</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-5 sm:mt-6 relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder="ค้นหาคำศัพท์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm border-[3px] border-foreground rounded-xl font-semibold text-sm sm:text-base placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-[3px_3px_0_0_#1a1a1a] transition-shadow"
            />
          </div>
        </header>

        {/* ── Categories Grid ── */}
        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {categories.map((category, catIdx) => {
              const categoryPhrases = getPhrasesByCategory(category.id);
              const theme = CATEGORY_THEMES[category.id];
              const filtered = searchQuery
                ? categoryPhrases.filter(p => p.text.includes(searchQuery) || p.english?.toLowerCase().includes(searchQuery.toLowerCase()))
                : categoryPhrases;

              if (searchQuery && filtered.length === 0) return null;

              return (
                <div
                  key={category.id}
                  className="cb-card-enter bg-white/90 backdrop-blur-sm rounded-2xl border-[3px] border-foreground overflow-hidden"
                  style={{
                    animationDelay: `${catIdx * 0.1}s`,
                    boxShadow: `6px 6px 0 0 #1a1a1a`,
                  }}
                >
                  {/* Card header */}
                  <div className={`${theme.bg} px-4 sm:px-5 py-3 sm:py-4 border-b-[3px] border-foreground flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <img src={theme.img} alt={category.label} className="w-8 h-8 sm:w-10 sm:h-10 object-contain cb-float-icon" style={{ animationDelay: `${catIdx * 0.5}s` }} />
                      <div>
                        <h2 className="font-black text-lg sm:text-xl text-foreground leading-tight">{category.label}</h2>
                        <p className="text-xs sm:text-sm font-bold text-foreground/60">{category.id === "general" ? "General" : category.id === "emotions" ? "Emotions" : category.id === "qa" ? "Q&A" : "Illness"}</p>
                      </div>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm border-2 border-foreground/30 rounded-lg px-2.5 py-1 cb-badge-count" style={{ animationDelay: `${0.4 + catIdx * 0.1}s` }}>
                      <span className="text-xs sm:text-sm font-black">{categoryPhrases.length} คำ</span>
                    </div>
                  </div>

                  {/* Phrases grid */}
                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      {filtered.map((phrase, phraseIdx) => (
                        <button
                          key={phrase.id}
                          onMouseEnter={() => { fetch(getVideoSrc(phrase.text, category.id)).catch(() => {}); }}
                          onClick={() => setSelectedVideo({ phrase: phrase.text, category: category.id })}
                          className="cb-phrase-pop group relative bg-gradient-to-br from-white to-gray-50 p-2.5 sm:p-3 rounded-xl border-[2.5px] border-foreground font-bold text-left text-xs sm:text-sm transition-all duration-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#1a1a1a]"
                          style={{
                            animationDelay: `${0.3 + catIdx * 0.1 + phraseIdx * 0.04}s`,
                            boxShadow: `3px 3px 0 0 #1a1a1a`,
                          }}
                        >
                          <div className="flex items-start gap-1.5">
                            {phrase.english && PHRASE_IMG_MAP[phrase.english] && <img src={PHRASE_IMG_MAP[phrase.english]} alt={phrase.english} className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0" />}
                            <span className="leading-snug">{phrase.text}</span>
                          </div>
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.glow}, transparent)` }} />
                          <Play className="absolute bottom-1.5 right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground/20 group-hover:text-foreground/50 transition-colors" strokeWidth={3} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {searchQuery && categories.every(c => getPhrasesByCategory(c.id).filter(p => p.text.includes(searchQuery) || p.english?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) && (
            <div className="text-center py-16">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="font-bold text-foreground/50 text-lg">ไม่พบคำศัพท์ที่ค้นหา</p>
              <button onClick={() => setSearchQuery("")} className="mt-3 brutal-btn bg-amber-300 text-sm font-bold rounded-xl">ล้างการค้นหา</button>
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="bg-pink-500 py-5 sm:py-8 px-4 sm:px-8 border-t-[3px] border-foreground mt-auto relative overflow-hidden shrink-0">
          <div className="absolute inset-0 cb-shimmer-bar pointer-events-none" />
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="font-black text-xl tracking-tight text-white">SignMate</span>
            </div>
            <p className="font-bold text-white/50 text-xs sm:text-sm text-center">© 2026 SignMate Interactive. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* ── Video Modal ── */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedVideo(null)}>
          <div
            className="cb-modal-enter bg-white w-full max-w-2xl rounded-2xl border-[3px] border-foreground overflow-hidden flex flex-col max-h-[90vh]"
            style={{ boxShadow: `8px 8px 0 0 #1a1a1a` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${CATEGORY_THEMES[selectedVideo.category].bg} px-4 sm:px-5 py-3 sm:py-4 border-b-[3px] border-foreground flex items-center justify-between shrink-0`}>
              <div className="flex items-center gap-2.5">
                <div className="bg-white/25 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg border-2 border-foreground/20">
                  <img src={CATEGORY_THEMES[selectedVideo.category].img} alt="" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-foreground leading-tight">{selectedVideo.phrase}</h3>
                  <p className="text-xs sm:text-sm font-bold text-foreground/60">{categories.find(c => c.id === selectedVideo.category)?.label}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg border-2 border-foreground/20 hover:bg-white/40 transition-colors">
                <X size={20} strokeWidth={3} className="text-foreground" />
              </button>
            </div>
            <div className="p-3 sm:p-5 flex flex-col items-center shrink-0">
              <div className="bg-foreground rounded-xl overflow-hidden border-[3px] border-foreground aspect-square w-full max-w-sm cb-border-glow">
                <VideoPlayer
                  key={getVideoSrc(selectedVideo.phrase, selectedVideo.category)}
                  src={getVideoSrc(selectedVideo.phrase, selectedVideo.category)}
                  autoPlay loop muted playsInline preload="auto"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 font-bold text-foreground/50 text-xs sm:text-sm text-center">ดูวิดีโอและฝึกฝนท่าทางตามให้ได้ 🎯</p>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
