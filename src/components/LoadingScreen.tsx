interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "กำลังโหลด..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-sq-cream flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md w-full px-6">
        {/* Animated Hand Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-sq-pink/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-sq-pink p-8 rounded-3xl sq-border-lg animate-bounce">
            <img 
              src="/src/asset/image/LOGO_SignMate.png"
              alt="SignMate Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="brand-font text-3xl text-sq-pink">
          SignMate
        </h2>

        {/* Power Bar / Progress Bar */}
        <div className="w-full">
          <div className="relative h-8 bg-white rounded-xl sq-border overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #1A1A1A 10px, #1A1A1A 12px)'
              }}></div>
            </div>
            
            {/* Progress fill */}
            <div className="power-bar-fill absolute inset-0 bg-gradient-to-r from-sq-yellow via-sq-pink to-sq-yellow bg-[length:200%_100%]"></div>
            
            {/* Shine effect */}
            <div className="shine-effect absolute inset-0"></div>
          </div>
          
          {/* Power text */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {/* <span className="text-yellow-500 text-xl">⚡</span> */}
            <span className="font-bold text-sq-pink text-sm uppercase tracking-wider">{message}</span>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes powerBarFill {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          
          @keyframes shine {
            0% {
              transform: translateX(-100%) skewX(-15deg);
            }
            100% {
              transform: translateX(200%) skewX(-15deg);
            }
          }
          
          .power-bar-fill {
            animation: powerBarFill 3s ease-in-out infinite, shimmer 3s linear infinite;
          }
          
          .shine-effect {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
            animation: shine 3s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
