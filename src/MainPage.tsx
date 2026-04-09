import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import WebcamHands, { type HandCircle } from './WebcamHands'
import AsciiRenderer from './AsciiRenderer'
import ParametersPanel from './ParametersPanel'
import {
  buildShareQuery,
  hasShareParamsInSearch,
  mergeShareSettings,
  parseShareSearch,
} from './shareParams'

const BRAND_COLORS = ['#C4FDF6', '#FF5B28', '#3ED87D', '#EC6CCD', '#BEA5F6', '#FDFDFD']
const COLOR_LABELS = ['(Arctic)', '(Tomato)', '(Seagreen)', '(Orchid)', '(Plum)', '(Ivory)']

export default function MainPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadedBlobUrlRef = useRef<string | null>(null)

  const shareSeed = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : ''
    if (!hasShareParamsInSearch(search)) return null
    return mergeShareSettings(parseShareSearch(search))
  }, [])

  const [videoSrc, setVideoSrc] = useState('/defaultscene.mp4')
  const [colorIdx,   setColorIdx]   = useState(() => shareSeed?.colorIdx ?? 0)
  const [paused,     setPaused]     = useState(false)
  const [pixelSize,  setPixelSize]  = useState(() => shareSeed?.pixelSize ?? 20)
  const [charStyle,  setCharStyle]  = useState(() => shareSeed?.charStyle ?? 'Full')
  const [pixelBg,    setPixelBg]    = useState(() => shareSeed?.pixelBg ?? true)
  const [shareNotice, setShareNotice] = useState('')
  const [hands, setHands] = useState<HandCircle[]>([])
  const handleHandsUpdate = useCallback((h: HandCircle[]) => setHands(h), [])
  const [spinning, setSpinning] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const hasCycled = useRef(false)

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--brand', BRAND_COLORS[colorIdx])
  }, [colorIdx])

  useEffect(() => {
    if (!hasCycled.current) return
    const target = COLOR_LABELS[colorIdx]
    setTypewriterText('')
    if (!target) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setTypewriterText(target.slice(0, i))
      if (i >= target.length) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [colorIdx])

  function handleColorCycle() {
    if (spinning) return
    setSpinning(true)
    setTimeout(() => {
      hasCycled.current = true
      const next = (colorIdx + 1) % BRAND_COLORS.length
      setColorIdx(next)
    }, 150)
  }

  function handleTogglePause() { setPaused(p => !p) }

  function handleColorSelect(idx: number) {
    setColorIdx(idx)
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleVideoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const nextUrl = URL.createObjectURL(file)
    const prev = uploadedBlobUrlRef.current
    uploadedBlobUrlRef.current = nextUrl
    setVideoSrc(nextUrl)
    if (prev) URL.revokeObjectURL(prev)
    e.target.value = ''
  }

  useEffect(() => () => {
    if (uploadedBlobUrlRef.current) URL.revokeObjectURL(uploadedBlobUrlRef.current)
  }, [])

  function handleBack() {
    window.location.href = '/'
  }

  const handleShareParameters = useCallback(async () => {
    const q = buildShareQuery({ colorIdx, pixelSize, charStyle, pixelBg })
    const url = new URL('app', `${window.location.origin}/`)
    url.search = q
    const href = url.toString()
    try {
      await navigator.clipboard.writeText(href)
      setShareNotice('Copied!')
      window.setTimeout(() => setShareNotice(''), 2500)
    } catch {
      window.prompt('Copy this link:', href)
    }
  }, [colorIdx, pixelSize, charStyle, pixelBg])

  return (
    <div className="main-layout">
      {/* ── Left sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="icon-mask-main sidebar-icon" aria-hidden="true" />
          <span className="sidebar-logo">Rerender</span>
        </div>
        <hr className="sidebar-rule" />

        <div className="sidebar-section sidebar-play-section">
          <p className="sidebar-play-label">How to Play</p>
          <p className="sidebar-play-text">
            Hold your hand up in front of the camera. Play with your own memories in ASCII.
          </p>
          <p className="sidebar-play-text" style={{ marginTop: '1em' }}>
            Upload your own video from the parameters panel, or share a link with your current settings encoded so anyone can share your memory.
          </p>
        </div>

        <hr className="sidebar-rule" />

        <div className="sidebar-section">
          <p className="sidebar-about-label">About</p>
          <p className="sidebar-about-text">
            This project was inspired by something I noticed in my own work with motion graphics — a shift to more node-based, math-based, generated animation. I see this shift also happening in aesthetics and trends around me, moving into an ASCII aesthetic that almost describes our current age: fast developing AI tools and systems and a new relationship with information, code, and characters.
          </p>
          <p className="sidebar-about-text" style={{ marginTop: '1em' }}>
            Rendered is my playing and rebelling with that shift with added human participation.
          </p>
        </div>

        <div className="sidebar-footer">
          <span>Last Updated: 04.15.2026</span>
          <span>Brendon Lin</span>
        </div>
      </aside>

      {/* ── Middle column ── */}
      <div className="mid-col">
        <button className="mid-back" onClick={handleBack} aria-label="Go back"><div className="icon-mask-arrow arrow-icon arrow-left arrow-back" aria-hidden="true" /></button>
        <span className="mid-label mid-about">LANDING</span>
        <div
          className={`icon-mask-main mid-icon${spinning ? ' spinning' : ''}`}
          onClick={handleColorCycle}
          onAnimationEnd={() => setSpinning(false)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleColorCycle()}
          aria-label="Cycle brand color"
        />
        <div className="icon-mask-arrow arrow-icon arrow-up arrow-clickme" aria-hidden="true" />
        <span className="mid-label mid-click">CLICK ME</span>
        {typewriterText && <span className="mid-color-label">{typewriterText}</span>}
      </div>

      {/* ── Main video area ── */}
      <main className="video-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleVideoFileChange}
        />
        <AsciiRenderer
          hands={hands}
          paused={paused}
          pixelSize={pixelSize}
          charStyle={charStyle}
          pixelBg={pixelBg}
          videoSrc={videoSrc}
          brandColor={BRAND_COLORS[colorIdx]}
        />
        {/* ── Right stack: webcam + parameters, same width, stacked ── */}
        <div className="right-stack" onClick={e => e.stopPropagation()}>
          <WebcamHands onHandsUpdate={handleHandsUpdate} />
          <ParametersPanel
            colorIdx={colorIdx}
            onColorSelect={handleColorSelect}
            paused={paused}
            onTogglePause={handleTogglePause}
            pixelSize={pixelSize}
            onPixelSizeChange={setPixelSize}
            charStyle={charStyle}
            onCharStyleChange={setCharStyle}
            pixelBg={pixelBg}
            onPixelBgChange={setPixelBg}
            onUploadClick={handleUploadClick}
            onShareClick={handleShareParameters}
            shareNotice={shareNotice}
          />
        </div>
      </main>
    </div>
  )
}
