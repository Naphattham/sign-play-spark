export function GameSetupPage() {
  return (
    <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-12">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter">Challenge</h1>
          <div className="h-2 sm:h-3 w-20 sm:w-28 md:w-32 bg-primary mt-1 sm:mt-2"></div>
        </div>
        
        <section className="space-y-6">        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {/* Game Card 1 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 md:gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#ffea00] flex items-center justify-center rounded-lg overflow-hidden relative">
                <span className="material-symbols-outlined text-6xl text-black">style</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black uppercase mb-0.5 sm:mb-1">Sign Flashcards</h3>
                <p className="text-[10px] sm:text-xs font-medium opacity-80 line-clamp-2">Master the basics with visual memory aids and repetitive learning.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 2 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 md:gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#ff79c6] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">extension</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black uppercase mb-0.5 sm:mb-1">Memory Match</h3>
                <p className="text-[10px] sm:text-xs font-medium opacity-80 line-clamp-2">Pair signs with their correct meanings. Fast-paced recall training.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 3 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 md:gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#50fa7b] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">spellcheck</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black uppercase mb-0.5 sm:mb-1">Sign Scramble</h3>
                <p className="text-[10px] sm:text-xs font-medium opacity-80 line-clamp-2">Unscramble letters to match the signing shown in the video clips.</p>
              </div>
              <button className="neo-brutalism bg-primary text-white py-2 text-sm font-black uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                Play Now
              </button>
            </div>
            
            {/* Game Card 4 */}
            <div className="neo-brutalism bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 md:gap-4 group">
              <div className="aspect-square w-full neo-brutalism-sm bg-[#bd93f9] flex items-center justify-center rounded-lg overflow-hidden">
                <span className="material-symbols-outlined text-6xl text-black">timer</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black uppercase mb-0.5 sm:mb-1">Speed Signer</h3>
                <p className="text-[10px] sm:text-xs font-medium opacity-80 line-clamp-2">Timed challenge for experts. How many signs can you get in 60s?</p>
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

