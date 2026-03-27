import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";

interface HLSVideoPlayerProps {
  /** Full Firebase Storage URL to index.m3u8 */
  src: string;
  /** Auto-loop the video (default: true) */
  loop?: boolean;
  /** Mute the video (default: true) - Required for Autoplay */
  muted?: boolean;
  /** Auto-play the video (default: true) */
  autoPlay?: boolean;
  /** Additional class names for the wrapper div */
  className?: string;
  /** Show custom controls (default: true) */
  showControls?: boolean;
  /** Auto-play as soon as the user clicks play (default: false for Autoplay) */
  lazyLoad?: boolean;
}

type PlayerState = "idle" | "loading" | "ready" | "playing" | "paused" | "error";

/**
 * HLSVideoPlayer
 * ───────────────
 * A production-ready HLS player built on hls.js with:
 * - Autoplay enabled (starts immediately)
 * - Safari native HLS fallback  (<video> supports HLS natively on Safari)
 * - Proper Hls instance lifecycle management
 * - Smooth progress bar + custom controls
 */
export function HLSVideoPlayer({
  src,
  loop = true,
  muted = true,
  autoPlay = true,
  className = "",
  showControls = true,
  lazyLoad = false, // บังคับให้โหลดทันที ไม่ต้องรอคลิก
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  // ถ้าตั้ง autoplay ให้เริ่มที่ loading เลย จะได้ไม่กระพริบหน้า idle
  const isLazy = autoPlay ? false : lazyLoad;
  const [playerState, setPlayerState] = useState<PlayerState>(isLazy ? "idle" : "loading");
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  /** Destroy existing Hls instance safely */
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  /** Initialize the HLS stream */
  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setPlayerState("loading");

    // ─── Safari: native HLS support ───────────────────────────────────────
    if (!Hls.isSupported()) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        
        if (autoPlay) {
          video.play().catch(console.warn);
          setPlayerState("playing");
        } else {
          setPlayerState("ready");
        }
      } else {
        console.error("HLS is not supported in this browser.");
        setPlayerState("error");
      }
      return;
    }

    // ─── hls.js path (Chrome, Firefox, Edge…) ─────────────────────────────
    destroyHls();

    const hls = new Hls({
      // 🚀 เร่งสปีดการโหลดตอนเริ่มต้น
      enableWorker: true,
      lowLatencyMode: true,       // เปิดโหมดความหน่วงต่ำ
      startFragPrefetch: true,    // สั่งให้ดึงไฟล์วิดีโอก้อนแรกมาเตรียมไว้ทันทีที่อ่าน m3u8 จบ
      
      // 📦 จัดการ Buffer ให้เบาลง
      maxBufferLength: 10,        // ไม่ต้องโหลดตุนไว้เยอะเกินไป (เพราะคลิปเราสั้น)
      maxMaxBufferLength: 20,
      
      // ⚡️ บังคับให้ไม่ต้องสนใจคุณภาพเน็ตตอนเริ่ม ให้รีบโหลดก้อนแรกมาเล่นเลย
      startLevel: 0, 
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setPlayerState("ready");
      if (autoPlay) {
        video.play().catch((err) => {
          console.warn("Autoplay prevented:", err);
          setPlayerState("paused"); // ถ้า Browser บล็อก ให้หยุดที่ paused
        });
        setPlayerState("playing");
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        console.error("HLS fatal error:", data);
        setPlayerState("error");
        destroyHls();
      }
    });

    hlsRef.current = hls;
  }, [src, destroyHls, autoPlay]);

  /** Lifecycle & Event Listeners */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onEnded = () => {
      if (!loop) setPlayerState("paused");
    };
    const onPlay = () => setPlayerState("playing");
    const onPause = () => setPlayerState("paused");

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Auto-initialize if not lazy
    if (!isLazy) {
      initHls();
    }

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [src, isLazy, loop, initHls]);

  /** Cleanup Hls on unmount */
  useEffect(() => {
    return () => destroyHls();
  }, [destroyHls]);

  // ─── Controls handlers ───────────────────────────────────────────────────
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState === "idle") {
      initHls();
      return;
    }

    if (playerState === "playing") {
      video.pause();
    } else {
      video.play().catch(console.warn);
    }
  };

  const handleReset = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.pause();
    setPlayerState("paused");
    setProgress(0);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const isLoading = playerState === "loading";
  const isPlaying = playerState === "playing";
  const isError = playerState === "error";

  return (
    <div className={`hls-player-wrapper ${className}`} style={styles.wrapper}>
      {/* ── Idle overlay (lazy play button) ─────────────────────────────── */}
      {playerState === "idle" && (
        <div style={styles.idleOverlay} onClick={handlePlayPause}>
          <div style={styles.bigPlayBtn}>
            <Play size={32} color="#fff" />
          </div>
        </div>
      )}

      {/* ── Loading spinner ──────────────────────────────────────────────── */}
      {isLoading && (
        <div style={styles.idleOverlay}>
          <Loader2 size={40} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {isError && (
        <div style={styles.idleOverlay}>
          <p style={{ color: "#f87171", fontWeight: 600 }}>⚠ Failed to load video</p>
        </div>
      )}

      {/* ── The actual <video> element ───────────────────────────────────── */}
      <video
        ref={videoRef}
        autoPlay={autoPlay}  // เปิดใช้งาน Autoplay
        loop={loop}
        muted={muted}        // บังคับ Muted เพื่อให้ Autoplay ทำงานได้บน Browser
        playsInline
        preload={isLazy ? "none" : "auto"} // เปลี่ยนการโหลดไฟล์ให้โหลดทันที
        style={styles.video}
      />

      {/* ── Custom controls ──────────────────────────────────────────────── */}
      {showControls && playerState !== "idle" && !isLoading && !isError && (
        <div style={styles.controls}>
          {/* progress bar */}
          <div style={styles.progressBar} onClick={handleScrub}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>

          <div style={styles.controlRow}>
            {/* play/pause */}
            <button onClick={handlePlayPause} style={styles.ctrlBtn} aria-label="play-pause">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* reset */}
            <button onClick={handleReset} style={styles.ctrlBtn} aria-label="reset">
              <RotateCcw size={14} />
            </button>

            {/* time */}
            <span style={styles.timeLabel}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {/* Keyframe for spinner (injected inline for zero-dependency styling) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Inline styles (zero external CSS dependency) ───────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
    background: "#0f0f0f",
    borderRadius: "0.75rem",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  idleOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.45)",
    zIndex: 10,
    cursor: "pointer",
  },
  bigPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(255,255,255,0.5)",
    transition: "transform 0.15s ease, background 0.15s ease",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "0.5rem 0.75rem 0.6rem",
    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
    zIndex: 10,
  },
  progressBar: {
    height: 4,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    cursor: "pointer",
    marginBottom: "0.4rem",
  },
  progressFill: {
    height: "100%",
    background: "#f472b6",
    borderRadius: 2,
    transition: "width 0.1s linear",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  ctrlBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
  },
  timeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.7rem",
    marginLeft: "auto",
    fontFamily: "monospace",
  },
};