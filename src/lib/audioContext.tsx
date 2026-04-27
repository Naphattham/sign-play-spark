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
    audio.volume = 0.2;
    audio.muted = false;
    audioRef.current = audio;

    // Attempt autoplay; retry on first user interaction if blocked
    const tryPlay = () => {
      audio.play().catch(() => {
        const resume = () => {
          if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  ["click", "touchstart", "keydown", "mousedown"].forEach((evt) =>
                    document.removeEventListener(evt, resume, true)
                  );
                })
                .catch(() => {
                  // If it still fails, keep listeners active
                });
            }
          }
        };
        ["click", "touchstart", "keydown", "mousedown"].forEach((evt) =>
          document.addEventListener(evt, resume, true)
        );
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
      // Also attempt to play if unmuted but currently paused and tab is active
      if (!isMuted && audioRef.current.paused && !document.hidden) {
        audioRef.current.play().catch(() => {});
      }
    }

    const handleVisibilityChange = () => {
      if (!audioRef.current) return;
      
      if (document.hidden) {
        audioRef.current.pause();
      } else {
        if (!isMuted) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMuted]);

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <AudioCtx.Provider value={{ isMuted, toggleMute }}>
      {children}
    </AudioCtx.Provider>
  );
}
