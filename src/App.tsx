import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { CategoryBrowsePage } from "@/components/CategoryBrowsePage";
import { GameSetupPage } from "@/components/GameSetupPage";
import MatchAndSignPage from "@/pages/MatchAndSignPage";
import SignAndMatchPage from "@/pages/SignAndMatchPage";
import SignDefenderPage from "@/pages/SignDefenderPage";
import SignMasterMemoryPage from "@/pages/SignMasterMemoryPage";
import { AudioProvider, useAudio } from "@/lib/audioContext";
import { Volume2, VolumeX } from "lucide-react";
import { getVideoUrl } from "@/lib/categories";

const queryClient = new QueryClient();

/** Floating mute button — visible on every page */
function GlobalSoundButton() {
  const { isMuted, toggleMute } = useAudio();
  return (
    <button
      id="global-sound-toggle"
      onClick={toggleMute}
      title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
      className="fixed bottom-5 right-5 z-[9999] flex items-center justify-center w-11 h-11 rounded-full bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
    >
      {isMuted ? (
        <VolumeX size={18} className="text-black" />
      ) : (
        <Volume2 size={18} className="text-black" />
      )}
    </button>
  );
}

const PRELOAD_VIDEOS = [
  { category: "general", file: "สวัสดี (ผู้ใหญ่)main" },
  { category: "general", file: "สวัสดี (เพื่อน)main" },
];

function GlobalVideoPreloader({ videoFiles }: { videoFiles: { category: string, file: string }[] }) {
  // Preload animated WebP images via hidden img tags
  return (
    <div style={{ display: "none" }} aria-hidden="true">
      {videoFiles.map((v, index) => (
        <img
          key={index}
          src={getVideoUrl(v.category, v.file)}
          loading="eager"
          alt=""
        />
      ))}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AudioProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <GlobalVideoPreloader videoFiles={PRELOAD_VIDEOS} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categories" element={<CategoryBrowsePage />} />
            {/* <Route path="/game-setup" element={<GameSetupPage />} /> */}
            <Route path="/match-and-sign" element={<MatchAndSignPage />} />
            <Route path="/sign-and-match" element={<SignAndMatchPage />} />
            <Route path="/sign-defender" element={<SignDefenderPage />} />
            <Route path="/sign-master-memory" element={<SignMasterMemoryPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalSoundButton />
        </BrowserRouter>
      </TooltipProvider>
    </AudioProvider>
  </QueryClientProvider>
);

export default App;
