import { useState, useEffect, useRef, useCallback } from 'react';
import { predictSign, PredictionResponse } from '@/lib/signLanguageAPI';
import { Phrase, checkPhraseMatch } from '@/lib/categories';

// ----------------------------------------------------------------------
// 🔑 Module-level Holistic Singleton
// สร้าง Holistic instance เพียงครั้งเดียวต่อ session ไม่ว่า hook จะ
// mount/unmount กี่ครั้งก็ตาม → pose_landmark_lite.tflite โหลดแค่ครั้งเดียว
// ----------------------------------------------------------------------
type ResultsCallback = (results: any) => void;

let _holisticInstance: any = null;
let _holisticPromise: Promise<any> | null = null;
let _activeResultsCallback: ResultsCallback | null = null;

function getOrCreateHolistic(): Promise<any> {
  if (_holisticPromise) return _holisticPromise;

  _holisticPromise = new Promise((resolve, reject) => {
    const mpHolistic = (window as any);
    const HolisticConstructor = mpHolistic.Holistic;

    if (!HolisticConstructor) {
      console.error('[Holistic Singleton] MediaPipe Holistic Constructor not found!');
      reject(new Error('HolisticConstructor not available'));
      return;
    }

    console.log('[Holistic Singleton] 🚀 Creating Holistic instance (once per session)...');
    const holistic = new HolisticConstructor({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Route results to whichever hook is currently active
    holistic.onResults((res: any) => {
      if (_activeResultsCallback) _activeResultsCallback(res);
    });

    _holisticInstance = holistic;
    console.log('[Holistic Singleton] ✅ Holistic instance ready.');
    resolve(holistic);
  });

  return _holisticPromise;
}

const SEQUENCE_LENGTH = 40;
const PREDICTION_INTERVAL = 2; // Predict every 2 frames

// Face keypoints to extract (eyebrows and mouth)
const EYEBROW_IDX = [55, 65, 52, 53, 46, 285, 295, 282, 283, 276];
const MOUTH_IDX = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324];
const FACE_SELECTED = [...EYEBROW_IDX, ...MOUTH_IDX];

const POSE_POINTS = 25;
const HAND_POINTS = 21;
const FACE_POINTS = FACE_SELECTED.length; // 30

export type DistanceStatus = "no_face" | "too_close" | "too_far" | "good";

export interface UseSignAndDistanceProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  enabled: boolean;
  targetPhrase?: Phrase;
  variant?: "adult" | "friend";
  // 🚨 ปรับลดค่า Threshold ลงให้ใจดีขึ้น (0.02 = คนอยู่ไกลก็ยังอนุโลมให้ผ่าน)
  distanceThreshold?: number;
  tooCloseThreshold?: number;
  onPhraseMatch?: (prediction: string, confidence: number) => void;
  onPrediction?: (prediction: PredictionResponse) => void;
  onDistanceChange?: (status: DistanceStatus) => void;
}

export interface SignAndDistanceState {
  isProcessing: boolean;
  bufferLength: number;
  currentPrediction: string | null;
  currentConfidence: number;
  top3Predictions: Array<{ class: string; confidence: number }>;
  isMatched: boolean;
  error: string | null;
  isTooFar: boolean;
  isTooClose: boolean;
  distanceStatus: DistanceStatus;
}

/** What the hook actually returns: state + stable actions */
export interface UseSignAndDistanceReturn extends SignAndDistanceState {
  /** Immediately wipes the keypoint buffer so stale gesture data is discarded. */
  clearBuffer: () => void;
}

