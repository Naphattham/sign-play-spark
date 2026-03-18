import { useEffect, useRef, useCallback, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export type DistanceStatus = "no_face" | "too_close" | "good";

interface UseDistanceDetectionOptions {
  /** Whether detection is currently active */
  enabled: boolean;
  /** The video element to analyze */
  videoElement: HTMLVideoElement | null;
  /** Face width ratio threshold (face width / video width). Above this = too close. Default 0.45 */
  tooCloseThreshold?: number;
  /** Callback when distance status changes */
  onStatusChange?: (status: DistanceStatus) => void;
}

export function useDistanceDetection({
  enabled,
  videoElement,
  tooCloseThreshold = 0.45,
  onStatusChange,
}: UseDistanceDetectionOptions) {
  const [status, setStatus] = useState<DistanceStatus>("no_face");
  const detectorRef = useRef<FaceDetector | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastStatusRef = useRef<DistanceStatus>("no_face");
  
  // 🚨 เพิ่มตัวแปรนับจำนวนเฟรมที่หาหน้าไม่เจอ เพื่อป้องกันอาการสแกนเนอร์กระพริบ
  const noFaceFramesRef = useRef<number>(0);

  // Initialize face detector
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (cancelled) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
        if (cancelled) return;

        detectorRef.current = detector;
      } catch (err) {
        console.error("Failed to initialize face detector:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
    };
  }, []);

  // Run detection loop
  const detect = useCallback(() => {
    if (!enabled || !videoElement || !detectorRef.current) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Video must be playing and have dimensions
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const result = detectorRef.current.detectForVideo(
        videoElement,
        performance.now()
      );

      let newStatus: DistanceStatus;

      // 🚨 ตรวจสอบการหลุดโฟกัสแบบให้โอกาส (Grace period)
      if (!result.detections || result.detections.length === 0) {
        noFaceFramesRef.current++;
        // ถ้าหน้าหายไปเกิน 10 เฟรมติดกัน ค่อยบอกว่าหาไม่เจอจริงๆ
        if (noFaceFramesRef.current > 10) {
          newStatus = "no_face";
        } else {
          // ถ้าแค่กระพริบหลุด ให้ใช้ค่าสถานะเดิมไปก่อน
          newStatus = lastStatusRef.current; 
        }
      } else {
        noFaceFramesRef.current = 0; // เจอหน้าแล้ว รีเซ็ตตัวนับ

        // Get the largest face detected
        const detection = result.detections.reduce((largest, det) => {
          const w = det.boundingBox?.width ?? 0;
          return w > (largest.boundingBox?.width ?? 0) ? det : largest;
        }, result.detections[0]);

        const faceWidth = detection.boundingBox?.width ?? 0;
        const videoWidth = videoElement.videoWidth;
        const ratio = faceWidth / videoWidth;

        newStatus = ratio > tooCloseThreshold ? "too_close" : "good";
      }

      if (newStatus !== lastStatusRef.current) {
        lastStatusRef.current = newStatus;
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch {
      // Detection might fail during transitions; just skip
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [enabled, videoElement, tooCloseThreshold, onStatusChange]);

  useEffect(() => {
    if (enabled) {
      animFrameRef.current = requestAnimationFrame(detect);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [enabled, detect]);

  return status;
}