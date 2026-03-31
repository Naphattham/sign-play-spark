import type { Category } from "@/lib/categories";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";

interface VideoCardProps {
  phrase: string;
  category: Category;
  variant?: "adult" | "friend";
  byeStep?: 1 | 2;
  eatStep?: 1 | 2 | 3;
  isLive?: boolean;
}

export function VideoCard({ phrase, category, variant, byeStep, eatStep, isLive }: VideoCardProps) {
  // Build video path based on category and phrase
  const getVideoSrc = () => {
    let videoFileName = phrase;

    // Handle phrases with multiple options (e.g., "สวัสดี (ผู้ใหญ่ | เพื่อน)")
    if (category === "general") {
      if (phrase.includes("สวัสดี") && phrase.includes("|")) {
        // Use variant to determine which video to show
        if (variant === "friend") {
          videoFileName = "สวัสดี (เพื่อน)";
        } else {
          videoFileName = "สวัสดี (ผู้ใหญ่)";
        }
      } else if (phrase.includes("กินแล้ว") && phrase.includes("|")) {
        if (isLive) {
          if (variant === "friend") {
            if (eatStep === 1) {
              videoFileName = "กิน";
            } else if (eatStep === 2) {
              videoFileName = "ยัง";
            }
          } else {
            if (eatStep === 1) {
              videoFileName = "กิน";
            } else if (eatStep === 2) {
              videoFileName = "แล้ว";
            }
          }
        } else {
          if (variant === "friend") {
            videoFileName = "ยังไม่ได้กิน";
          } else {
            videoFileName = "กินแล้ว";
          }
        }
      } else if (phrase === "ลาก่อน") {
        if (isLive) {
          if (byeStep === 1) {
            videoFileName = "ฉัน";
          } else if (byeStep === 2) {
            videoFileName = "ไป";
          }
        }
      }
      // Handle other phrases with question marks
      if (phrase === "กินข้าวแล้วหรือยัง?" || phrase === "กินข้าวหรือยัง?") {
        if (isLive) {
          if (eatStep === 1) {
            videoFileName = "ข้าว";
          } else if (eatStep === 2) {
            videoFileName = "กิน";
          } else if (eatStep === 3) {
            videoFileName = "หรือยัง";
          }
        } else {
          videoFileName = "กินข้าวแล้วหรือยัง";
        }
      } else if (phrase === "สบายดีไหม?") {
        videoFileName = "สบายดีไหม";
      } else if (phrase.includes("สบายดี") && phrase.includes("|")) {
        if (variant === "friend") {
          videoFileName = "ไม่สบายใจ";
        } else {
          videoFileName = "สบายดี";
        }
      }
    }

    // Remove question marks from Q&A category video filenames
    if (category === "qa") {
      videoFileName = videoFileName.replace("?", "");
    }

    return getVideoUrl(category, videoFileName);
  };

  const srcUrl = getVideoSrc();

  return (
    <VideoPlayer
      key={srcUrl}
      src={srcUrl}
      className="w-full h-full object-cover rounded-xl pointer-events-none" // 🚨 เพิ่ม pointer-events-none ตรงนี้
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      // 👇 เพิ่ม attributes เหล่านี้ด้วยเพื่อความชัวร์ (บางที VideoPlayer ของคุณอาจจะไม่ได้ส่งผ่านไปหมด)
      disablePictureInPicture // ป้องกัน Safari ย่อวิดีโอเป็นกรอบเล็ก
      disableRemotePlayback   // ป้องกันการแชร์ขึ้น AirPlay
    />
  );
}