export function useSignAndDistance({
  videoElement,
  canvasElement,
  enabled,
  targetPhrase,
  variant,
  distanceThreshold = 0.01, // <--- ปรับให้ใจดีขึ้นมาก
  tooCloseThreshold = 0.30, // <--- ปรับให้เข้าใกล้กล้องได้มากขึ้น
  onPhraseMatch,
  onPrediction,
  onDistanceChange
}: UseSignAndDistanceProps): UseSignAndDistanceReturn {
  const [state, setState] = useState<SignAndDistanceState>({
    isProcessing: false,
    bufferLength: 0,
    currentPrediction: null,
    currentConfidence: 0,
    top3Predictions: [],
    isMatched: false,
    error: null,
    isTooFar: false, // <--- เริ่มต้นด้วย false จะได้ไม่แอบบล็อก API
    isTooClose: false,
    distanceStatus: "no_face",
  });

  const holisticRef = useRef<any>(null);
  const keypointsBufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number | null>(null);

  const distanceStatusRef = useRef<DistanceStatus>("no_face");
  const isSendingRef = useRef(false);
  const isPredictingRef = useRef(false);

  // Keep track of the latest DOM elements without triggering re-runs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    videoRef.current = videoElement;
    canvasRef.current = canvasElement;
  }, [videoElement, canvasElement]);

  // 1. Extract Keypoints into a flat normalized array
  const extractKeypoints = useCallback((results: any): number[] => {
    const keypoints: number[] = [];

    if (results.poseLandmarks) {
      for (let i = 0; i < POSE_POINTS; i++) {
        const lm = results.poseLandmarks[i];
        if (lm) keypoints.push(lm.x, lm.y, lm.z, lm.visibility || 0);
        else keypoints.push(0, 0, 0, 0);
      }
    } else {
      keypoints.push(...Array(POSE_POINTS * 4).fill(0));
    }

    if (results.faceLandmarks) {
      for (const idx of FACE_SELECTED) {
        const lm = results.faceLandmarks[idx];
        if (lm) keypoints.push(lm.x, lm.y, lm.z);
        else keypoints.push(0, 0, 0);
      }
    } else {
      keypoints.push(...Array(FACE_POINTS * 3).fill(0));
    }

    if (results.leftHandLandmarks) {
      for (let i = 0; i < HAND_POINTS; i++) {
        const lm = results.leftHandLandmarks[i];
        if (lm) keypoints.push(lm.x, lm.y, lm.z);
        else keypoints.push(0, 0, 0);
      }
    } else {
      keypoints.push(...Array(HAND_POINTS * 3).fill(0));
    }

    if (results.rightHandLandmarks) {
      for (let i = 0; i < HAND_POINTS; i++) {
        const lm = results.rightHandLandmarks[i];
        if (lm) keypoints.push(lm.x, lm.y, lm.z);
        else keypoints.push(0, 0, 0);
      }
    } else {
      keypoints.push(...Array(HAND_POINTS * 3).fill(0));
    }

    return keypoints;
  }, []);

  const drawLandmarksOnCanvas = useCallback((results: any) => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.restore();
  }, [canvasElement]);

  // 2. Perform API Cloud Prediction
  const makePrediction = useCallback(async (bufferToPredict: number[][]) => {
    if (isPredictingRef.current) return;

    try {
      isPredictingRef.current = true;
      setState((prev) => ({ ...prev, isProcessing: true }));

      console.log("🚀 [API] กำลังส่งข้อมูล 40 frames ไปให้ Backend...");

      const prediction = await predictSign(bufferToPredict);

      if (prediction.success) {
        console.log("✅ [API] ทายสำเร็จ ได้คำว่า:", prediction.prediction, "ความมั่นใจ:", prediction.confidence);

        const isMatched = targetPhrase && prediction.confidence >= 0.5 && checkPhraseMatch(targetPhrase, prediction.prediction, variant);

        setState((prev) => ({
          ...prev,
          currentPrediction: prediction.prediction,
          currentConfidence: prediction.confidence,
          top3Predictions: prediction.top3,
          isMatched: !!isMatched,
          isProcessing: false,
          error: null,
        }));

        if (onPrediction) onPrediction(prediction);
        if (isMatched && onPhraseMatch) onPhraseMatch(prediction.prediction, prediction.confidence);
      } else if (prediction.error) {
        console.error("🔴 [API] Backend ส่ง Error กลับมา:", prediction.error);
        setState((prev) => ({ ...prev, error: prediction.error, isProcessing: false }));
      }
    } catch (error) {
      console.error('💥 [API] คุยกับ Backend ไม่สำเร็จ (Network Error?):', error);
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error', isProcessing: false }));
    } finally {
      isPredictingRef.current = false;
    }
  }, [targetPhrase, variant, onPhraseMatch, onPrediction]);

  // Handle Mediapipe callback
  const onResultsRef = useRef((results: any) => { });
  useEffect(() => {
    onResultsRef.current = (results: any) => {
      let currentStatus: DistanceStatus = "no_face";

      if (results.faceLandmarks) {
        const leftEye = results.faceLandmarks[33];
        const rightEye = results.faceLandmarks[263];

        if (leftEye && rightEye) {
          const dx = leftEye.x - rightEye.x;
          const dy = leftEye.y - rightEye.y;
          const dz = leftEye.z - rightEye.z;

          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distanceStatusRef.current === "good") {
             currentStatus = "good";
          } else {
             // ถ้ายังไม่เคยมองเห็นว่า Good ค่อยคำนวณระยะห่าง
             if (distance < distanceThreshold) {
               currentStatus = "too_far";
             } else if (distance > tooCloseThreshold) {
               currentStatus = "too_close";
             } else {
               currentStatus = "good";
             }
          }
        }
      }

      if (currentStatus !== distanceStatusRef.current) {
        distanceStatusRef.current = currentStatus;
        setState((prev) => ({
          ...prev,
          distanceStatus: currentStatus,
          isTooFar: currentStatus === "too_far",
          isTooClose: currentStatus === "too_close",
        }));
        if (onDistanceChange) onDistanceChange(currentStatus);
      }

      const keypoints = extractKeypoints(results);
      keypointsBufferRef.current.push(keypoints);

      if (keypointsBufferRef.current.length > SEQUENCE_LENGTH) {
        keypointsBufferRef.current.shift();
      }

      setState((prev) => ({
        ...prev,
        bufferLength: keypointsBufferRef.current.length,
        error: null
      }));

      if (enabled) {
        drawLandmarksOnCanvas(results);
        frameCountRef.current++;

        const isBufferFull = keypointsBufferRef.current.length === SEQUENCE_LENGTH;
        const isTimeForPrediction = frameCountRef.current % PREDICTION_INTERVAL === 0;

        // 🚨 แก้ไขจุดนี้: อนุญาตให้ยิง API ได้แม้สถานะเป็น no_face หรือ too_far เพื่อให้เกมไม่ค้าง!
        // const canPredict = distanceStatusRef.current !== "too_close"; // แค่อย่าอยู่ชิดจอเกินไปก็พอ
        const canPredict = true;

        if (isBufferFull && isTimeForPrediction && !isPredictingRef.current) {
          makePrediction([...keypointsBufferRef.current]);
        }
      }
    };
  }, [enabled, distanceThreshold, tooCloseThreshold, drawLandmarksOnCanvas, extractKeypoints, makePrediction, onDistanceChange]);

  // 🔑 Use the module-level Holistic singleton — never recreate it
  useEffect(() => {
    let cancelled = false;

    // Create a stable wrapper so we can identify & remove this hook's callback later
    const myCallback: ResultsCallback = (res: any) => onResultsRef.current(res);
    _activeResultsCallback = myCallback;

    const startLoop = async () => {
      let holistic: any;
      try {
        holistic = await getOrCreateHolistic();
      } catch (e) {
        console.error('[useSignAndDistance] Failed to get Holistic:', e);
        return;
      }
      if (cancelled) return;

      holisticRef.current = holistic;

      const detectFrame = async () => {
        if (cancelled) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // 🛑 Guard Clause: ดักเช็คไม่ให้วิดีโอที่มีขนาด 0x0 หลุดเข้าไปที่ MediaPipe
        if (
          !video ||
          !canvas ||
          video.readyState < 2 || // ต้องเริ่มเล่นแล้วเท่านั้น
          video.videoWidth === 0 || // ความกว้างต้องมากกว่า 0
          video.videoHeight === 0 || // ความสูงต้องมากกว่า 0
          isSendingRef.current
        ) {
          // ถ้ายังไม่พร้อม ให้รอรอบถัดไปเงียบๆ (ไม่เกิด Error)
          requestRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        // ✅ ถ้าผ่าน Guard Clause แปลว่าวิดีโอพร้อม 100%
        isSendingRef.current = true;
        try {
          // ปรับขนาด Canvas ให้ตรงกับวิดีโอ
          if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
          if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
          
          await holistic.send({ image: video });
        } catch (error) {
          console.error('[useSignAndDistance] MediaPipe send error:', error);
        } finally {
          isSendingRef.current = false;
        }
        
        requestRef.current = requestAnimationFrame(detectFrame);
      };

      requestRef.current = requestAnimationFrame(detectFrame);
    };

    const timeoutId = setTimeout(startLoop, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      // ❌ ห้าม close() Holistic singleton — แค่หยุด rAF loop ของ hook นี้เท่านั้น
      holisticRef.current = null;
      // ถ้า hook นี้เป็น active consumer อยู่ ให้ยกเลิก callback
      if (_activeResultsCallback === myCallback) {
        _activeResultsCallback = null;
      }
    };
  }, []);

  // ── clearBuffer ──────────────────────────────────────────────────────────
  // Stable reference (deps: none) — safe to pass as prop without triggering
  // re-renders in consumers.
  const clearBuffer = useCallback(() => {
    keypointsBufferRef.current = [];
    frameCountRef.current = 0;
    setState((prev) => ({ ...prev, bufferLength: 0 }));
    console.log('[useSignAndDistance] Buffer cleared.');
  }, []);

  return { ...state, clearBuffer };
}