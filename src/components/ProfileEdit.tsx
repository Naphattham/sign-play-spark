import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ArrowLeft, Upload, Check } from "lucide-react";

interface ProfileEditProps {
  onBack: () => void;
}

export function ProfileEdit({ onBack }: ProfileEditProps) {
  const [username, setUsername] = useState("SignMaster99");
  const [bio, setBio] = useState("Learning sign language one gesture at a time!");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

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

  const handleCropDone = () => {
    setShowCropper(false);
    // In a real app, you'd generate the cropped image here
  };

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack} className="brutal-btn-secondary flex items-center gap-2 text-sm mb-6">
        <ArrowLeft size={16} />
        Back to Game
      </button>

      <div className="brutal-card-lg overflow-hidden">
        <div className="bg-accent border-b-[3px] border-foreground px-5 py-3">
          <h2 className="font-display text-xl text-accent-foreground">Edit Profile</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            {showCropper && imageSrc ? (
              <div className="w-full">
                <div className="relative w-full h-64 border-[3px] border-foreground rounded-lg overflow-hidden bg-foreground">
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
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button onClick={handleCropDone} className="brutal-btn-primary flex items-center gap-1 text-sm">
                    <Check size={14} />
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full border-[3px] border-foreground bg-secondary flex items-center justify-center text-3xl font-display text-secondary-foreground" style={{ boxShadow: "3px 3px 0px 0px hsl(0 0% 0%)" }}>
                  {imageSrc ? (
                    <img src={imageSrc} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    username[0]?.toUpperCase()
                  )}
                </div>
                <label className="brutal-btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                  <Upload size={14} />
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </>
            )}
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-semibold font-body mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="brutal-input w-full font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold font-body mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="brutal-input w-full font-body resize-none"
            />
          </div>

          <button className="w-full brutal-btn-primary py-3 font-body flex items-center justify-center gap-2">
            <Check size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
