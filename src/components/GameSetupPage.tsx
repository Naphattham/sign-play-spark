import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LoadingScreen } from "@/components/LoadingScreen";

export type Difficulty = "easy" | "medium" | "hard";

interface GameSetupPageProps {
  onStartGame?: (difficulty: Difficulty) => void;
}

export function GameSetupPage({ onStartGame }: GameSetupPageProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("กำลังโหลด...");
  const navigate = useNavigate();
  const { leaderboardData } = useLeaderboard();
  const topThree = leaderboardData.slice(0, 3);

  // Show loading animation when entering the page
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = async () => {
    setLoadingMessage("กำลังเริ่มเกม...");
    setIsLoading(true);
    
    // Show loading animation for 2.5 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    if (onStartGame) {
      onStartGame(difficulty);
    }
    // Navigate to game with difficulty state
    navigate("/", { state: { startGame: true, difficulty } });
  };

  const handleBackToHome = async () => {
    setLoadingMessage("กำลังกลับหน้าหลัก...");
    setIsLoading(true);
    
    // Show loading animation for 2.5 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    navigate("/");
  };

  if (isLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className="min-h-screen bg-sq-cream flex flex-col py-10">
      <div className="px-4 mb-8">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 bg-sq-yellow bold-border px-6 py-3 rounded-xl comic-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95 transition-all font-bold"
        >
          <ArrowLeft size={20} />
          <span className="font-black uppercase text-sm font-body">Back to Home</span>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4">
        {/* Mascot Section */}
        <div className="relative mb-8">
          <div className="w-48 h-48 md:w-64 md:h-64 bg-sq-pink bold-border rounded-full flex items-center justify-center comic-shadow overflow-hidden">
            <img 
              alt="Playful cartoon mascot character with goggles" 
              className="w-4/5 h-4/5 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAco_XHyH79xcKW_q-GVXU9f82MZSK36uzGKp7idCisiuhvHM8eRTQtERw7v-TPImgWM1WS82ckYYjDKnSwpFk_IIkO-ZGCnOqi9Xj2Dr-TH0iXcNmM-TcL6WvzcaA4xEn7z6OmpHfKAjeNgAPh8SbbFddoX4YAtICC3sKV-V8usPICqcXuhhi0t1hnkUgyAprtasjMnzPVJjcWDmKbb9KJySVdbp5j2P_Mm4D1E-Kx8ex01nqc3DaeJwMfckyu0K8OZEUoC75umM"
            />
          </div>
          <div className="absolute -top-4 -right-4 bg-sq-yellow bold-border px-4 py-2 rounded-lg comic-shadow-sm rotate-12">
            <p className="font-black text-xs uppercase font-body">Let's Go!</p>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-10">
          <h2 
            className="text-5xl md:text-7xl font-black uppercase italic text-slate-900 dark:text-white mb-2 font-display"
            style={{ WebkitTextStroke: "2px black" }}
          >
            New Quest
          </h2>
          <p className="text-lg font-bold opacity-70 font-body">Master the signs, unlock the world.</p>
        </div>

        {/* Difficulty Selection */}
        <div className="w-full max-w-md mb-12">
          <p className="text-center font-black uppercase text-sm mb-4 tracking-widest font-body">Select Difficulty</p>
          <div className="grid grid-cols-3 gap-4">
            <label className="cursor-pointer group">
              <input 
                checked={difficulty === "easy"}
                className="peer hidden" 
                name="difficulty" 
                type="radio" 
                value="easy"
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              />
              <div className="bg-white dark:bg-slate-800 bold-border p-4 text-center rounded-xl comic-shadow-sm peer-checked:bg-green-400 peer-checked:translate-y-1 peer-checked:shadow-none transition-all group-hover:-translate-y-1">
                <span className="block font-black uppercase text-sm font-body">Easy</span>
              </div>
            </label>
            <label className="cursor-pointer group">
              <input 
                checked={difficulty === "medium"}
                className="peer hidden" 
                name="difficulty" 
                type="radio" 
                value="medium"
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              />
              <div className="bg-white dark:bg-slate-800 bold-border p-4 text-center rounded-xl comic-shadow-sm peer-checked:bg-sq-yellow peer-checked:translate-y-1 peer-checked:shadow-none transition-all group-hover:-translate-y-1">
                <span className="block font-black uppercase text-sm font-body">Med</span>
              </div>
            </label>
            <label className="cursor-pointer group">
              <input 
                checked={difficulty === "hard"}
                className="peer hidden" 
                name="difficulty" 
                type="radio" 
                value="hard"
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              />
              <div className="bg-white dark:bg-slate-800 bold-border p-4 text-center rounded-xl comic-shadow-sm peer-checked:bg-red-400 peer-checked:translate-y-1 peer-checked:shadow-none transition-all group-hover:-translate-y-1">
                <span className="block font-black uppercase text-sm font-body">Hard</span>
              </div>
            </label>
          </div>
        </div>

        {/* Main Action */}
        <div className="w-full max-w-md mb-16">
          <button 
            className="w-full bg-sq-yellow bold-border py-6 rounded-2xl comic-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:scale-95 transition-all"
            onClick={handleStartGame}
          >
            <span className="text-4xl font-black uppercase italic tracking-tighter font-display">Start Game</span>
          </button>
        </div>

        {/* High Scores Component */}
        <div className="w-full max-w-lg bg-white dark:bg-slate-800 bold-border rounded-2xl comic-shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-sq-yellow fill-1">trophy</span>
            <h3 className="font-black uppercase text-xl italic font-display">Top Scores</h3>
          </div>
          <div className="space-y-4">
            {topThree.length > 0 ? (
              topThree.map((entry, index) => (
                <div key={index} className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sq-pink font-body">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-bold font-body">{entry.username}</span>
                  </div>
                  <span className="font-black text-primary font-body">
                    {entry.points.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sq-pink font-body">01</span>
                    <span className="font-bold font-body">Alex_Quest</span>
                  </div>
                  <span className="font-black text-primary font-body">12,450</span>
                </div>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sq-pink font-body">02</span>
                    <span className="font-bold font-body">Sami_Signs</span>
                  </div>
                  <span className="font-black text-primary font-body">11,200</span>
                </div>
                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sq-pink font-body">03</span>
                    <span className="font-bold font-body">Jordan_Play</span>
                  </div>
                  <span className="font-black text-primary font-body">9,800</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
