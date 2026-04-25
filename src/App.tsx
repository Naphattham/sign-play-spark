import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AudioProvider, useAudio } from "@/lib/audioContext";
import { Volume2, VolumeX } from "lucide-react";
import { getVideoUrl } from "@/lib/categories";
import { VideoPlayer } from "@/components/VideoPlayer";

// Lazy-load heavy pages — code only downloaded when user navigates there
const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CategoryBrowsePage = lazy(() =>
  import("@/components/CategoryBrowsePage").then((m) => ({ default: m.CategoryBrowsePage }))
);
const MatchAndSignPage = lazy(() => import("@/pages/MatchAndSignPage"));
const SignAndMatchPage = lazy(() => import("@/pages/SignAndMatchPage"));
const SignDefenderPage = lazy(() => import("@/pages/SignDefenderPage"));
const SignMasterMemoryPage = lazy(() => import("@/pages/SignMasterMemoryPage"));

// Minimal fallback shown while lazy chunks load
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sq-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sq-pink border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-sq-black/60 text-sm">กำลังโหลด...</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 min before considering it stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 min
      gcTime: 10 * 60 * 1000,
      // Disable refetch on window focus (reduces Firebase reads)
      refetchOnWindowFocus: false,
      // Only retry once on error
      retry: 1,
    },
  },
});

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
  // Preload animated WebM videos via hidden video tags
  return (
    <div style={{ display: "none" }} aria-hidden="true">
      {videoFiles.map((v, index) => (
        <VideoPlayer
          key={index}
          src={getVideoUrl(v.category, v.file)}
          preload="auto"
          muted
          playsInline
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
          <GlobalSoundButton />
        </BrowserRouter>
      </TooltipProvider>
    </AudioProvider>
  </QueryClientProvider>
);

export default App;
