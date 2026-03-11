import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { Category } from "@/lib/categories";

interface VideoCardProps {
  phrase: string;
  category: Category;
}

export function VideoCard({ phrase, category }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Build video path based on category and phrase
  const getVideoUrl = () => {
    let videoFileName = phrase;
    
    // Handle phrases with multiple options (e.g., "สวัสดี (ผู้ใหญ่ | เพื่อน)")
    if (category === "general") {
      if (phrase.includes("สวัสดี") && phrase.includes("|")) {
        videoFileName = "สวัสดี (ผู้ใหญ่)";
      } else if (phrase.includes("กินแล้ว") && phrase.includes("|")) {
        videoFileName = "กินแล้ว";
      }
      // Handle other phrases with question marks
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const reset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
    }
  };

  // Handle video events and autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress || 0);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);

    // Auto-play video when loaded
    video.play().catch(() => {
      // Ignore autoplay errors (some browsers block it)
    });

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [phrase, category]);

  return (
    <div className="brutal-card-lg overflow-hidden h-full flex flex-col">
      <div className="bg-secondary border-b-[3px] border-foreground px-4 py-2">
        <h3 className="font-display text-lg text-secondary-foreground">📹 Tutorial Video</h3>
      </div>

      <div className="flex-1 bg-muted flex items-center justify-center min-h-[240px] relative overflow-hidden">
        <video
          ref={videoRef}
          src={getVideoUrl()}
          loop
          muted
          className="w-full h-full object-contain"
          playsInline
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
