import { Category } from "@/lib/categories";

interface HomePageProps {
  onCategorySelect: (category: Category) => void;
  onLeaderboard: () => void;
}

export function HomePage({ onCategorySelect, onLeaderboard }: HomePageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Hero Section */}
          <section className="brutal-card bg-accent p-8 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="relative z-10 text-center md:text-left flex-1">
              <span className="bg-foreground text-background px-3 py-1 rounded font-black text-xs uppercase tracking-widest">
                Master Signer • LVL 12
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-foreground mt-4 leading-none uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                Welcome Back,<br />Questor!
              </h2>
              <div className="flex items-center gap-3 mt-6 justify-center md:justify-start">
                <div className="bg-background border-2 border-foreground px-4 py-2 rounded-lg font-black flex items-center gap-2 shadow-brutal-sm">
                  <span className="text-2xl">🔥</span>
                  <span className="text-foreground">15 DAY STREAK!</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <button 
                onClick={() => onCategorySelect("general")}
                className="brutal-btn-primary px-8 py-4 rounded-xl font-black text-xl uppercase tracking-tighter"
              >
                Keep Learning
              </button>
            </div>
            {/* Abstract patterns in background */}
            <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
              <span className="text-[200px]">👋</span>
            </div>
          </section>

          {/* Continue Learning */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Current Quest</h3>
              <button 
                onClick={() => onCategorySelect("general")}
                className="text-sm font-bold underline decoration-primary decoration-2 underline-offset-4"
              >
                View All
              </button>
            </div>
            <div className="brutal-card bg-card p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 aspect-video md:aspect-square bg-muted rounded-lg border-2 border-foreground overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Hands performing a simple sign language gesture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdb16QwH9mPMaBXu21yghKM9TWbB47x2emb0lRYvIGt1ZznuzBhCP809EYXzkxeyq1twe_ibka8Ic9nxS0d2adbr8djMFg09t9iM3CgeLMZxRuIY9M5PV7iMROGTID2Am1PpRfy0_SGVeHmliLK1FrHicqv1z_4kLF-JVGQ2O5SfC9pBP5QTVZqCJj5c19-T6HDrP9AW7YXosJXl-UrAPVDyfgWi2pZz4Cry9PpU9B8LwJOf9PEU0Ug-6HTxTaNX1OVWMVom6zYTo"
                />
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-primary font-black text-xs uppercase tracking-widest mb-1">
                      Lesson Category
                    </p>
                    <h4 className="text-2xl font-black uppercase">General Phrases</h4>
                  </div>
                  <span className="font-black text-xl">
                    2/7 <span className="text-sm text-muted-foreground font-bold uppercase italic">Signs</span>
                  </span>
                </div>
                <div className="w-full h-6 bg-muted border-2 border-foreground rounded-full overflow-hidden">
                  <div className="h-full bg-primary border-r-2 border-foreground" style={{ width: "28%" }}></div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => onCategorySelect("general")}
                    className="brutal-btn-primary px-6 py-2 rounded-lg font-black uppercase text-sm"
                  >
                    Resume Lesson
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Top Challengers */}
          <section className="brutal-card bg-card p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🏆</span>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Top Challengers</h3>
            </div>
            <div className="space-y-4">
              {/* Rank 1 */}
              <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border-2 border-dashed border-foreground">
                <span className="text-lg font-black italic w-6">1</span>
                <div className="size-10 rounded-full border-2 border-foreground overflow-hidden flex-shrink-0">
                  <img
                    alt="Sarah"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvc2YrVtMBv34jg0aHdC-YCeLmqoiTCT9WdwyM3Ictul2eJY0jTYxTwQaylL51zhkVMiNoveqEI73LNnGH1xP61osoLypElYlcbzzVEnrXClRaLYl1hJTpex7iDWng612DiGp_7SE7rVuNxZrvQkhnbfVPt8Sjh2pgW3aWjOi8j4zm5yibCjFGfI66yJW9ouTeyhAFFowNNhsjgI1kxp8pB48VUQlLdkiWlVgbqucG54fkntoPvAfBWCzuNIZ7CRge1ZZc_fi5tx0"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase text-sm leading-none">Sarah Legend</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">14,200 Pts</p>
                </div>
                <span className="text-accent text-2xl">🏅</span>
              </div>

              {/* Rank 2 */}
              <div className="flex items-center gap-3 p-2">
                <span className="text-lg font-black italic w-6">2</span>
                <div className="size-10 rounded-full border-2 border-foreground overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    alt="Mark"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwZNIEgMTBOUtFnFv_l6UDsTyKbzyAGoPxxZSPRLQxsAnfiWBVwhJdvLPzFWquVnd6cv7NaCHHe8sNZARmzqNxsVFkg5iKzqHmtiMKr33eJgsMGzSW3qPipdYDSlmghVvg76doVvWfkWGWBwhRHJIKqV4C7QE79mja8oPxvhs9ttTOTauC0BtDozlJ7-Eh9hHvn3F8Az6B4Af0GrJHL1M_yLKKbnHOPwXqxD8f3Kn2gJaDqCGsCe9IQYFN2CJRXa2zEv6Xi8ZCkzg"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase text-sm leading-none">Marky Mark</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">12,850 Pts</p>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex items-center gap-3 p-2">
                <span className="text-lg font-black italic w-6">3</span>
                <div className="size-10 rounded-full border-2 border-foreground overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    alt="Jenna"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxd-cDT6PH97FOG1eK9q2pAzZpsqgQQSPKFXX67xbLlOdJysb-DJffX1RCAOGT2DLq24Jji1Qc_3jD_jMf3P3b8B6H-VhH3nF9KTXqNO38Wq9iciRiFvCaSjrwcdusHAcOz15fPqLMfovYcDDsZ5fkzJRO8qEC0zK9YEK1v1JBQF1wqmjK66BCtxMxVibChu1K0C5Rd2GhDPNfG52X_hkSjlgkiUoYCvWlaCYAyiBa7E8zvfprD56WoxG17NbS4VF2Py24GJydfas"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase text-sm leading-none">Jenna Sign</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">11,400 Pts</p>
                </div>
              </div>
            </div>
            <button 
              onClick={onLeaderboard}
              className="w-full mt-6 brutal-btn-secondary py-2 font-black uppercase text-xs tracking-widest"
            >
              View Full Board
            </button>
          </section>

          {/* Daily Goals */}
          <section className="brutal-card bg-foreground text-background p-6 rounded-xl">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-accent">
              Daily Goals
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-6 border-2 border-background rounded-md flex items-center justify-center bg-primary mt-1">
                  <span className="text-sm font-black text-background">✓</span>
                </div>
                <div>
                  <p className="font-bold text-sm uppercase">Learn 5 new signs</p>
                  <div className="w-32 h-2 bg-background/20 rounded-full mt-2 border border-background/30">
                    <div className="w-full h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 border-2 border-background rounded-md flex items-center justify-center bg-background/20 mt-1"></div>
                <div>
                  <p className="font-bold text-sm uppercase">Practice for 15 mins</p>
                  <div className="w-32 h-2 bg-background/20 rounded-full mt-2 border border-background/30">
                    <div className="w-[40%] h-full bg-accent rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Nav Shortcut (Visible on Small Screens) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => onCategorySelect("general")}
          className="brutal-btn-primary size-16 rounded-full flex items-center justify-center"
        >
          <span className="text-4xl font-black">▶</span>
        </button>
      </div>
    </div>
  );
}
