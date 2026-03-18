export function GameSetupPage() {
  return (
    <main className="flex-1 overflow-y-auto p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="mb-8">
          <h1 className="text-6xl font-black uppercase tracking-tighter">Play Game</h1>
          <div className="h-3 w-32 bg-primary mt-2"></div>
        </div>
        
        {/* Suggested Game Hero Section */}
        <section className="w-full">
          <div className="neo-brutalism bg-[#ffea00] rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[250px]">
            <div className="p-6 lg:p-8 flex-1 flex flex-col justify-center gap-4">
              <div className="inline-block bg-black text-white px-3 py-1 text-xs font-black uppercase w-fit">Suggested for You</div>
              <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter leading-none">Daily Sign <br/>Challenge</h2>
              <p className="text-base lg:text-lg font-bold max-w-lg opacity-90">Test your reflexes and recall in today's specially curated practice set. Reach a streak of 10 to earn double XP!</p>
              <div className="flex gap-3">
                <button className="neo-brutalism bg-primary text-white px-6 py-3 font-black uppercase hover:translate-x-[-3px] hover:translate-y-[-3px] transition-transform active:translate-x-0 active:translate-y-0 text-sm">
                  Start Challenge
                </button>
                <button className="neo-brutalism bg-white text-black px-6 py-3 font-black uppercase hover:translate-x-[-3px] hover:translate-y-[-3px] transition-transform active:translate-x-0 active:translate-y-0 text-sm">
                  View Details
                </button>
              </div>
            </div>
            <div className="md:w-1/3 bg-primary border-l-4 border-black flex items-center justify-center p-8 relative overflow-hidden">
              <span className="material-symbols-outlined text-[8rem] text-white/40 absolute -right-6 -bottom-6 rotate-12">bolt</span>
              <span className="material-symbols-outlined text-7xl text-white relative z-10">rocket_launch</span>
            </div>
          </div>
        </section>

        {/* All Games Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tight">All Games</h3>
              <div className="h-2 w-20 bg-primary mt-1"></div>
            </div>
            <button className="font-black uppercase text-sm border-b-4 border-black pb-1">View Full Library</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Game Card 1 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#ffea00] flex items-center justify-center rounded-lg overflow-hidden relative">
                <span className="material-symbols-outlined text-6xl text-black">style</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase mb-1">Sign Flashcards</h3>
                <p className="text-xs font-medium opacity-80 line-clamp-2">Master the basics with visual memory aids and repetitive learning.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 2 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#ff79c6] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">extension</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase mb-1">Memory Match</h3>
                <p className="text-xs font-medium opacity-80 line-clamp-2">Pair signs with their correct meanings. Fast-paced recall training.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 3 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#50fa7b] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">spellcheck</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase mb-1">Sign Scramble</h3>
                <p className="text-xs font-medium opacity-80 line-clamp-2">Unscramble letters to match the signing shown in the video clips.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 4 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#bd93f9] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">timer</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase mb-1">Speed Signer</h3>
                <p className="text-xs font-medium opacity-80 line-clamp-2">Timed challenge for experts. How many signs can you get in 60s?</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

