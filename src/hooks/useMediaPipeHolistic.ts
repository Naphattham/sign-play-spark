/**
 * Custom hook for MediaPipe Holistic with Canvas Drawing
 * Extracts keypoints in the browser and draws them on canvas for immediate feedback
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Holistic, Results } from '@mediapipe/holistic';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { 
  POSE_CONNECTIONS, 
  HAND_CONNECTIONS,
  FACEMESH_TESSELATION 
} from '@mediapipe/holistic';
import { predictSign, PredictionResponse } from '@/lib/signLanguageAPI';
import { Phrase, checkPhraseMatch } from '@/lib/categories';

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

  const holisticRef = useRef<Holistic | null>(null);
  const keypointsBufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  
  // ตัวล็อกสำคัญเพื่อป้องกัน RuntimeError: Aborted
  const isSendingRef = useRef(false); // ป้องกันส่งเฟรมซ้อนให้ MediaPipe
  const isPredictingRef = useRef(false); // ป้องกันส่ง API ซ้อนไป Cloud

  // 1. ฟังก์ชันสกัดจุดพิกัด (Extract Keypoints)
  const extractKeypoints = useCallback((results: Results): number[] => {
    const keypoints: number[] = [];

    // Pose landmarks (25 points x 4 values = 100)
    if (results.poseLandmarks) {
      for (let i = 0; i < POSE_POINTS; i++) {
        const lm = results.poseLandmarks[i];
        if (lm) keypoints.push(lm.x, lm.y, lm.z, lm.visibility || 0);
        else keypoints.push(0, 0, 0, 0);
      }
    } else {
      keypoints.push(...Array(POSE_POINTS * 4).fill(0));
    }

    // Face landmarks (30 selected points x 3 values = 90)
    if (results.faceLandmarks) {
      for (const idx of FACE_SELECTED) {
        const lm = results.faceLandmarks[idx];
        if (lm) keypoints.push(lm.x, lm.y, lm.z);
        else keypoints.push(0, 0, 0);
      }
    } else {
      keypoints.push(...Array(FACE_POINTS * 3).fill(0));
    }

    // Left hand landmarks (21 points x 3 values = 63)
    if (results.leftHandLandmarks) {
      for (let i = 0; i < HAND_POINTS; i++) {
        const lm = results.leftHandLandmarks[i];
        if (lm) keypoints.push(lm.x, lm.y, lm.z);
        else keypoints.push(0, 0, 0);
      }
    } else {
      keypoints.push(...Array(HAND_POINTS * 3).fill(0));
    }

    // Right hand landmarks (21 points x 3 values = 63)
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

  // 2. ฟังก์ชันวาดจุดบนจอ (เห็นผลทันทีแบบ Real-time)
  const drawLandmarksOnCanvas = useCallback((results: Results) => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // วาดท่าทางร่างกาย
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
      drawLandmarks(ctx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2, radius: 6 });
    }

    // วาดจุดบนใบหน้า
    if (results.faceLandmarks) {
      drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      const selectedFacePoints = FACE_SELECTED.map(idx => results.faceLandmarks[idx]);
      drawLandmarks(ctx, selectedFacePoints, { color: '#FFD700', lineWidth: 1, radius: 3 });
    }

    // วาดมือซ้าย-ขวา
    if (results.leftHandLandmarks) {
      drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 5 });
      drawLandmarks(ctx, results.leftHandLandmarks, { color: '#00FF00', lineWidth: 2, radius: 5 });
    }

    if (results.rightHandLandmarks) {
      drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 5 });
      drawLandmarks(ctx, results.rightHandLandmarks, { color: '#FF0000', lineWidth: 2, radius: 5 });
    }

    ctx.restore();
  }, [canvasElement]);

  // 3. ฟังก์ชันส่งข้อมูลไปทำนายบน Cloud (แยกการทำงานออกมาเพื่อไม่ให้ขวางการวาดจอ)
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
  const onResultsRef = useRef((results: Results) => {});
  useEffect(() => {
    onResultsRef.current = (results: Results) => {
      if (!enabled) return;

      drawLandmarksOnCanvas(results);
      const keypoints = extractKeypoints(results);
      keypointsBufferRef.current.push(keypoints);

      if (keypointsBufferRef.current.length > SEQUENCE_LENGTH) {
        keypointsBufferRef.current.shift();
      }

      setState((prev) => ({ ...prev, bufferLength: keypointsBufferRef.current.length, error: null }));

      frameCountRef.current++;
      // ดึงเฟรมส่ง Predict โดยก็อปปี้ Array ป้องกันค่าเปลี่ยนระหว่างส่ง
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
      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      holistic.onResults((res) => onResultsRef.current(res));
      holisticRef.current = holistic;

      // ลูปดึงภาพด้วย requestAnimationFrame (ดีกว่า setInterval มาก)
      const detectFrame = async () => {
        if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && !isSendingRef.current) {
          isSendingRef.current = true; // ล็อก! ไม่ให้เฟรมอื่นแทรก
          try {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            await holistic.send({ image: videoElement });
          } catch (error) {
            console.error('MediaPipe send error:', error);
          } finally {
            isSendingRef.current = false; // ปลดล็อก! พร้อมรับเฟรมถัดไป
          }
        }
        requestRef.current = requestAnimationFrame(detectFrame);
      };

      videoElement.addEventListener('loadedmetadata', () => {
         requestRef.current = requestAnimationFrame(detectFrame);
      });
      // เผื่อวิดีโอโหลดเสร็จแล้ว
      if (videoElement.readyState >= 2) {
         requestRef.current = requestAnimationFrame(detectFrame);
      }
    };

    initHolistic();

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