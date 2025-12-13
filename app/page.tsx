import Link from 'next/link'
import Navigation from '@/components/Navigation'

const backgroundAnimations = `
  @keyframes animate-gradient {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: animate-gradient 15s ease infinite;
  }

  .particle {
    position: absolute;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
    border-radius: 50%;
    animation: float 20s ease-in-out infinite;
  }

  .particle-1 {
    width: 4px;
    height: 4px;
    top: 20%;
    left: 10%;
    animation-delay: 0s;
    animation-duration: 25s;
  }

  .particle-2 {
    width: 6px;
    height: 6px;
    top: 60%;
    left: 80%;
    animation-delay: 5s;
    animation-duration: 30s;
  }

  .particle-3 {
    width: 3px;
    height: 3px;
    top: 40%;
    left: 60%;
    animation-delay: 10s;
    animation-duration: 22s;
  }

  .particle-4 {
    width: 5px;
    height: 5px;
    top: 80%;
    left: 30%;
    animation-delay: 15s;
    animation-duration: 28s;
  }

  .particle-5 {
    width: 4px;
    height: 4px;
    top: 10%;
    left: 70%;
    animation-delay: 8s;
    animation-duration: 26s;
  }

  .particle-6 {
    width: 3px;
    height: 3px;
    top: 70%;
    left: 20%;
    animation-delay: 12s;
    animation-duration: 24s;
  }

  .particle-7 {
    width: 5px;
    height: 5px;
    top: 30%;
    left: 90%;
    animation-delay: 18s;
    animation-duration: 27s;
  }

  .particle-8 {
    width: 4px;
    height: 4px;
    top: 50%;
    left: 40%;
    animation-delay: 3s;
    animation-duration: 23s;
  }

  .particle-9 {
    width: 7px;
    height: 7px;
    top: 75%;
    left: 65%;
    animation: float-alt 31s ease-in-out infinite;
    animation-delay: 21s;
  }

  .particle-10 {
    width: 2px;
    height: 2px;
    top: 15%;
    left: 25%;
    animation: float-alt 19s ease-in-out infinite;
    animation-delay: 7s;
  }

  .particle-11 {
    width: 5px;
    height: 5px;
    top: 85%;
    left: 75%;
    animation: float 26s ease-in-out infinite;
    animation-delay: 14s;
  }

  .particle-12 {
    width: 3px;
    height: 3px;
    top: 35%;
    left: 15%;
    animation: float-alt 22s ease-in-out infinite;
    animation-delay: 9s;
  }

  .particle-13 {
    width: 6px;
    height: 6px;
    top: 65%;
    left: 45%;
    animation: float 29s ease-in-out infinite;
    animation-delay: 16s;
  }

  .particle-14 {
    width: 4px;
    height: 4px;
    top: 25%;
    left: 85%;
    animation: float-alt 24s ease-in-out infinite;
    animation-delay: 11s;
  }

  .particle-15 {
    width: 3px;
    height: 3px;
    top: 55%;
    left: 5%;
    animation: float 27s ease-in-out infinite;
    animation-delay: 19s;
  }

  .particle-16 {
    width: 5px;
    height: 5px;
    top: 45%;
    left: 95%;
    animation: float-alt 21s ease-in-out infinite;
    animation-delay: 6s;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px) translateX(0px) scale(1);
      opacity: 0.2;
    }
    25% {
      transform: translateY(-25px) translateX(15px) scale(1.2);
      opacity: 0.7;
    }
    50% {
      transform: translateY(-15px) translateX(-20px) scale(0.8);
      opacity: 0.3;
    }
    75% {
      transform: translateY(-30px) translateX(8px) scale(1.1);
      opacity: 0.6;
    }
  }

  @keyframes float-alt {
    0%, 100% {
      transform: translateY(0px) translateX(0px) scale(1);
      opacity: 0.25;
    }
    20% {
      transform: translateY(-18px) translateX(-12px) scale(1.15);
      opacity: 0.65;
    }
    40% {
      transform: translateY(-8px) translateX(18px) scale(0.85);
      opacity: 0.35;
    }
    60% {
      transform: translateY(-22px) translateX(-6px) scale(1.05);
      opacity: 0.55;
    }
    80% {
      transform: translateY(-12px) translateX(12px) scale(0.95);
      opacity: 0.45;
    }
  }
`

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] relative flex flex-col">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#1a1a1a] opacity-30 animate-gradient"></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
        <div className="particle particle-7"></div>
        <div className="particle particle-8"></div>
        <div className="particle particle-9"></div>
        <div className="particle particle-10"></div>
        <div className="particle particle-11"></div>
        <div className="particle particle-12"></div>
        <div className="particle particle-13"></div>
        <div className="particle particle-14"></div>
        <div className="particle particle-15"></div>
        <div className="particle particle-16"></div>
      </div>
      <Navigation currentPath="/" />

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 flex-1 flex items-center justify-center py-8">
        <div className="text-center">
          <h1 className="text-6xl font-semibold text-[#ededed] mb-6 tracking-tight" style={{ fontFamily: 'Anton, sans-serif', letterSpacing: '0.05em' }}>
            EvWrapStudio
          </h1>
          <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto mb-12 font-light">
            Design and explore custom Tesla car wraps. Upload your designs, position them perfectly, and create stunning Tesla wraps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              href="/explore"
              className="px-8 py-4 text-lg font-medium text-[#ededed] rounded-lg border-2 border-[#2a2a2a] bg-[#ededed]/[0.12] hover:bg-[#ededed]/[0.18] hover:border-[#3a3a3a] transition-all transform hover:scale-105"
            >
              Explore Wraps
            </Link>
            <Link
              href="/design"
              className="px-8 py-4 text-lg font-medium text-[#1a1a1a] rounded-lg border-2 border-[#ededed] bg-[#ededed] hover:bg-[#ededed]/90 transition-all transform hover:scale-105"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 pb-4 pt-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex justify-center">
            <div className="flex gap-8 text-xs">
              <a href="/privacy" className="text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer">
                Privacy
              </a>
              <a href="/terms" className="text-[#a0a0a0] hover:text-[#ededed] transition-colors cursor-pointer">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: backgroundAnimations }} />
    </div>
  )
}

