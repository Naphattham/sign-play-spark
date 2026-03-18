/**
 * Sign Language Recognition API Service
 * Connects to Firebase Cloud Functions for Thai Sign Language recognition
 */

// 1. กำหนด URL ของ Cloud Functions Gen 2 (เอามาจากหน้าจอ Firebase Console)
const CLOUD_PROCESS_FRAME_URL = 'https://process-frame-ygmhb7nnxq-uc.a.run.app';
const CLOUD_PREDICT_SIGN_URL = 'https://predict-sign-ygmhb7nnxq-uc.a.run.app';
const CLOUD_GET_MODEL_INFO_URL = 'https://get-model-info-ygmhb7nnxq-uc.a.run.app';

// 2. กำหนด URL สำหรับการเทสด้วย Emulator ในเครื่อง (เผื่อต้องใช้ในอนาคต)
const LOCAL_BASE_URL = 'http://127.0.0.1:5001/signmate-cbe60/us-central1';
const LOCAL_PROCESS_FRAME_URL = `${LOCAL_BASE_URL}/process_frame`;
const LOCAL_PREDICT_SIGN_URL = `${LOCAL_BASE_URL}/predict_sign`;
const LOCAL_GET_MODEL_INFO_URL = `${LOCAL_BASE_URL}/get_model_info`;

// 3. สวิตช์สำหรับเลือกโหมดการทำงาน
// ตอนนี้ตั้งเป็น false เพื่อบังคับให้มันยิงไปหา Cloud เสมอครับ
const USE_LOCAL = false; 

const PROCESS_FRAME_URL = USE_LOCAL ? LOCAL_PROCESS_FRAME_URL : CLOUD_PROCESS_FRAME_URL;
const PREDICT_SIGN_URL = USE_LOCAL ? LOCAL_PREDICT_SIGN_URL : CLOUD_PREDICT_SIGN_URL;
const GET_MODEL_INFO_URL = USE_LOCAL ? LOCAL_GET_MODEL_INFO_URL : CLOUD_GET_MODEL_INFO_URL;

export interface KeypointsResponse {
  keypoints: number[];
  success: boolean;
  error?: string;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  top3: Array<{
    class: string;
    confidence: number;
  }>;
  success: boolean;
  error?: string;
}

export interface ModelInfo {
  classes: string[];
  num_classes: number;
  sequence_length: number;
  features: number;
  success: boolean;
}

/**
 * Extract keypoints from a video frame
 */
export async function processFrame(frameDataUrl: string): Promise<KeypointsResponse> {
  try {
    const response = await fetch(PROCESS_FRAME_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ frame: frameDataUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing frame:', error);
    return {
      keypoints: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Predict sign language from a sequence of keypoints
 */
export async function predictSign(keypointsBuffer: number[][]): Promise<PredictionResponse> {
  try {
    const response = await fetch(PREDICT_SIGN_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keypoints_buffer: keypointsBuffer }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting sign:', error);
    return {
      prediction: '',
      confidence: 0,
      top3: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get model information
 */
export async function getModelInfo(): Promise<ModelInfo> {
  try {
    const response = await fetch(GET_MODEL_INFO_URL, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting model info:', error);
    return {
      classes: [],
      num_classes: 0,
      sequence_length: 0,
      features: 0,
      success: false,
    };
  }
}

/**
 * Convert video frame to base64 data URL
 */
export function videoFrameToDataUrl(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}