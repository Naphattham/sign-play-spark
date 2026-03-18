/**
 * Custom hook for MediaPipe Holistic with Canvas Drawing
 * Extracts keypoints in the browser and draws them on canvas for immediate feedback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { predictSign, PredictionResponse } from '@/lib/signLanguageAPI';
import { Phrase, checkPhraseMatch } from '@/lib/categories';

// ----------------------------------------------------------------------
// 🚨 ดึง MediaPipe จาก Window (ที่โหลดมาจาก Script ใน index.html)
// วิธีนี้แก้ปัญหา Vite bundle พังและทำให้มั่นใจว่ามี Constructor และ Connections แน่นอน
// ----------------------------------------------------------------------
const mpHolistic = (window as any);
const HolisticConstructor = mpHolistic.Holistic;
const POSE_CONNECTIONS = mpHolistic.POSE_CONNECTIONS;
const HAND_CONNECTIONS = mpHolistic.HAND_CONNECTIONS;
const FACEMESH_TESSELATION = mpHolistic.FACEMESH_TESSELATION;

// ดึงฟังก์ชันวาดรูปจาก Window ด้วย
const drawConnectors = mpHolistic.drawConnectors;
const drawLandmarks = mpHolistic.drawLandmarks;

const SEQUENCE_LENGTH = 40;
const PREDICTION_INTERVAL = 2; // Predict every N frames

// Face keypoints to extract (eyebrows and mouth)
const EYEBROW_IDX = [55, 65, 52, 53, 46, 285, 295, 282, 283, 276];
const MOUTH_IDX = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324];
const FACE_SELECTED = [...EYEBROW_IDX, ...MOUTH_IDX];

const POSE_POINTS = 25;
const HAND_POINTS = 21;
const FACE_POINTS = FACE_SELECTED.length; // 30

interface UseMediaPipeHolisticProps {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  enabled: boolean;
  targetPhrase?: Phrase;
  onPhraseMatch?: (prediction: string, confidence: number) => void;
  onPrediction?: (prediction: PredictionResponse) => void;
}

interface MediaPipeHolisticState {
  isProcessing: boolean;
  bufferLength: number;
  currentPrediction: string | null;
  currentConfidence: number;
  top3Predictions: Array<{ class: string; confidence: number }>;
  isMatched: boolean;
  error: string | null;
}

export function useMediaPipeHolistic({
  videoElement,
  canvasElement,
  enabled,
  targetPhrase,
  onPhraseMatch,
  onPrediction,
}: UseMediaPipeHolisticProps): MediaPipeHolisticState {
  const [state, setState] = useState<MediaPipeHolisticState>({
    isProcessing: false,
    bufferLength: 0,
    currentPrediction: null,
    currentConfidence: 0,
    top3Predictions: [],
    isMatched: false,
    error: null,
  });

  const holisticRef = useRef<any>(null);
  const keypointsBufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  
  const isSendingRef = useRef(false);
  const isPredictingRef = useRef(false);

  // 1. ฟังก์ชันสกัดจุดพิกัด (Extract Keypoints)
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

  // 2. ฟังก์ชันวาดจุดบนจอ
  const drawLandmarksOnCanvas = useCallback((results: any) => {
    if (!canvasElement || !drawConnectors || !drawLandmarks) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      if (POSE_CONNECTIONS) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      }
      drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2, radius: 4 });
    }

    if (results.faceLandmarks) {
      if (FACEMESH_TESSELATION) {
        drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      }
      const selectedFacePoints = FACE_SELECTED.map(idx => results.faceLandmarks[idx]).filter(Boolean);
      drawLandmarks(ctx, selectedFacePoints, { color: '#FFD700', lineWidth: 1, radius: 2 });
    }

    if (results.leftHandLandmarks) {
      if (HAND_CONNECTIONS) {
        drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
      }
      drawLandmarks(ctx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2, radius: 4 });
    }

    if (results.rightHandLandmarks) {
      if (HAND_CONNECTIONS) {
        drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
      }
      drawLandmarks(ctx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2, radius: 4 });
    }

    ctx.restore();
  }, [canvasElement]);

  // 3. ฟังก์ชันส่งข้อมูลไปทำนายบน Cloud
  const makePrediction = useCallback(async (bufferToPredict: number[][]) => {
    if (isPredictingRef.current) return;

    try {
      isPredictingRef.current = true;
      setState((prev) => ({ ...prev, isProcessing: true }));

      const prediction = await predictSign(bufferToPredict);

      if (prediction.success) {
        const isMatched = targetPhrase && prediction.confidence >= 0.5 && checkPhraseMatch(targetPhrase, prediction.prediction);

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
        setState((prev) => ({ ...prev, error: prediction.error, isProcessing: false }));
      }
    } catch (error) {
      console.error('Error making prediction:', error);
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error', isProcessing: false }));
    } finally {
      isPredictingRef.current = false;
    }
  }, [targetPhrase, onPhraseMatch, onPrediction]);

  // 4. เมื่อ MediaPipe ประมวลผลเสร็จ (onResults)
  const onResultsRef = useRef((results: any) => {});
  useEffect(() => {
    onResultsRef.current = (results: any) => {
      if (!enabled) return;

      drawLandmarksOnCanvas(results);
      const keypoints = extractKeypoints(results);
      keypointsBufferRef.current.push(keypoints);

      if (keypointsBufferRef.current.length > SEQUENCE_LENGTH) {
        keypointsBufferRef.current.shift();
      }

      setState((prev) => ({ ...prev, bufferLength: keypointsBufferRef.current.length, error: null }));

      frameCountRef.current++;
      
      if (keypointsBufferRef.current.length === SEQUENCE_LENGTH && frameCountRef.current % PREDICTION_INTERVAL === 0 && !isPredictingRef.current) {
        makePrediction([...keypointsBufferRef.current]);
      }
    };
  }, [enabled, drawLandmarksOnCanvas, extractKeypoints, makePrediction]);

  // 5. เตรียมความพร้อมและรัน MediaPipe
  useEffect(() => {
    if (!enabled || !videoElement || !canvasElement) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      keypointsBufferRef.current = [];
      isSendingRef.current = false;
      isPredictingRef.current = false;
      return;
    }

    const initHolistic = async () => {
      if (!HolisticConstructor) {
        console.error("MediaPipe Holistic Constructor not found! Please check if scripts in index.html are loaded properly.");
        return;
      }

      const holistic = new HolisticConstructor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`,
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

      holistic.onResults((res: any) => onResultsRef.current(res));
      holisticRef.current = holistic;

      const detectFrame = async () => {
        if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && !isSendingRef.current) {
          isSendingRef.current = true;
          try {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            await holistic.send({ image: videoElement });
          } catch (error) {
            console.error('MediaPipe send error:', error);
          } finally {
            isSendingRef.current = false;
          }
        }
        requestRef.current = requestAnimationFrame(detectFrame);
      };

      videoElement.addEventListener('loadedmetadata', () => {
         requestRef.current = requestAnimationFrame(detectFrame);
      });
      
      if (videoElement.readyState >= 2) {
         requestRef.current = requestAnimationFrame(detectFrame);
      }
    };

    // ใส่ setTimeout เล็กน้อยเพื่อให้แน่ใจว่า window load script เสร็จแล้ว
    setTimeout(() => {
        initHolistic();
    }, 100);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (holisticRef.current) {
        holisticRef.current.close();
        holisticRef.current = null;
      }
    };
  }, [enabled, videoElement, canvasElement]);

  return state;
}