import { Category, categories, getPhrasesByCategory } from "@/lib/categories";

import generalImg from "@/asset/image/general.png";
import emotionalImg from "@/asset/image/emotional.png";
import qaImg from "@/asset/image/qa.png";
import illnessImg from "@/asset/image/illness.png";

export interface LessonsPageProps {
  onCategorySelect: (category: Category) => void;
  completedPhrases: Set<string>;
  streak: number;
}

export function LessonsPage({ onCategorySelect, completedPhrases, streak }: LessonsPageProps) {
  // calculate total progress
  const allPhrases = categories.flatMap(c => getPhrasesByCategory(c.id));
  const totalAll = allPhrases.length;
  const completedAll = allPhrases.filter(p => completedPhrases.has(p.id)).length;
  const totalProgressPercent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return (
    <div className="flex-1 bg-background h-full rounded-xl flex flex-col overflow-hidden">
      <section className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col max-w-6xl mx-auto w-full h-full">
        <div className="mb-4 text-center md:text-left shrink-0">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-1 md:mb-2 font-display">เริ่มเรียนรู้กันเลย!</h2>
          <p className="text-base md:text-lg text-muted-foreground font-medium font-body">เลือกหัวข้อที่คุณต้องการฝึกฝนภาษามือวันนี้</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 font-body flex-1 min-h-0 pb-2">
          {/* Category 1: General Conversation */}
          <button 
            onClick={() => onCategorySelect("general")}
            className="group relative bg-primary border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
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
            onClick={() => onCategorySelect("emotions")}
            className="group relative bg-secondary border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
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
            onClick={() => onCategorySelect("qa")}
            className="group relative bg-orange-300 border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
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
            onClick={() => onCategorySelect("illness")}
            className="group relative bg-emerald-400 border-[3px] border-foreground rounded-[1.5rem] md:rounded-[2rem] p-6 lg:p-8 text-left flex flex-col justify-between h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all"
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
    </div>
  );
}
