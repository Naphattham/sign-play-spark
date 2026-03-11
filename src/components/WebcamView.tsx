import { useRef } from "react";
import Webcam from "react-webcam";
import { Zap, Star, ArrowRight } from "lucide-react";

interface WebcamViewProps {
  onNextLevel?: () => void;
  cameraEnabled?: boolean;
}

export function WebcamView({ onNextLevel, cameraEnabled = true }: WebcamViewProps) {
  const webcamRef = useRef<Webcam>(null);

  return (
    <div className="hud-frame h-full flex flex-col bg-foreground/95">
      {/* HUD Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b-[3px] border-foreground">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-secondary-foreground" />
          <span className="font-display text-sm text-secondary-foreground">LIVE CAM</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className="font-display text-xs text-secondary-foreground">+10 pts</span>
        </div>
      </div>

      {/* Webcam area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-2">
        <div className="relative w-full aspect-square max-w-full">
          {cameraEnabled && (
            <Webcam
              ref={webcamRef}
              audio={false}
              className="w-full h-full object-cover"
              mirrored
              videoConstraints={{ 
                facingMode: "user",
                aspectRatio: 1
              }}
            />
          )}

          {/* HUD corners */}
          <div className="hud-corner top-2 left-2 border-t-[3px] border-l-[3px]" />
          <div className="hud-corner top-2 right-2 border-t-[3px] border-r-[3px]" />
          <div className="hud-corner bottom-2 left-2 border-b-[3px] border-l-[3px]" />
          <div className="hud-corner bottom-2 right-2 border-b-[3px] border-r-[3px]" />
        </div>
      </div>

      {/* Controls */}
      {cameraEnabled && onNextLevel && (
        <div className="p-3 border-t-[3px] border-foreground bg-card">
          <button
            onClick={onNextLevel}
            className="w-full flex items-center justify-center gap-2 text-sm font-body brutal-btn-accent"
          >
            <ArrowRight size={16} />
            Next Level
          </button>
        </div>
      )}
    </div>
  );
}
