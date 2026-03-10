import { useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface VideoCardProps {
  phrase: string;
}

export function VideoCard({ phrase }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Simulate video progress
      let p = progress;
      const interval = setInterval(() => {
        p += 2;
        if (p >= 100) {
          p = 100;
          setIsPlaying(false);
          clearInterval(interval);
        }
        setProgress(p);
      }, 100);
    } else {
      setIsPlaying(false);
    }
  };

  const reset = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="brutal-card-lg overflow-hidden h-full flex flex-col">
      <div className="bg-secondary border-b-[3px] border-foreground px-4 py-2">
        <h3 className="font-display text-lg text-secondary-foreground">📹 Tutorial Video</h3>
      </div>

      <div className="flex-1 bg-muted flex items-center justify-center min-h-[240px] relative">
        <div className="text-center p-6">
          <p className="font-display text-3xl text-foreground mb-2">{phrase}</p>
          <p className="text-muted-foreground font-body text-sm">
            {isPlaying ? "Watch and follow along..." : "Press play to learn this sign"}
          </p>
          {isPlaying && (
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-16 border-[3px] border-primary rounded-full flex items-center justify-center animate-bounce-in">
                <Hand className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted border-t-[2px] border-foreground">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-2 p-3 bg-card">
        <button
          onClick={togglePlay}
          className="brutal-btn-primary flex items-center gap-2 text-sm flex-1 justify-center"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={reset} className="brutal-btn-secondary p-2">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

function Hand(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
    </svg>
  );
}
