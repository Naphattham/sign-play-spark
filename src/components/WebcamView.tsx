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
    <>
      {cameraEnabled && (
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform'
          }}
          mirrored
          videoConstraints={{ 
            facingMode: "user",
            aspectRatio: 1,
            width: { ideal: 1280 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30, max: 60 }
          }}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.95}
        />
      )}
    </>
  );
}
