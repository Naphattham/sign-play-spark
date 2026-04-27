import { forwardRef, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  className?: string;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, className, children, onLoadedMetadata, ...props }, forwardedRef) => {
    
    // 💡 ใช้ internal ref ในกรณีที่ไม่ได้ส่ง ref มาจากข้างนอก เพื่อใช้สั่ง play() ได้
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoRef = (forwardedRef as React.RefObject<HTMLVideoElement>) || internalRef;
    const [isLoading, setIsLoading] = useState(true);

    // 🚨 ไม้ตายที่ 3: บังคับ Safari เล่นวิดีโอผ่าน useEffect เผื่อมันดื้อไม่ยอม autoplay
    useEffect(() => {
      setIsLoading(true);
      if (videoRef.current && props.autoPlay) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(err => {
          console.warn("Safari blocked autoplay:", err);
        });
      }
    }, [src, props.autoPlay, videoRef]);

    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black/5">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        )}
        <video 
          ref={videoRef} 
          className={className} 
          muted
          playsInline // สำคัญมากสำหรับ Safari
          webkit-playsinline="true" // สำคัญมากสำหรับ iOS เก่า
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          {...props}
          onLoadedMetadata={(e) => {
            e.currentTarget.muted = true;
            if (onLoadedMetadata) {
              onLoadedMetadata(e);
            }
          }}
        >
          {/* 🚨 ส่ง MP4 ไปเพียวๆ เลย ไม่ต้องแปลงเป็น WebM ให้ Token พัง */}
          <source src={src} type="video/mp4" />
          
          {children}
          เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
        </video>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";