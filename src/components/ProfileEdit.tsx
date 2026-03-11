import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { auth, database, storage } from "@/lib/firebase";
import { ref as dbRef, update, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { getAvatarUrl } from "@/lib/avatar";

interface ProfileEditProps {
  onBack: () => void;
}

export function ProfileEdit({ onBack }: ProfileEditProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [points, setPoints] = useState(0);

  // Load user data on mount - Optimized for fast profile photo display
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Set initial data immediately from auth.currentUser (no await, instant!)
    setUsername(user.displayName || "");
    setPhotoURL(user.photoURL || null);

    console.log("Initial user data loaded:", {
      displayName: user.displayName,
      photoURL: user.photoURL,
      email: user.email
    });

    // Load additional data from database asynchronously (non-blocking)
    const loadDatabaseData = async () => {
      try {
        const userRef = dbRef(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          console.log("Database data loaded:", userData);
          
          // Update with database values if available
          if (userData.bio !== undefined) setBio(userData.bio);
          if (userData.points !== undefined) setPoints(userData.points);
          if (userData.photoURL) setPhotoURL(userData.photoURL);
        }
      } catch (error) {
        console.error("Error loading database data:", error);
      }
    };

    loadDatabaseData();
  }, []);

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
      }, "image/jpeg");
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
      console.log("Image cropped successfully");
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

      // If there's a new cropped image, upload it
      if (imageSrc && croppedArea && photoURL?.startsWith("blob:")) {
        const croppedBlob = await createCroppedImage(imageSrc, croppedArea);
        const fileName = `profile-photos/${user.uid}/${Date.now()}.jpg`;
        const imageRef = storageRef(storage, fileName);
        await uploadBytes(imageRef, croppedBlob);
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

      console.log("Profile saved successfully");
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
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="brutal-btn-secondary flex items-center gap-2 text-sm mb-6">
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <div className="brutal-card-lg overflow-hidden">
        <div className="bg-accent border-b-[3px] border-foreground px-5 py-3">
          <h2 className="font-display text-xl text-accent-foreground">Edit Profile</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar and User Info */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-[3px] border-foreground bg-secondary flex items-center justify-center text-3xl font-display text-secondary-foreground overflow-hidden" style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}>
              <img 
                src={photoURL && !imageError ? photoURL : getAvatarUrl(null, username || auth.currentUser?.email || "user")} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log("Image failed to load:", photoURL);
                  console.log("Will use fallback avatar");
                  if (!imageError) {
                    setImageError(true);
                    // Set fallback immediately
                    img.src = getAvatarUrl(null, username || auth.currentUser?.email || "user");
                  }
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", photoURL || "generated avatar");
                }}
              />
            </div>
            <label className="brutal-btn-secondary flex items-center gap-2 text-sm cursor-pointer">
              <Upload size={14} />
              {photoURL && !photoURL.startsWith('blob:') && !imageError ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Cropper Modal */}
          <Dialog open={showCropper} onOpenChange={setShowCropper}>
            <DialogContent className="brutal-card-lg max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Crop Your Photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative w-full h-96 border-[3px] border-foreground rounded-lg overflow-hidden bg-foreground">
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
                  <button onClick={handleCropDone} className="brutal-btn-primary flex items-center gap-2 text-sm">
                    <Check size={16} />
                    Done
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Fields */}
          <div>
            <label className="block text-sm font-semibold font-body mb-1">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            className="w-full brutal-btn-primary py-3 font-body flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
