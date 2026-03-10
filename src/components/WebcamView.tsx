import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, CameraOff, Zap, Star } from "lucide-react";

export function WebcamView() {
  const webcamRef = useRef<Webcam>(null);
  const [enabled, setEnabled] = useState(false);

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
      <div className="flex-1 relative flex items-center justify-center min-h-[240px]">
        {enabled ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            className="w-full h-full object-cover"
            mirrored
            videoConstraints={{ facingMode: "user" }}
          />
        ) : (
          <div className="text-center p-6">
            <CameraOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-body text-sm">Camera is off</p>
          </div>
        )}

        {/* HUD corners */}
        <div className="hud-corner top-2 left-2 border-t-[3px] border-l-[3px]" />
        <div className="hud-corner top-2 right-2 border-t-[3px] border-r-[3px]" />
        <div className="hud-corner bottom-2 left-2 border-b-[3px] border-l-[3px]" />
        <div className="hud-corner bottom-2 right-2 border-b-[3px] border-r-[3px]" />
      </div>

      {/* Controls */}
      <div className="p-3 border-t-[3px] border-foreground bg-card">
        <button
          onClick={() => setEnabled(!enabled)}
          className={`w-full flex items-center justify-center gap-2 text-sm font-body ${
            enabled ? "brutal-btn-accent" : "brutal-btn-primary"
          }`}
        >
          {enabled ? <CameraOff size={16} /> : <Camera size={16} />}
          {enabled ? "Turn Off" : "Turn On Camera"}
        </button>
      </div>
    </div>
  );
}
