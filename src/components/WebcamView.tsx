import { useRef, useEffect } from "react";
import Webcam from "react-webcam";

// 1. Ensure cameraEnabled is defined in the props interface
interface WebcamViewProps {
  onNextLevel?: () => void;
  cameraEnabled?: boolean; // <-- It must be here
  onVideoReady?: (video: HTMLVideoElement) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// 2. Ensure it is destructured in the function arguments
export function WebcamView({
  onNextLevel,
  cameraEnabled = true, // <-- And here (with a default value)
  onVideoReady,
  onCanvasReady,
}: WebcamViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    // 3. Now you can safely use it
    if (!cameraEnabled) return;

    isReadyRef.current = false;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 3 && !isReadyRef.current) {
        video.play().catch((e) => console.warn("Video play interrupted:", e));

        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        isReadyRef.current = true;

        if (onCanvasReady && canvas) onCanvasReady(canvas);
        if (onVideoReady) onVideoReady(video);

        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [cameraEnabled, onVideoReady, onCanvasReady]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 4. And use it in the JSX */}
      {cameraEnabled && (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            muted={true}
            playsInline={true}
            className="w-full h-full object-cover absolute inset-0"
            style={{
              transform: "scaleX(-1) translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              willChange: "transform",
            }}
            mirrored={false}
            videoConstraints={{
              facingMode: "user"
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none object-cover"
            style={{
              transform: "scaleX(-1)",
            }}
          />
        </>
      )}
    </div>
  );
}