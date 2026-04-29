import { useState, useEffect, useRef } from "react";
import { MIN_SCANNING_DURATION } from "@/lib/gameConstants";
import { DistanceStatus } from "@/hooks/useSignAndDistance";

interface UseCameraStateReturn {
  cameraPermissionGranted: boolean;
  setCameraPermissionGranted: React.Dispatch<React.SetStateAction<boolean>>;
  showCameraPermission: boolean;
  setShowCameraPermission: React.Dispatch<React.SetStateAction<boolean>>;
  skipCameraCalibration: boolean;
  setSkipCameraCalibration: React.Dispatch<React.SetStateAction<boolean>>;
  showHowToPlay: boolean;
  setShowHowToPlay: React.Dispatch<React.SetStateAction<boolean>>;
  tutorialStep: "initial" | "scanning" | "too_close" | "success";
  setTutorialStep: React.Dispatch<React.SetStateAction<"initial" | "scanning" | "too_close" | "success">>;
  isDetecting: boolean;
  setIsDetecting: React.Dispatch<React.SetStateAction<boolean>>;
  isLive: boolean;
  setIsLive: React.Dispatch<React.SetStateAction<boolean>>;
  scanningLocked: boolean;
  webcamVideo: HTMLVideoElement | null;
  setWebcamVideo: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
  webcamCanvas: HTMLCanvasElement | null;
  setWebcamCanvas: React.Dispatch<React.SetStateAction<HTMLCanvasElement | null>>;
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  sessionStartedRef: React.MutableRefObject<boolean>;
  successTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  goodPositionTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  requestCameraPermission: (fromCalibration?: boolean) => Promise<void>;
}

export const useCameraState = (): UseCameraStateReturn => {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(() => {
    return sessionStorage.getItem('cameraPermissionGranted') === 'true';
  });
  const [showCameraPermission, setShowCameraPermission] = useState(false);
  const [skipCameraCalibration, setSkipCameraCalibration] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<"initial" | "scanning" | "too_close" | "success">("initial");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [scanningLocked, setScanningLocked] = useState(false);
  const [webcamVideo, setWebcamVideo] = useState<HTMLVideoElement | null>(null);
  const [webcamCanvas, setWebcamCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sessionStartedRef = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goodPositionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Camera permission listener
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

        const updatePermissionState = () => {
          if (permissionStatus?.state === 'denied' || permissionStatus?.state === 'prompt') {
            setCameraPermissionGranted(false);
            localStorage.removeItem('cameraPermissionGranted');
            setIsLive(false);
            setIsDetecting(false);
            setTutorialStep("initial");
            sessionStartedRef.current = false;
          } else if (permissionStatus?.state === 'granted') {
            setCameraPermissionGranted(true);
            localStorage.setItem('cameraPermissionGranted', 'true');
          }
        };

        updatePermissionState();
        permissionStatus.onchange = updatePermissionState;
      } catch (error) {
        // ...existing code...
      }
    };

    checkPermission();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  // Scanning lock duration
  useEffect(() => {
    if (isDetecting) {
      setScanningLocked(true);
      const timer = setTimeout(() => {
        setScanningLocked(false);
      }, MIN_SCANNING_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isDetecting]);

  // Clear canvas when not live/detecting
  useEffect(() => {
    if (!isLive && !isDetecting && webcamCanvas) {
      const ctx = webcamCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, webcamCanvas.width, webcamCanvas.height);
      }
    }
  }, [isLive, isDetecting, webcamCanvas]);

  const requestCameraPermission = async (fromCalibration = false) => {
    try {
      if (!fromCalibration) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30 }
          }
        });
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraPermissionGranted(true);
      sessionStorage.setItem('cameraPermissionGranted', 'true');
      setShowCameraPermission(false);
      setSkipCameraCalibration(false);
      setTutorialStep("initial");
    } catch (err) {
      console.error("Camera permission denied:", err);
      setCameraPermissionGranted(false);
      sessionStorage.removeItem('cameraPermissionGranted');
      setShowCameraPermission(false);
      setSkipCameraCalibration(false);
      alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์");
    }
  };

  return {
    cameraPermissionGranted,
    setCameraPermissionGranted,
    showCameraPermission,
    setShowCameraPermission,
    skipCameraCalibration,
    setSkipCameraCalibration,
    showHowToPlay,
    setShowHowToPlay,
    tutorialStep,
    setTutorialStep,
    isDetecting,
    setIsDetecting,
    isLive,
    setIsLive,
    scanningLocked,
    webcamVideo,
    setWebcamVideo,
    webcamCanvas,
    setWebcamCanvas,
    isTransitioning,
    setIsTransitioning,
    sessionStartedRef,
    successTimerRef,
    goodPositionTimerRef,
    requestCameraPermission,
  };
};
