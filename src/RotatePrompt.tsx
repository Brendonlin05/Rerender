import { useEffect, useState } from 'react'

export default function RotatePrompt({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    function check() {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsPortrait(isTouch && window.innerHeight > window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  if (isPortrait) {
    return (
      <div className="rotate-overlay">
        <div className="rotate-overlay-inner">
          <svg className="rotate-overlay-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Portrait phone */}
            <rect x="6" y="8" width="20" height="34" rx="3" stroke="currentColor" strokeWidth="2.2" opacity="0.45"/>
            <circle cx="16" cy="37" r="1.8" fill="currentColor" opacity="0.45"/>
            {/* Landscape phone */}
            <rect x="24" y="22" width="34" height="20" rx="3" stroke="currentColor" strokeWidth="2.2"/>
            <circle cx="53" cy="32" r="1.8" fill="currentColor"/>
            {/* Curved arrow */}
            <path d="M20 18 Q22 10 29 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M29 16 L25 14 M29 16 L31 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="rotate-overlay-title">Access on computer for the full experience.</p>
          <p className="rotate-overlay-title">Rotate your device</p>
          <p className="rotate-overlay-body">This experience is designed for landscape mode</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
