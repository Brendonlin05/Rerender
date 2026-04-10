import { useEffect, useRef } from 'react'

const CHARS = '` . \' ^ , : ; ! i I l | \\ / 1 [ ] ( ) ? - _ + ~ < > t f r j x v c z n u X Y J C L Q 0 O Z m w q p d b k h a o * # % W M & 8 B @ $ ░ ▒ ▓ ▌ █'
  .split(' ')
  .filter(Boolean)

const GLYPH_CHARS = ['`', '.', "'", '^', ',', ':', ';', '!', 'i', 'I', 'l', '|', '\\', '/', '1', '[', ']', '(', ')', '?', '-', '_', '+', '~', '<', '>', 't', 'f', 'r', 'j', 'x', 'v', 'c', 'z', 'n', 'u', 'X', 'Y', 'J', 'C', 'L', 'Q', '0', 'O', 'Z', 'm', 'w', 'q', 'p', 'd', 'b', 'k', 'h', 'a', 'o', '*', '#', '%', 'W', 'M', '&', '8', 'B', '@', '$', '░', '▒', '▓', '▌', '█']

export default function LandingPage() {
  const bgRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return

    let cols: number, rows: number
    let phases: number[] = []
    let rafId: number

    function initGrid() {
      const W = window.innerWidth
      const H = window.innerHeight
      const charW = 8, charH = 13 * 1.4
      cols = Math.ceil(W / charW)
      rows = Math.ceil(H / charH)
      phases = Array.from({ length: rows * cols }, () => Math.random() * CHARS.length)
    }

    function renderBg() {
      let out = ''
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          phases[idx] = (phases[idx] + 0.012) % CHARS.length
          out += CHARS[Math.floor(phases[idx])]
        }
        out += '\n'
      }
      if (bg) bg.textContent = out
      rafId = requestAnimationFrame(renderBg)
    }

    initGrid()
    renderBg()
    window.addEventListener('resize', initGrid)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', initGrid)
    }
  }, [])

  useEffect(() => {
    const glyph = glyphRef.current
    if (!glyph) return
    let gi = 0
    const interval = setInterval(() => {
      gi = (gi + 1) % GLYPH_CHARS.length
      glyph.textContent = GLYPH_CHARS[gi]
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="page">
      <div id="ascii-bg" ref={bgRef} aria-hidden="true" />

      <section className="hero">
        <div className="logo">
          <span className="logo-word">Rerender</span>
          <span className="logo-glyph" ref={glyphRef}>░</span>
        </div>
      </section>

      <div className="bottom">
        <div className="about-block">
{`About

This project was inspired by something I noticed in my own work with motion graphics -- a shift to increasingly node-based, math-based, generated visuals and animation. I see this shift also happening in the design around me, shaping aesthetics into something closer to the ASCII style: a reflection of our moment, defined by AI and new interpretations to code, symbols, graphics, and information.

Rerender is me playing with that shift while rebelling against it -- reintroducing human participation.`}
        </div>

        <div className="play-block">
          <span className="play-label">Play</span>
          <span className="play-body">
            Hold your hands up in front of the camera. Play with your own memories in ASCII.{'\n\n'}
            Share a link with your current settings encoded so anyone who opens it shares your memory.
          </span>
          <a href="/app" className="enter-link"><div className="icon-mask-arrow arrow-icon arrow-right" aria-hidden="true" />ENTER SITE</a>
        </div>
      </div>
    </div>
  )
}