interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "กำลังโหลด..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-sq-cream flex items-center justify-center">
      <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 max-w-md w-full px-4 sm:px-6">
        {/* Animated Hand Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-sq-pink/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-sq-pink p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl sq-border-lg animate-bounce">
            <img 
              src="/LOGO_SignMate.png"
              alt="SignMate Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="brand-font inline-block text-left">
          <div className="text-sign text-sq-pink">
            Sign
          </div>
          <div className="text-mate text-sq-pink">
            Mate
          </div>
        </div>

        {/* Power Bar / Progress Bar */}
        <div className="w-full">
          <div className="relative h-5 sm:h-6 md:h-8 bg-white rounded-lg sm:rounded-xl sq-border overflow-hidden">
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
            <span className="font-bold text-sq-pink text-[10px] sm:text-xs md:text-sm uppercase tracking-wider">{message}</span>
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

          .text-sign {
            font-size: 40px; 
            line-height: 0.8; 
            font-weight: 600;
            position: relative; 
            z-index: 2;
          }

          .text-mate {
            font-size: 40px; 
            line-height: 0.8;
            font-weight: 600;
            margin-top: -2px; 
            margin-left: 60px; 
            position: relative;
            z-index: 1;
          }

          @media (min-width: 640px) {
            .text-sign {
              font-size: 60px;
            }
            .text-mate {
              font-size: 60px;
              margin-left: 85px;
            }
          }

          @media (min-width: 768px) {
            .text-sign {
              font-size: 80px;
            }
            .text-mate {
              font-size: 80px;
              margin-left: 115px;
            }
          }
        `}
      </style>
    </div>
  );
}
