import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { categories, getPhrasesByCategory, type Category } from "@/lib/categories";
import logoSignMate from "@/asset/image/LOGO_SignMate.png";

export function CategoryBrowsePage() {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<{ phrase: string; category: Category } | null>(null);

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
      if (phrase === "กินข้าวแล้วหรือยัง?") {
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

  return (
    <>
      <div className="min-h-screen text-sq-black bg-sq-cream">
        {/* Custom Styles */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Quicksand:wght@400;700&display=swap');
            
            body {
              font-family: 'Quicksand', sans-serif;
            }

            h1, h2, h3, .brand-font {
              font-family: 'Fredoka One', cursive;
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
              <img src={logoSignMate} alt="SignMate Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <span className="brand-font text-3xl tracking-tight text-sq-pink">SignMate</span>
              <p className="text-xs font-bold uppercase tracking-wider text-sq-pink/70">Learn. Sign. Level Up!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className="bg-sq-yellow px-6 py-2 rounded-xl sq-border sq-button-hover flex items-center gap-2 font-bold"
            >
              ← กลับ
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
          <div className="text-center mb-12">
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
        <footer className="bg-sq-pink py-12 px-8 border-t-4 border-sq-black mt-16">
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
    </>
  );
}
