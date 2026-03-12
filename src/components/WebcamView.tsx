import { useRef, useEffect } from "react";
import Webcam from "react-webcam";

interface WebcamViewProps {
  onNextLevel?: () => void;
  cameraEnabled?: boolean;
  /** Called when the underlying <video> element is available */
  onVideoReady?: (video: HTMLVideoElement) => void;
}

export function WebcamView({ onNextLevel, cameraEnabled = true, onVideoReady }: WebcamViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const reportedRef = useRef(false);

  // Report the video element once it's ready
  useEffect(() => {
    if (!cameraEnabled || !onVideoReady) return;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && !reportedRef.current) {
        reportedRef.current = true;
        onVideoReady(video);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [cameraEnabled, onVideoReady]);

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
