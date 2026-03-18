/**
 * Custom hook for Thai Sign Language Recognition
 * Manages keypoint extraction and prediction pipeline
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { processFrame, predictSign, videoFrameToDataUrl, PredictionResponse } from '@/lib/signLanguageAPI';
import { Phrase, checkPhraseMatch } from '@/lib/categories';

const SEQUENCE_LENGTH = 40;
const PREDICTION_INTERVAL = 2; // Predict every N frames
const FRAME_CAPTURE_RATE = 100; // Capture frame every 100ms

interface UseSignLanguageRecognitionProps {
  videoElement: HTMLVideoElement | null;
  enabled: boolean;
  targetPhrase?: Phrase;
  onPhraseMatch?: (prediction: string, confidence: number) => void;
  onPrediction?: (prediction: PredictionResponse) => void;
}

interface SignLanguageRecognitionState {
  isProcessing: boolean;
  bufferLength: number;
  currentPrediction: string | null;
  currentConfidence: number;
  top3Predictions: Array<{ class: string; confidence: number }>;
  isMatched: boolean;
  error: string | null;
}

export function useSignLanguageRecognition({
  videoElement,
  enabled,
  targetPhrase,
  onPhraseMatch,
  onPrediction,
}: UseSignLanguageRecognitionProps): SignLanguageRecognitionState {
  const [state, setState] = useState<SignLanguageRecognitionState>({
    isProcessing: false,
    bufferLength: 0,
    currentPrediction: null,
    currentConfidence: 0,
    top3Predictions: [],
    isMatched: false,
    error: null,
  });

  const keypointsBufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Process a single video frame
  const processVideoFrame = useCallback(async () => {
    if (!videoElement || !enabled || isProcessingRef.current) {
      return;
    }

    try {
      // Check if video is ready
      if (videoElement.readyState < 2) {
        return;
      }

      isProcessingRef.current = true;

      // Convert video frame to data URL
      const frameDataUrl = videoFrameToDataUrl(videoElement);

      // Extract keypoints from frame
      const response = await processFrame(frameDataUrl);

      if (response.success && response.keypoints.length > 0) {
        // Add keypoints to buffer
        keypointsBufferRef.current.push(response.keypoints);

        // Keep only the last SEQUENCE_LENGTH frames
        if (keypointsBufferRef.current.length > SEQUENCE_LENGTH) {
          keypointsBufferRef.current.shift();
        }

        setState((prev) => ({
          ...prev,
          bufferLength: keypointsBufferRef.current.length,
          error: null,
        }));

        // Predict when buffer is full and at the right interval
        frameCountRef.current++;
        if (
          keypointsBufferRef.current.length === SEQUENCE_LENGTH &&
          frameCountRef.current % PREDICTION_INTERVAL === 0
        ) {
          await makePrediction();
        }
      } else if (response.error) {
        setState((prev) => ({
          ...prev,
          error: response.error || null,
        }));
      }
    } catch (error) {
      console.error('Error processing video frame:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      isProcessingRef.current = false;
    }
  }, [videoElement, enabled]);

  // Make prediction from keypoints buffer
  const makePrediction = useCallback(async () => {
    if (keypointsBufferRef.current.length !== SEQUENCE_LENGTH) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isProcessing: true }));

      const prediction = await predictSign(keypointsBufferRef.current);

      if (prediction.success) {
        const isMatched =
          targetPhrase &&
          prediction.confidence >= 0.5 &&
          checkPhraseMatch(targetPhrase, prediction.prediction);

        setState((prev) => ({
          ...prev,
          currentPrediction: prediction.prediction,
          currentConfidence: prediction.confidence,
          top3Predictions: prediction.top3,
          isMatched: !!isMatched,
          isProcessing: false,
          error: null,
        }));

        // Call callbacks
        if (onPrediction) {
          onPrediction(prediction);
        }

        if (isMatched && onPhraseMatch) {
          onPhraseMatch(prediction.prediction, prediction.confidence);
        }
      } else if (prediction.error) {
        setState((prev) => ({
          ...prev,
          error: prediction.error || null,
          isProcessing: false,
        }));
      }
    } catch (error) {
      console.error('Error making prediction:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isProcessing: false,
      }));
    }
  }, [targetPhrase, onPhraseMatch, onPrediction]);

  // Start/stop frame capture interval
  useEffect(() => {
    if (enabled && videoElement) {
      // Start capturing frames
      intervalRef.current = setInterval(processVideoFrame, FRAME_CAPTURE_RATE);
    } else {
      // Stop capturing frames
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset state
      keypointsBufferRef.current = [];
      frameCountRef.current = 0;
      setState({
        isProcessing: false,
        bufferLength: 0,
        currentPrediction: null,
        currentConfidence: 0,
        top3Predictions: [],
        isMatched: false,
        error: null,
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, videoElement, processVideoFrame]);

  return state;
}
