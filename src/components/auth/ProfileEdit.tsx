import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { auth, database, storage } from "@/lib/firebase";
import { ref as dbRef, update, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, onAuthStateChanged } from "firebase/auth";
import { getAvatarUrl } from "@/lib/avatar";

// 🚨 1. Import Library สำหรับบีบอัดรูปภาพ
import imageCompression from "browser-image-compression";

interface ProfileEditProps {
  onBack: () => void;
}

export function ProfileEdit({ onBack }: ProfileEditProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(() => auth.currentUser?.uid ?? null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  // 🚨 ดึงข้อมูลรูปภาพตั้งแต่วินาทีแรกที่โหลด Component ไม่ต้องรอ useEffect 🚨
  const [photoURL, setPhotoURL] = useState<string | null>(() => {
    // 1. ลองดึงจาก Auth ก่อน (ถ้ามี)
    if (auth.currentUser?.photoURL) return auth.currentUser.photoURL;
    // 2. ถ้าดึง Auth ไม่ทัน ให้ดึงจาก LocalStorage ที่เราแอบจำไว้
    return localStorage.getItem("cached_avatar");
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // Reset form และโหลดข้อมูลใหม่ทุกครั้งที่ user เปลี่ยน
  useEffect(() => {
    const user = auth.currentUser;

    // Reset form state
    setUsername(user?.displayName || "");
    setBio("");
    setPhotoURL(user?.photoURL || localStorage.getItem("cached_avatar"));
    setImageSrc(null);
    setShowCropper(false);
    setCroppedArea(null);
    setIsSaving(false);
    setImageError(false);
    setPoints(0);

    if (!user) return;

    // Load additional data from database asynchronously (non-blocking)
    const loadDatabaseData = async () => {
      try {
        const userRef = dbRef(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();

          if (userData.bio !== undefined) setBio(userData.bio);
          if (userData.points !== undefined) setPoints(userData.points);
          setPhotoURL(prev => prev || userData.photoURL);
        }
      } catch (error) {
        console.error("Error loading database data:", error);
      }
    };

    loadDatabaseData();
  }, [userId]);

  const createCroppedImage = async (
    imageSrc: string,
    croppedAreaPixels: Area
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/webp", 1.0); // ใช้ Quality 1.0 ตรงนี้เพราะเดี๋ยวเราไปบีบอัดต่อ
    });
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropDone = async () => {
    if (!imageSrc || !croppedArea) return;

    try {
      const croppedBlob = await createCroppedImage(imageSrc, croppedArea);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setPhotoURL(croppedUrl);
      setImageError(false); // Reset error state
      setShowCropper(false);
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let uploadedPhotoURL = user.photoURL;

      // ถ้ามีการอัปโหลดและ Crop รูปใหม่
      if (imageSrc && croppedArea && photoURL?.startsWith("blob:")) {
        // 🚨 ใช้ fetch ดึง Blob จาก Object URL ที่เรามีอยู่แล้ว ไม่ต้องไป Render Canvas ใหม่
        const croppedBlob = await fetch(photoURL).then(r => r.blob());

        // 🚨 2. บีบอัดและแปลงรูปภาพให้เป็น WebP ขนาดไม่เกิน 50KB
        const compressionOptions = {
          maxSizeMB: 0.05,        // ลดขนาดให้ไม่เกิน 0.05 MB (50 KB)
          maxWidthOrHeight: 200,  // ลดความละเอียดกว้าง/ยาวสูงสุดแค่ 200px
          useWebWorker: true,
          initialQuality: 0.8,    // ปรับ Quality เป็น 80% สำหรับ WebP
          fileType: "image/webp", // 🚨 สั่งให้แปลงเป็นนามสกุล WebP
        };

        // แปลง Blob ที่ผ่านการบีบอัดแล้ว
        const compressedBlob = await imageCompression(croppedBlob as File, compressionOptions);

        // 🚨 3. ตั้งชื่อไฟล์เป็น .webp และเปลี่ยน contentType
        const fileName = `profile-photos/${user.uid}/${Date.now()}.webp`;
        const imageRef = storageRef(storage, fileName);

        const metadata = {
          cacheControl: 'public,max-age=31536000',
          contentType: 'image/webp', // 🚨 บันทึกเป็น WebP
        };

        // อัปโหลดไฟล์ที่โดนบีบอัดพร้อมยัด Metadata เข้าไป
        await uploadBytes(imageRef, compressedBlob, metadata);
        uploadedPhotoURL = await getDownloadURL(imageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: username,
        photoURL: uploadedPhotoURL,
      });

      // Update Realtime Database
      const userRef = dbRef(database, `users/${user.uid}`);
      await update(userRef, {
        username: username,
        displayName: username,
        photoURL: uploadedPhotoURL,
        updatedAt: new Date().toISOString(),
      });

      // Update local photo URL if it was uploaded
      if (uploadedPhotoURL && uploadedPhotoURL !== user.photoURL) {
        setPhotoURL(uploadedPhotoURL);
        setImageError(false); // Reset error state

        // 🚨 แอบจำ URL รูปใหม่ไว้ในเครื่อง เวลากดเข้ามาคราวหน้าจะได้โหลดทันที
        localStorage.setItem("cached_avatar", uploadedPhotoURL);
      }

      // Clear the temporary blob URL
      if (photoURL?.startsWith('blob:')) {
        URL.revokeObjectURL(photoURL);
      }

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
        variant: "success",
        duration: 3000,
      });

    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-6rem)] w-full pb-2">
      <button onClick={onBack} className="brutal-btn-secondary w-fit flex items-center gap-2 text-sm mb-6 transition-all duration-300 ease-in-out hover:brightness-105">
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <div className="w-full max-w-lg mx-auto brutal-card-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-accent border-b-[3px] border-foreground px-3 py-2 sm:px-5 sm:py-3">
          <h2 className="font-display text-lg sm:text-xl text-accent-foreground">Edit Profile</h2>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
          {/* Avatar and User Info */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-[3px] border-foreground bg-secondary flex items-center justify-center text-3xl font-display text-secondary-foreground overflow-hidden" style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}>
              <img
                src={photoURL && !imageError ? photoURL : getAvatarUrl(null, username || auth.currentUser?.email || "user")}
                alt="Avatar"
                className="w-full h-full object-cover bg-slate-200" // เพิ่ม bg-slate-200 เป็นสีพื้นหลังรอตอนโหลด
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;

                  if (!imageError) {
                    setImageError(true);
                    // Set fallback immediately
                    img.src = getAvatarUrl(null, username || auth.currentUser?.email || "user");
                  }
                }}
                onLoad={() => {

                }}
              />
            </div>
            <label className="brutal-btn-secondary flex items-center gap-2 text-sm cursor-pointer transition-all duration-300 ease-in-out hover:brightness-105">
              <Upload size={14} />
              {photoURL && !photoURL.startsWith('blob:') && !imageError ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Cropper Modal */}
          <Dialog open={showCropper} onOpenChange={setShowCropper}>
            <DialogContent className="brutal-card-lg w-[92vw] sm:w-full max-w-lg p-4 sm:p-6 rounded-2xl gap-3 sm:gap-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-lg sm:text-xl">Crop Your Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div className="relative w-full h-56 sm:h-64 md:h-80 border-[3px] border-foreground rounded-lg overflow-hidden bg-foreground shrink-0">
                  {imageSrc && (
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold font-body">Zoom:</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button onClick={handleCropDone} className="brutal-btn-primary flex items-center gap-2 text-sm transition-all duration-300 ease-in-out hover:brightness-110">
                    <Check size={16} />
                    Done
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Fields */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold font-body">Display Name</label>
              <span className="text-xs text-muted-foreground font-body">{username.length}/30</span>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="brutal-input w-full font-body"
            />
          </div>

          {/* Points Display */}
          <div>
            <label className="block text-sm font-semibold font-body mb-1">คะแนนทั้งหมด</label>
            <div className="brutal-card flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-muted-foreground">Total Points</span>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-primary">{points.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full brutal-btn-primary py-3 font-body flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out hover:brightness-110"
          >
            <Check size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Powered by */}
      <div className="w-full mt-auto pt-10 mb-6 flex flex-col items-center justify-center gap-2 md:gap-3 text-[10px] sm:text-xs text-sq-black/70 font-medium">

        {/* ส่วนที่ 1: BU - Mobile อยู่บรรทัดเดียวกัน / Desktop เรียงต่อกับส่วนอื่น */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">

          <div className="flex flex-row items-center gap-2">
            <span className="whitespace-nowrap">Powered by</span>
            <div className="flex items-center gap-2">
              <img src="/ONLYBU_LOGO.webp" alt="BU Logo" className="h-5 md:h-7 object-contain" />
              <a href="https://www.bu.ac.th/th/engineering/ai-engineering-datascience" target="_blank" rel="noopener noreferrer" className="hover:underline whitespace-nowrap">
                School of Engineering · Bangkok University
              </a>
            </div>
          </div>

          {/* เครื่องหมาย & แสดงเฉพาะ Desktop */}
          <span className="hidden md:inline text-sq-black/40">&</span>

          {/* ส่วนที่ 2: Suan Dusit - Mobile อยู่บรรทัดเดียวกัน */}
          <div className="flex flex-row items-center gap-2">
            {/* แก้ตรงนี้: md:hidden จะทำให้หายไปใน Desktop และแสดงผลเฉพาะบน Mobile */}
            <span className="whitespace-nowrap md:hidden">Associate with</span>

            <div className="flex items-center gap-2">
              <img src="/SuanDusit_LOGO.webp" alt="Suan Dusit Logo" className="h-5 md:h-7 object-contain" />
              <span className="whitespace-nowrap">Suan Dusit University</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}