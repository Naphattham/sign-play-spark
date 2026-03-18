import { useRef, useEffect } from "react";
import Webcam from "react-webcam";

interface WebcamViewProps {
  onNextLevel?: () => void;
  cameraEnabled?: boolean;
  /** Called when the underlying <video> element is available */
  onVideoReady?: (video: HTMLVideoElement) => void;
  /** Called when the canvas element is available */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function WebcamView({ onNextLevel, cameraEnabled = true, onVideoReady, onCanvasReady }: WebcamViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reportedRef = useRef(false);
  const canvasReportedRef = useRef(false);

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

  // Report the canvas element once it's ready
  useEffect(() => {
    if (!cameraEnabled || !onCanvasReady) return;

    const canvas = canvasRef.current;
    if (canvas && !canvasReportedRef.current) {
      canvasReportedRef.current = true;
      onCanvasReady(canvas);
    }
  }, [cameraEnabled, onCanvasReady]);

  return (
    <div className="relative w-full h-full">
      {cameraEnabled && (
        <>
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
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
              transform: 'scaleX(-1)', // Mirror canvas like video
            }}
          />
        </>
      )}
    </div>
  );
}
