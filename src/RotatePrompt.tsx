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
          <div className="rotate-overlay-icon icon-mask-main" aria-hidden="true" />
          <p className="rotate-overlay-title">Access on computer for the full experience.</p>
          <p className="rotate-overlay-body">Rotate your device.</p>
          <p className="rotate-overlay-body">This experience is designed for landscape mode.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
