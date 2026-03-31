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
  const isReadyRef = useRef(false); // รวม flag ของ video และ canvas ไว้ด้วยกัน

  useEffect(() => {
    if (!cameraEnabled) return;

    // รีเซ็ตสถานะเมื่อกล้องถูกเปิดใหม่
    isReadyRef.current = false;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      // ใช้ readyState >= 3 (HAVE_FUTURE_DATA) หรือ 4 (HAVE_ENOUGH_DATA)
      // เพื่อให้แน่ใจว่าวิดีโอโหลดข้อมูลเฟรมแรกและ "ขนาด" (videoWidth/videoHeight) มาแล้วจริงๆ
      if (video && video.readyState >= 3 && !isReadyRef.current) {

        // [แก้ปัญหา Safari]: กระตุ้นให้เล่นอีกครั้งเผื่อเบราว์เซอร์บล็อก
        video.play().catch(e => console.warn("Video play interrupted:", e));

        // [แก้ปัญหา ML Canvas]: ต้องตั้งค่า Resolution ภายในของ Canvas ให้ตรงกับ Video 
        // ไม่ใช่แค่กำหนด CSS width/height (w-full h-full)
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        isReadyRef.current = true;

        // ส่ง callback หลังจากมั่นใจว่าทุกอย่างพร้อมและมีขนาดที่ถูกต้อง
        if (onCanvasReady && canvas) onCanvasReady(canvas);
        if (onVideoReady) onVideoReady(video);

        // เคลียร์ interval ทิ้งเมื่อโหลดสำเร็จ
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [cameraEnabled, onVideoReady, onCanvasReady]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {cameraEnabled && (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            muted={true}        // บังคับ Muted เพื่อให้ Safari ยอม Autoplay
            playsInline={true}  // สำคัญมากสำหรับ iOS Safari ไม่งั้นจะเด้งเต็มจอหรือหยุดทำงาน
            className="w-full h-full object-cover absolute inset-0"
            style={{
              transform: 'scaleX(-1) translateZ(0)', // รวม transform ไว้ด้วยกัน
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              willChange: 'transform'
            }}
            mirrored={false} // ปิด mirrored ของ react-webcam แล้วใช้ CSS หมุนเอาเองจะควบคุม Canvas ง่ายกว่า
            videoConstraints={{
              facingMode: "user",
              aspectRatio: 1,
              // แนะนำให้ลด ideal เป็น 640 หรือ 720p สำหรับโมเดล ML 
              // 1280 อาจทำให้ Safari บนมือถือกระตุกหรือหยุดทำงานเพราะกินแรมเกินไป
              width: { ideal: 640 },
              height: { ideal: 640 },
              frameRate: { ideal: 30, max: 60 }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none object-cover"
            style={{
              transform: 'scaleX(-1)', // หมุน Canvas ให้ตรงกับ Video
            }}
          />
        </>
      )}
    </div>
  );
}