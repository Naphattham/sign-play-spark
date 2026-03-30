import { forwardRef, useEffect, useRef } from "react";

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  className?: string;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ src, className, children, onLoadedMetadata, ...props }, forwardedRef) => {
    
    // 💡 ใช้ internal ref ในกรณีที่ไม่ได้ส่ง ref มาจากข้างนอก เพื่อใช้สั่ง play() ได้
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoRef = (forwardedRef as React.RefObject<HTMLVideoElement>) || internalRef;

    // 🚨 ไม้ตายที่ 3: บังคับ Safari เล่นวิดีโอผ่าน useEffect เผื่อมันดื้อไม่ยอม autoplay
    useEffect(() => {
      if (videoRef.current && props.autoPlay) {
        videoRef.current.muted = true;
        videoRef.current.play().catch(err => {
          console.warn("Safari blocked autoplay:", err);
        });
      }
    }, [src, props.autoPlay, videoRef]);

    return (
      <video 
        ref={videoRef} 
        className={className} 
        muted
        playsInline // สำคัญมากสำหรับ Safari
        webkit-playsinline="true" // สำคัญมากสำหรับ iOS เก่า
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
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";