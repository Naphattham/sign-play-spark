import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioCtx = createContext<AudioContextType>({
  isMuted: false,
  toggleMute: () => {},
});

export function useAudio() {
  return useContext(AudioCtx);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/sounds/soundbackground.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = false;
    audioRef.current = audio;

    // Attempt autoplay; retry on first user interaction if blocked
    const tryPlay = () => {
      audio.play().catch(() => {
        const resume = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", resume);
          document.removeEventListener("keydown", resume);
        };
        document.addEventListener("click", resume);
        document.addEventListener("keydown", resume);
      });
    };

    tryPlay();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <AudioCtx.Provider value={{ isMuted, toggleMute }}>
      {children}
    </AudioCtx.Provider>
  );
}
