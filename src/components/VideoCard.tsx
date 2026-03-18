import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { Category } from "@/lib/categories";

interface VideoCardProps {
  phrase: string;
  category: Category;
  variant?: "adult" | "friend";
}

export function VideoCard({ phrase, category, variant }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Build video path based on category and phrase
  const getVideoUrl = () => {
    let videoFileName = phrase;

    // Handle phrases with multiple options (e.g., "สวัสดี (ผู้ใหญ่ | เพื่อน)")
    if (category === "general") {
      if (phrase.includes("สวัสดี") && phrase.includes("|")) {
        // Use variant to determine which video to show
        if (variant === "friend") {
          videoFileName = "สวัสดี (เพื่อน)";
        } else {
          videoFileName = "สวัสดี (ผู้ใหญ่)";
        }
      } else if (phrase.includes("กินแล้ว") && phrase.includes("|")) {
        videoFileName = "กินแล้ว";
      }
      // Handle other phrases with question marks
      if (phrase === "กินข้าวแล้วหรือยัง?" || phrase === "กินข้าวหรือยัง?") {
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
  }, [phrase, category, variant]);

  return (
    <video
      ref={videoRef}
      src={getVideoUrl()}
      loop
      muted
      className="w-full h-full object-cover"
      playsInline
    />
  );
}
