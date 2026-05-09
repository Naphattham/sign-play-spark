import { useEffect } from "react";
import { Category, categories, getPhrasesByCategory, isPhraseCompletedCheck } from "@/lib/categories";
import { warmUpModel } from "@/lib/signLanguageAPI";

import generalImg from "@/asset/image/general.webp";
import emotionalImg from "@/asset/image/emotional.webp";
import qaImg from "@/asset/image/qa.webp";
import illnessImg from "@/asset/image/illness.webp";

export interface LessonsPageProps {
  onCategorySelect: (category: Category) => void;
  completedPhrases: Set<string>;
  streak: number;
}

export function LessonsPage({ onCategorySelect, completedPhrases, streak }: LessonsPageProps) {
  // 🔥 สั่ง Preload (Warm Up) ทันทีที่เปิดเข้ามาหน้านี้
  useEffect(() => {
    warmUpModel();
  }, []);

  // 🔥 สั่ง Preload อีกครั้งเพื่อความชัวร์ก่อนส่งต่อให้หน้า Game
  const handleCategoryClick = (categoryId: Category) => {
    warmUpModel();
    onCategorySelect(categoryId);
  };

  // calculate total progress
  const allPhrases = categories.flatMap(c => getPhrasesByCategory(c.id));
  const totalAll = allPhrases.length;
  const completedAll = allPhrases.filter(p => isPhraseCompletedCheck(p.id, completedPhrases)).length;
  const totalProgressPercent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return (
    <div className="relative flex-1 bg-background rounded-xl">
      <section className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full min-h-[calc(100vh-10rem)] pb-28 sm:pb-12 md:pb-12">
        <div className="mb-4 sm:mb-6 text-center md:text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-1 md:mb-2 font-display">เริ่มเรียนรู้กันเลย!</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium font-body">เลือกหัวข้อที่คุณต้องการฝึกฝนภาษามือวันนี้</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 font-body">
          {/* Category 1: General Conversation */}
          <button 
            onClick={() => handleCategoryClick("general")}
            className="group relative bg-primary border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '0ms', animationDuration: '500ms', animationFillMode: 'both' }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 transition-transform group-hover:scale-110">
              <img src={generalImg} alt="บทสนทนาทั่วไป" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="mt-4 md:mt-0">
              <span className="block text-white/80 font-bold text-base md:text-lg mb-0.5 md:mb-1">01</span>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight font-display">บทสนทนาทั่วไป</h3>
            </div>
          </button>

          {/* Category 2: Emotions */}
          <button 
            onClick={() => handleCategoryClick("emotions")}
            className="group relative bg-secondary border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '100ms', animationDuration: '500ms', animationFillMode: 'both' }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 transition-transform group-hover:scale-110">
              <img src={emotionalImg} alt="อารมณ์" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="mt-4 md:mt-0">
              <span className="block text-foreground/60 font-bold text-base md:text-lg mb-0.5 md:mb-1">02</span>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight font-display">อารมณ์</h3>
            </div>
          </button>

          {/* Category 3: Q&A */}
          <button 
            onClick={() => handleCategoryClick("qa")}
            className="group relative bg-orange-300 border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '200ms', animationDuration: '500ms', animationFillMode: 'both' }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 transition-transform group-hover:scale-110">
              <img src={qaImg} alt="คำถาม-คำตอบ" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="mt-4 md:mt-0">
              <span className="block text-foreground/80 font-bold text-base md:text-lg mb-0.5 md:mb-1">03</span>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight font-display">คำถาม-คำตอบ</h3>
            </div>
          </button>

          {/* Category 4: Illness */}
          <button 
            onClick={() => handleCategoryClick("illness")}
            className="group relative bg-emerald-400 border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '300ms', animationDuration: '500ms', animationFillMode: 'both' }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 transition-transform group-hover:scale-110">
              <img src={illnessImg} alt="อาการเจ็บป่วย" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="mt-4 md:mt-0">
              <span className="block text-white/80 font-bold text-base md:text-lg mb-0.5 md:mb-1">04</span>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight font-display">อาการเจ็บป่วย</h3>
            </div>
          </button>
        </div>        
      </section>

      {/* Powered by */}
      <div
        className="w-full mt-auto pt-10 mb-6 flex flex-col md:flex-row items-center justify-center gap-2 text-xs text-sq-black/70 font-medium"
      >
        <span>Powered by</span>
        <div className="flex items-center gap-2">
          <img src="/ONLYBU_LOGO.webp" alt="BU Logo" className="h-6 md:h-7 object-contain" />
          <a href="https://www.bu.ac.th/th/engineering/ai-engineering-datascience" target="_blank" rel="noopener noreferrer" className="hover:underline">
            School of Engineering · Bangkok University
          </a>
        </div>
      </div>
    </div>
  );
}