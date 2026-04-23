import { useState, useEffect, useRef } from "react";
import { Camera, Star, Hand, ShieldCheck, Video, X, Check } from "lucide-react";
import Webcam from "react-webcam";

import guideHumanImg from '@/asset/image/guide_human.webp';
import { useSignAndDistance } from '@/hooks/useSignAndDistance';

const VIDEO_CONSTRAINTS = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 60 }
};

interface CameraPermissionProps {
  onAllow: (fromCalibration?: boolean) => void;
  onSkip: () => void;
  skipCalibration?: boolean;
}


interface CalibrationModalProps {
  onClose: () => void;
  onPlay: () => void;
}

function CalibrationModal({ onClose, onPlay }: CalibrationModalProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<"initial" | "scanning" | "too_close" | "holding" | "success">("initial");

  const webcamRef = useRef<Webcam>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { distanceStatus } = useSignAndDistance({
    videoElement: videoEl,
    canvasElement: canvasEl,
    enabled: isStarted && !!videoEl && !!canvasEl,
  });

  const onPlayRef = useRef(onPlay);
  useEffect(() => {
    onPlayRef.current = onPlay;
  }, [onPlay]);

  useEffect(() => {
    if (tutorialStep === "success") {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);

        const innerTimer = setTimeout(() => {
          onPlayRef.current();
        }, 300);

        return () => clearTimeout(innerTimer);
      }, 1500);

      return () => clearTimeout(exitTimer);
    }
  }, [tutorialStep]);

  useEffect(() => {
    if (!isStarted || tutorialStep === "success" || !videoEl) return;

    if (distanceStatus === "good") {
      if (tutorialStep !== "holding") {
        setTutorialStep("holding");
      }

      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          setTutorialStep("success");
          holdTimerRef.current = null;
        }, 1000);
      }
    } else {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (distanceStatus === "too_close") {
        setTutorialStep("too_close");
      } else {
        setTutorialStep("scanning");
      }
    }
  }, [distanceStatus, isStarted, tutorialStep, videoEl]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handleStart = () => {
    setIsStarted(true);
    setTutorialStep("scanning");
  };

  const handleUserMedia = () => {
    if (webcamRef.current?.video) {
      setVideoEl(webcamRef.current.video);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity duration-500 ease-in-out ${isExiting ? "opacity-0" : "opacity-100"
        }`}
    >
      <div
        className={`relative w-full max-w-xl aspect-square bg-black border-[4px] border-black rounded-[2rem] shadow-[12px_12px_0_0_#000] overflow-hidden transition-all duration-500 ease-in-out ${isExiting
          ? "scale-90 opacity-0 shadow-none translate-y-4"
          : "animate-in zoom-in-95"
          }`}
      >
        {!isStarted ? (
          <div className="absolute inset-0 bg-[#fefcf4] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
            <div className="bg-[#efeee5] p-6 rounded-full border-[4px] border-black shadow-[6px_6px_0_0_#000]">
              <Video size={64} className="text-[#c11660]" strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-black uppercase text-[#383833]">มาทดสอบกล้องเตรียมลุยกันเถอะ!</h3>            <button
              onClick={handleStart}
              className="w-full max-w-sm bg-[#c11660] text-white font-black text-2xl py-5 rounded-2xl border-[4px] border-black shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all uppercase tracking-widest"
            >
              START CAMERA
            </button>
          </div>
        ) : (
          <>
            <Webcam
              audio={false}
              mirrored
              ref={webcamRef}
              videoConstraints={VIDEO_CONSTRAINTS}
              onUserMedia={handleUserMedia}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={setCanvasEl}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
            />

            {(tutorialStep === "scanning" || tutorialStep === "too_close" || tutorialStep === "holding") && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-end">
                <img
                  src={guideHumanImg}
                  alt="Guide"
                  className={`absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none select-none transition-opacity duration-300 ${tutorialStep === "holding" ? "opacity-50" : "opacity-80"
                    }`}
                />
                {tutorialStep !== "holding" && (
                  <div
                    className={`relative z-10 mb-6 bg-white/95 border-[3px] rounded-full px-6 py-3 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${tutorialStep === "too_close"
                      ? "border-red-500 text-red-500 animate-pulse scale-105 transition-transform"
                      : "border-black text-[#383833] animate-bounce"
                      }`}
                  >
                    {tutorialStep === "too_close"
                      ? "ขยับถอยห่างไปอีกหน่อย"
                      : "ถอยหลังออกไปให้มีระยะห่างจากกล้อง"}
                  </div>
                )}
              </div>
            )}

            {tutorialStep === "success" && (
              <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center backdrop-blur-sm z-30 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 border-[4px] border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <Check size={48} className="text-green-500" strokeWidth={4} />
                </div>
                <h3 className="text-white font-black text-4xl uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  Success!
                </h3>
                <p className="text-white font-bold text-xl drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] mt-2">
                  คุณอยู่ในตำแหน่งที่เหมาะสมแล้ว
                </p>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}

export function CameraPermission({ onAllow, onSkip, skipCalibration }: CameraPermissionProps) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#fefcf4",
          backgroundImage: "radial-gradient(#bab9b2 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 opacity-20" style={{ transform: "rotate(12deg)" }}>
          <Hand size={96} className="text-[#c11660]" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-20" style={{ transform: "rotate(-12deg)" }}>
          <Hand size={112} className="text-[#7d6000]" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-white border-[4px] border-black rounded-3xl shadow-[8px_8px_0_0_#000] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

          <div className="bg-[#f9d066] border-b-[4px] border-black pt-10 pb-8 px-6 flex flex-col items-center justify-center relative">
            <Star className="absolute top-4 left-6 text-black opacity-30 w-6 h-6" />
            <Star className="absolute bottom-4 right-6 text-black opacity-30 w-8 h-8" />

            <div className="relative z-10 bg-white p-5 rounded-full border-[4px] border-black shadow-[6px_6px_0_0_#000] animate-[bounce_3s_infinite]">
              <Camera size={48} className="text-black" strokeWidth={2.5} />
              <div className="absolute -top-2 -right-2 bg-[#c11660] p-1.5 rounded-full border-[3px] border-black">
                <Star size={16} fill="white" className="text-white" />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col gap-6 text-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none text-[#383833] mb-3">
                Ready to Sign<br /> <span className="text-[#c11660] drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)]">Questor?</span>
              </h1>
              <p className="text-base font-bold text-[#65655f] leading-snug">
                เราจำเป็นต้องใช้กล้องเพื่อตรวจจับท่าทาง<br />
                ของคุณแบบเรียลไทม์ และช่วยให้คุณอัปเลเวล!
              </p>
            </div>

            <div className="bg-[#efeee5] border-[3px] border-black rounded-2xl p-3 flex items-center gap-3 text-left shadow-[4px_4px_0_0_#000] -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="bg-[#c11660] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-[2px] border-black">
                <ShieldCheck size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="font-black text-[#c11660] text-sm uppercase tracking-wide leading-none mb-1">
                  เป็นส่วนตัว 100%
                </div>
                <div className="text-[11px] font-bold text-[#65655f] leading-tight mt-1">
                  วิดีโอจะถูกประมวลผลแค่ในอุปกรณ์ ไม่มีการอัปโหลดขึ้นคลาวด์ <br />
                  หรือแอบบันทึกภาพ
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => {
                  if (skipCalibration) {
                    onAllow(false);
                  } else {
                    setShowTutorial(true);
                  }
                }}
                className="group relative w-full bg-[#c11660] hover:bg-[#af0054] text-white border-[4px] border-black rounded-2xl py-4 transition-all shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-black text-lg uppercase tracking-wide">
                  อนุญาตใช้งานกล้อง <Video size={24} strokeWidth={2.5} />
                </span>
              </button>

              <button
                onClick={onSkip}
                className="w-full bg-white hover:bg-[#efeee5] text-[#383833] border-[3px] border-black rounded-2xl py-3.5 transition-all shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                <span className="font-black text-sm uppercase tracking-wide">
                  ข้ามไปก่อน
                </span>
              </button>
            </div>

            <p className="text-[10px] font-bold text-[#81817a] leading-tight px-2">
              การอนุญาตเข้าถึงกล้อง ถือว่าคุณยอมรับ <a className="text-[#c11660] underline hover:text-black" href="#">นโยบายความเป็นส่วนตัว</a> ของเรา SignQuest ประมวลผลข้อมูลทั้งหมดบนอุปกรณ์ของคุณเท่านั้น
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-4" style={{ backgroundColor: "#b13e00" }} />
      <div className="fixed bottom-4 left-0 right-0 h-2 opacity-50" style={{ backgroundColor: "#7d6000" }} />

      {showTutorial && (
        <CalibrationModal
          onClose={() => setShowTutorial(false)}
          onPlay={() => {
            setShowTutorial(false);
            onAllow(true);
          }}
        />
      )}
    </div>
  );
}